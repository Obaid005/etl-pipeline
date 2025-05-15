import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '../queue/queue.service';
import { Interval } from '@nestjs/schedule';
import { WarehouseService } from '../warehouse/warehouse.service';
import * as child_process from 'child_process';

// Adding interfaces for strong typing
interface DocumentKey {
  _id: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

interface OrderDocument {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress?: ShippingAddress;
}

interface DeviceDocument {
  deviceId: string;
  userId: string;
  deviceType: string;
  manufacturer: string;
  model: string;
  osVersion?: string;
  appVersion?: string;
  isActive: boolean;
  lastActive?: Date;
  registrationDate?: Date;
}

interface UserActivityDocument {
  userId: string;
  activityType: string;
  timestamp: Date;
  deviceId?: string;
  ipAddress?: string;
  location?: GeoLocation;
  sessionId?: string;
  duration?: number;
}

interface EnrichedOrderData {
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
  processingDate: string;
}

interface EnrichedDeviceData {
  deviceCategory: string;
  isActive: boolean;
  daysSinceRegistration: number;
  processingDate: string;
}

interface GeoInfo {
  region: string;
  isInternational: boolean;
}

interface EnrichedUserActivityData {
  activityCategory: string;
  timeOfDay: string;
  weekday: string;
  geoInfo: GeoInfo | null;
  processingDate: string;
}

interface ChangeMessage {
  collection: string;
  operationType: string;
  documentKey: DocumentKey;
  fullDocument?:
    | OrderDocument
    | DeviceDocument
    | UserActivityDocument
    | Record<string, any>;
  updateDescription?: Record<string, any>;
  timestamp: string | Date;
}

interface ProcessedData {
  collection: string;
  operationType: string;
  timestamp: string;
  documentId: string;
  data:
    | OrderDocument
    | DeviceDocument
    | UserActivityDocument
    | Record<string, any>;
  enriched:
    | EnrichedOrderData
    | EnrichedDeviceData
    | EnrichedUserActivityData
    | Record<string, any>;
}

@Injectable()
export class SparkService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SparkService.name);
  private sparkSubmitPath: string;
  private batchSize = 10;
  private batchDuration: number;
  private sparkProcess: child_process.ChildProcess | null = null;
  private messageBuffer: ChangeMessage[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    @Inject(forwardRef(() => WarehouseService))
    private readonly warehouseService: WarehouseService,
  ) {
    this.batchDuration =
      this.configService.get<number>('spark.batchDuration') || 10;
    this.sparkSubmitPath = process.env.SPARK_SUBMIT_PATH || 'spark-submit';
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Spark service');

    // Start consuming messages from the queue
    await this.setupQueueConsumer();

    // Start the Apache Spark process (simulated in our case)
    // this.startSparkProcess();

    this.logger.log('Spark service initialized');
  }

  async onModuleDestroy(): Promise<void> {
    // Cleanup resources when the application is shutting down
    if (this.sparkProcess) {
      const killPromise = new Promise<void>((resolve) => {
        this.sparkProcess?.on('close', () => {
          resolve();
        });
        this.sparkProcess?.kill();
      });

      try {
        await killPromise;
        this.logger.log('Spark process terminated');
      } catch (error) {
        this.logger.error('Error terminating Spark process', error);
      }
    }
  }

  private async setupQueueConsumer(): Promise<void> {
    try {
      // Setup a consumer for the queue
      await this.queueService.consumeFromQueue((message: ChangeMessage) => {
        this.logger.debug(`Received message: ${JSON.stringify(message)}`);

        // Add message to buffer for batch processing
        this.messageBuffer.push(message);

        // If buffer reaches batch size, process it immediately
        if (this.messageBuffer.length >= this.batchSize) {
          void this.processBatch([...this.messageBuffer]);
          this.messageBuffer = [];
        }
      });

      this.logger.log('Queue consumer setup successfully');
    } catch (error) {
      this.logger.error('Failed to setup queue consumer', error);
    }
  }

  @Interval(10000) // Process batches every 10 seconds
  async processBatchTimer(): Promise<void> {
    if (this.messageBuffer.length > 0) {
      this.logger.log(
        `Processing batch of ${this.messageBuffer.length} messages`,
      );
      const batchToProcess = [...this.messageBuffer];
      this.messageBuffer = [];
      await this.processBatch(batchToProcess);
    }
  }

  private startSparkProcess(): void {
    // In a real-world scenario, you'd start Spark here
    // This is a simplified version for demonstration
    this.logger.log('Starting Spark process (simulated)');

    /*
    // Actual Spark submit command would look something like:
    const sparkJar = path.join(this.configService.get('spark.jarsDir'), 'etl-pipeline.jar');
    
    if (!fs.existsSync(sparkJar)) {
      this.logger.error(`Spark jar not found: ${sparkJar}`);
      return;
    }
    
    this.sparkProcess = child_process.spawn(this.sparkSubmitPath, [
      '--class', 'com.example.SparkProcessor',
      '--master', this.configService.get('spark.masterUrl'),
      '--name', this.configService.get('spark.appName'),
      sparkJar
    ]);
    
    this.sparkProcess.stdout.on('data', (data) => {
      this.logger.log(`Spark stdout: ${data}`);
    });
    
    this.sparkProcess.stderr.on('data', (data) => {
      this.logger.error(`Spark stderr: ${data}`);
    });
    
    this.sparkProcess.on('close', (code) => {
      this.logger.log(`Spark process exited with code ${code}`);
    });
    */
  }

  async processBatch(batch: ChangeMessage[]): Promise<void> {
    try {
      this.logger.log(`Processing batch of ${batch.length} messages`);

      // In a real-world scenario, this would be done by Spark
      // Here we're simulating Spark's processing in Node.js

      const processedBatch = batch.map((message) =>
        this.transformData(message),
      );

      // Process each collection type separately
      const ordersBatch = processedBatch.filter(
        (item) => item.collection === 'orders',
      );
      const devicesBatch = processedBatch.filter(
        (item) => item.collection === 'devices',
      );
      const userActivitiesBatch = processedBatch.filter(
        (item) => item.collection === 'useractivities',
      );

      this.logger.log(`Processed batch summary:
      - orders: ${ordersBatch.length}
      - devices: ${devicesBatch.length}
      - userActivities: ${userActivitiesBatch.length}`);

      // Log collection values for debugging
      if (userActivitiesBatch.length > 0) {
        this.logger.debug(
          `First user activity item collection: ${userActivitiesBatch[0].collection}`,
        );
      }

      // Send processed data to warehouse
      if (ordersBatch.length > 0) {
        await this.warehouseService.uploadBatch('orders', ordersBatch);
      }

      if (devicesBatch.length > 0) {
        await this.warehouseService.uploadBatch('devices', devicesBatch);
      }

      if (userActivitiesBatch.length > 0) {
        this.logger.log(
          `Sending ${userActivitiesBatch.length} user activities to warehouse`,
        );
        await this.warehouseService.uploadBatch(
          'userActivities', // This matches the expected case in warehouse.service.ts
          userActivitiesBatch,
        );
      }

      this.logger.log('Batch processing completed');
    } catch (error) {
      this.logger.error('Error processing batch', error);
    }
  }

  private transformData(message: ChangeMessage): ProcessedData {
    // In a real Spark job, this would include complex transformations
    // Here we're simulating some basic transformations

    const { collection, operationType, documentKey, fullDocument, timestamp } =
      message;

    // Basic processing based on collection type
    switch (collection) {
      case 'orders':
        return this.processOrderData(message);
      case 'devices':
        return this.processDeviceData(message);
      case 'useractivities':
        return this.processUserActivityData(message);
      default:
        return {
          collection,
          operationType,
          timestamp: new Date(timestamp).toISOString(),
          documentId: documentKey._id?.toString() || 'unknown',
          data: fullDocument || {},
          enriched: {},
        };
    }
  }

  private processOrderData(message: ChangeMessage): ProcessedData {
    const { operationType, documentKey, fullDocument, timestamp } = message;
    const documentId = documentKey._id?.toString() || 'unknown';

    // Cast to OrderDocument type safely
    const orderDoc = fullDocument as OrderDocument | undefined;

    // Sample transformation for orders
    let enriched: EnrichedOrderData = {
      subtotal: '0.00',
      tax: '0.00',
      total: '0.00',
      currency: 'USD',
      processingDate: new Date().toISOString(),
    };

    if (orderDoc) {
      // Calculate total order value
      const items: OrderItem[] = Array.isArray(orderDoc.items)
        ? orderDoc.items
        : [];

      // Use type-safe reduce with proper checks
      const subtotal: number = items.reduce((sum: number, item: OrderItem) => {
        return sum + item.quantity * item.price;
      }, 0);

      // Apply business logic
      const taxRate = 0.08; // 8% tax
      const tax: number = subtotal * taxRate;
      const total: number = subtotal + tax;

      // Enrich with calculated fields
      enriched = {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        currency: 'USD',
        processingDate: new Date().toISOString(),
      };
    }

    return {
      collection: 'orders',
      operationType,
      timestamp: new Date(timestamp).toISOString(),
      documentId,
      data: orderDoc || {},
      enriched,
    };
  }

  private processDeviceData(message: ChangeMessage): ProcessedData {
    const { operationType, documentKey, fullDocument, timestamp } = message;
    const documentId = documentKey._id?.toString() || 'unknown';

    // Cast to DeviceDocument type safely
    const deviceDoc = fullDocument as DeviceDocument | undefined;

    // Sample transformation for devices
    let enriched: EnrichedDeviceData = {
      deviceCategory: 'unknown',
      isActive: false,
      daysSinceRegistration: 0,
      processingDate: new Date().toISOString(),
    };

    if (deviceDoc) {
      // Enrich device data
      enriched = {
        deviceCategory: this.categorizeDevice(deviceDoc.deviceType),
        isActive: !!deviceDoc.isActive,
        daysSinceRegistration: deviceDoc.registrationDate
          ? Math.floor(
              (Date.now() - new Date(deviceDoc.registrationDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
        processingDate: new Date().toISOString(),
      };
    }

    return {
      collection: 'devices',
      operationType,
      timestamp: new Date(timestamp).toISOString(),
      documentId,
      data: deviceDoc || {},
      enriched,
    };
  }

  private processUserActivityData(message: ChangeMessage): ProcessedData {
    const { operationType, documentKey, fullDocument, timestamp } = message;
    const documentId = documentKey._id?.toString() || 'unknown';

    // Cast to UserActivityDocument type safely
    const activityDoc = fullDocument as UserActivityDocument | undefined;

    // Sample transformation for user activities
    let enriched: EnrichedUserActivityData = {
      activityCategory: 'unknown',
      timeOfDay: 'unknown',
      weekday: 'unknown',
      geoInfo: null,
      processingDate: new Date().toISOString(),
    };

    if (activityDoc) {
      // Enrich user activity data
      const location = activityDoc.location;

      enriched = {
        activityCategory: this.categorizeActivity(activityDoc.activityType),
        timeOfDay: this.getTimeOfDay(activityDoc.timestamp),
        weekday: this.getWeekday(activityDoc.timestamp),
        geoInfo: location
          ? {
              region: this.determineRegion(
                location.latitude,
                location.longitude,
              ),
              isInternational: location.country !== 'USA',
            }
          : null,
        processingDate: new Date().toISOString(),
      };
    }

    return {
      collection: 'useractivities',
      operationType,
      timestamp: new Date(timestamp).toISOString(),
      documentId,
      data: activityDoc || {},
      enriched,
    };
  }

  // Helper methods for data transformation
  private categorizeDevice(deviceType: string): string {
    if (!deviceType) return 'unknown';

    if (deviceType.includes('phone') || deviceType === 'smartphone') {
      return 'mobile';
    } else if (deviceType.includes('tablet')) {
      return 'tablet';
    } else if (deviceType.includes('desktop') || deviceType.includes('pc')) {
      return 'desktop';
    } else {
      return 'other';
    }
  }

  private categorizeActivity(activityType: string): string {
    if (!activityType) return 'unknown';

    if (
      activityType.includes('login') ||
      activityType.includes('logout') ||
      activityType.includes('register')
    ) {
      return 'account';
    } else if (
      activityType.includes('purchase') ||
      activityType.includes('payment')
    ) {
      return 'transaction';
    } else if (
      activityType.includes('view') ||
      activityType.includes('search')
    ) {
      return 'browsing';
    } else {
      return 'other';
    }
  }

  private getTimeOfDay(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const hours = date.getHours();

    if (hours >= 5 && hours < 12) {
      return 'morning';
    } else if (hours >= 12 && hours < 17) {
      return 'afternoon';
    } else if (hours >= 17 && hours < 21) {
      return 'evening';
    } else {
      return 'night';
    }
  }

  private getWeekday(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[date.getDay()];
  }

  private determineRegion(lat: number, lng: number): string {
    // Very simplified logic - in real world, would use proper geo mapping
    if (!lat || !lng) return 'unknown';

    // Simple US regions
    if (lng < -115) return 'west_coast';
    if (lng > -80) return 'east_coast';
    return 'central';
  }
}
