import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { QueueService } from '../queue/queue.service';
import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';

interface ChangeStreamDocument {
  operationType: string;
  documentKey: { _id: ObjectId };
  fullDocument?: Record<string, any>;
  updateDescription?: Record<string, any>;
}

@Injectable()
export class CdcService implements OnModuleInit {
  private readonly logger = new Logger(CdcService.name);
  private changeStreams: { close: () => Promise<void> }[] = [];
  private usePolling = false;
  private lastProcessedIds: Record<string, Set<string>> = {
    orders: new Set<string>(),
    devices: new Set<string>(),
    useractivities: new Set<string>(),
  };
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly isLocalEnvironment: boolean;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {
    const mongoUri = this.configService.get<string>('mongodb.uri');
    this.isLocalEnvironment = mongoUri?.includes('localhost') || false;
  }

  onModuleInit() {
    this.initializeChangeDetection();
    this.logger.log('Change Data Capture service initialized');
  }

  initializeChangeDetection() {
    try {
      // When running locally, default to polling
      if (this.isLocalEnvironment) {
        this.logger.log(
          'Running in local environment, using polling strategy for change detection',
        );
        this.usePolling = true;
        this.startPolling();
        return;
      }

      // Try to use Change Streams (preferred method) for non-local environments
      this.startChangeStreams();
    } catch (error) {
      this.logger.warn(
        `Change Streams not supported (requires MongoDB replica set). Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      this.logger.log('Falling back to polling strategy for change detection');
      this.usePolling = true;
      this.startPolling();
    }
  }

  startPolling() {
    // Set up manual polling every 5 seconds instead of using @Interval decorator
    this.pollInterval = setInterval(() => {
      this.pollForChanges();
    }, 5000);
  }

  async pollForChanges() {
    if (!this.usePolling) {
      return; // Only use polling if Change Streams aren't available
    }

    await this.pollCollection('orders');
    await this.pollCollection('devices');
    await this.pollCollection('useractivities');
  }

  startChangeStreams() {
    try {
      // Start monitoring Order collection
      const orderChangeStream = this.connection.collection('orders').watch([], {
        fullDocument: 'updateLookup',
      });

      orderChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.logger.log(
          `Change detected in orders collection: ${change.operationType}`,
        );
        this.processChange('orders', change).catch((error: Error) => {
          this.logger.error(`Error processing order change: ${error.message}`);
        });
      });

      // Start monitoring Device collection
      const deviceChangeStream = this.connection
        .collection('devices')
        .watch([], {
          fullDocument: 'updateLookup',
        });

      deviceChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.logger.log(
          `Change detected in devices collection: ${change.operationType}`,
        );
        this.processChange('devices', change).catch((error: Error) => {
          this.logger.error(`Error processing device change: ${error.message}`);
        });
      });

      // Start monitoring UserActivity collection
      const userActivityChangeStream = this.connection
        .collection('useractivities')
        .watch([], {
          fullDocument: 'updateLookup',
        });

      userActivityChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.logger.log(
          `Change detected in useractivities collection: ${change.operationType}`,
        );
        this.processChange('useractivities', change).catch((error: Error) => {
          this.logger.error(
            `Error processing user activity change: ${error.message}`,
          );
        });
      });

      // Store change streams to close them properly on app shutdown
      this.changeStreams.push(
        orderChangeStream as unknown as { close: () => Promise<void> },
        deviceChangeStream as unknown as { close: () => Promise<void> },
        userActivityChangeStream as unknown as { close: () => Promise<void> },
      );
    } catch (error) {
      this.logger.error('Error setting up change streams', error);
      throw error; // Rethrow so we can fall back to polling
    }
  }

  private async pollCollection(collectionName: string) {
    try {
      const collection = this.connection.collection(collectionName);

      // Get the most recent 100 documents, sorted by _id (which contains timestamp)
      const documents = await collection
        .find()
        .sort({ _id: -1 })
        .limit(100)
        .toArray();

      for (const doc of documents) {
        const docId = doc._id.toString();
        const collectionSet = this.lastProcessedIds[collectionName];

        // Skip if we've already processed this document
        if (collectionSet.has(docId)) {
          continue;
        }

        // Add to processed set to avoid duplicate processing
        collectionSet.add(docId);

        // Trim the set if it gets too large to prevent memory issues
        if (collectionSet.size > 1000) {
          this.lastProcessedIds[collectionName] = new Set(
            Array.from(collectionSet).slice(-500),
          );
        }

        // Process the document as if it was a change
        const change: ChangeStreamDocument = {
          operationType: 'insert', // Assume insert, though this could be inaccurate
          documentKey: { _id: doc._id },
          fullDocument: doc,
          updateDescription: {},
        };

        this.logger.log(
          `Poll detected document in ${collectionName} collection`,
        );
        await this.processChange(collectionName, change);
      }
    } catch (error) {
      this.logger.error(`Error polling ${collectionName} collection`, error);
    }
  }

  async processChange(collectionName: string, change: ChangeStreamDocument) {
    try {
      // Prepare the change data
      const changeData = {
        collection: collectionName,
        operationType: change.operationType,
        documentKey: change.documentKey,
        fullDocument: change.fullDocument || ({} as Record<string, any>),
        updateDescription:
          change.updateDescription || ({} as Record<string, any>),
        timestamp: new Date(),
      };

      // Send to message queue
      await this.queueService.sendToQueue(changeData);
    } catch (error) {
      this.logger.error(`Error processing change for ${collectionName}`, error);
    }
  }

  async closeChangeStreams() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    for (const stream of this.changeStreams) {
      try {
        await stream.close();
      } catch (error) {
        this.logger.error('Error closing change stream', error);
      }
    }
    this.changeStreams = [];
  }
}
