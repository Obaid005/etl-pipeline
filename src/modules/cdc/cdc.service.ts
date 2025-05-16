import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
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
export class CdcService implements OnModuleInit, OnModuleDestroy {
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
  private readonly dbName: string;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {
    const mongoUri = this.configService.get<string>('mongodb.uri');
    this.isLocalEnvironment = mongoUri?.includes('localhost') || false;

    // Extract database name from URI
    const dbNameMatch = mongoUri?.match(/\/([^/?]+)(\?|$)/);
    this.dbName = dbNameMatch?.[1] || 'etl-pipeline';

    this.logger.log(`CDC service initialized with database: ${this.dbName}`);
    this.logger.log(
      `Environment: ${this.isLocalEnvironment ? 'Local' : 'Production'}`,
    );
  }

  onModuleInit() {
    this.initializeChangeDetection();
    this.logger.log('Change Data Capture service initialized');
  }

  async onModuleDestroy() {
    await this.closeChangeStreams();
    this.logger.log('Change Data Capture service cleaned up');
  }

  initializeChangeDetection() {
    this.logger.log('Starting Change Detection initialization...');

    try {
      // Always try Change Streams first, regardless of environment
      this.logger.log(
        'Attempting to use Change Streams for real-time change detection',
      );
      this.startChangeStreams();
      this.logger.log('✅ Successfully initialized Change Streams');
    } catch (error) {
      this.logger.warn(
        `⚠️ Change Streams not supported or failed to initialize. Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      this.logger.log('Falling back to polling strategy for change detection');
      this.usePolling = true;
      this.startPolling();
    }
  }

  startPolling() {
    this.logger.log('Starting polling mechanism for change detection');
    // Set up manual polling every 5 seconds
    this.pollInterval = setInterval(() => {
      this.pollForChanges();
    }, 5000);
    this.logger.log('✅ Polling mechanism initialized successfully');
  }

  async pollForChanges() {
    if (!this.usePolling) {
      return; // Only use polling if Change Streams aren't available
    }

    this.logger.debug('Running poll cycle for collections');
    await this.pollCollection('orders');
    await this.pollCollection('devices');
    await this.pollCollection('useractivities');
  }

  startChangeStreams() {
    try {
      this.logger.log('Initializing Change Streams for MongoDB collections');

      // Start monitoring Order collection
      this.logger.log('Setting up Change Stream for orders collection');
      const orderChangeStream = this.connection.collection('orders').watch([], {
        fullDocument: 'updateLookup',
      });

      orderChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.logger.log(
          `🔄 Change detected in orders collection: ${change.operationType}`,
        );
        this.processChange('orders', change).catch((error: Error) => {
          this.logger.error(
            `❌ Error processing order change: ${error.message}`,
          );
        });
      });

      orderChangeStream.on('error', (error) => {
        this.logger.error(`❌ Error in orders Change Stream: ${error.message}`);
        this.handleChangeStreamError('orders');
      });

      // Start monitoring Device collection
      this.logger.log('Setting up Change Stream for devices collection');
      const deviceChangeStream = this.connection
        .collection('devices')
        .watch([], {
          fullDocument: 'updateLookup',
        });

      deviceChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.logger.log(
          `🔄 Change detected in devices collection: ${change.operationType}`,
        );
        this.processChange('devices', change).catch((error: Error) => {
          this.logger.error(
            `❌ Error processing device change: ${error.message}`,
          );
        });
      });

      deviceChangeStream.on('error', (error) => {
        this.logger.error(
          `❌ Error in devices Change Stream: ${error.message}`,
        );
        this.handleChangeStreamError('devices');
      });

      // Start monitoring UserActivity collection
      this.logger.log('Setting up Change Stream for useractivities collection');
      const userActivityChangeStream = this.connection
        .collection('useractivities')
        .watch([], {
          fullDocument: 'updateLookup',
        });

      userActivityChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.logger.log(
          `🔄 Change detected in useractivities collection: ${change.operationType}`,
        );
        this.processChange('useractivities', change).catch((error: Error) => {
          this.logger.error(
            `❌ Error processing user activity change: ${error.message}`,
          );
        });
      });

      userActivityChangeStream.on('error', (error) => {
        this.logger.error(
          `❌ Error in useractivities Change Stream: ${error.message}`,
        );
        this.handleChangeStreamError('useractivities');
      });

      // Store change streams to close them properly on app shutdown
      this.changeStreams.push(
        orderChangeStream as unknown as { close: () => Promise<void> },
        deviceChangeStream as unknown as { close: () => Promise<void> },
        userActivityChangeStream as unknown as { close: () => Promise<void> },
      );

      this.logger.log(
        `✅ Successfully initialized Change Streams for all collections in database '${this.dbName}'`,
      );
    } catch (error) {
      this.logger.error('❌ Error setting up change streams', error);
      throw error; // Rethrow so we can fall back to polling
    }
  }

  private handleChangeStreamError(collectionName: string) {
    // If a change stream errors out, we may want to fall back to polling
    // for that specific collection or all collections
    this.logger.warn(
      `Change Stream for ${collectionName} encountered an error. Consider falling back to polling.`,
    );

    // Currently, we're not automatically switching to polling if a Change Stream fails after initial setup,
    // but you could implement that logic here if desired.

    // Example implementation:
    /*
    if (!this.usePolling) {
      this.usePolling = true;
      this.startPolling();
    }
    */
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

      let processedCount = 0;
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

        await this.processChange(collectionName, change);
        processedCount++;
      }

      if (processedCount > 0) {
        this.logger.log(
          `📊 Poll detected ${processedCount} document(s) in ${collectionName} collection`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Error polling ${collectionName} collection`, error);
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

      this.logger.debug(
        `Processing ${change.operationType} change for ${collectionName}, document ID: ${change.documentKey._id.toString()}`,
      );

      // Send to message queue
      await this.queueService.sendToQueue(changeData);
      this.logger.debug(`✅ Successfully queued change for processing`);
    } catch (error) {
      this.logger.error(
        `❌ Error processing change for ${collectionName}`,
        error,
      );
    }
  }

  async closeChangeStreams() {
    this.logger.log('Cleaning up CDC resources...');

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      this.logger.log('Polling interval cleared');
    }

    if (this.changeStreams.length > 0) {
      this.logger.log(`Closing ${this.changeStreams.length} change streams`);
      for (const stream of this.changeStreams) {
        try {
          await stream.close();
        } catch (error) {
          this.logger.error('Error closing change stream', error);
        }
      }
      this.changeStreams = [];
      this.logger.log('All change streams closed successfully');
    }
  }
}
