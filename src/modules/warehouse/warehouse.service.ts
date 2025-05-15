import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

interface ProcessedData {
  collection: string;
  operationType: string;
  timestamp: string;
  documentId: string;
  data: Record<string, any>;
  enriched: Record<string, any>;
}

interface OrderData {
  orderId?: string;
  customerId?: string;
  status?: string;
  totalAmount?: number;
  shippingAddress?: Record<string, any>;
  items?: Array<Record<string, any>>;
}

interface DeviceData {
  deviceId?: string;
  userId?: string;
  deviceType?: string;
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  isActive?: boolean;
  registrationDate?: string | Date;
  lastActive?: string | Date;
}

interface UserActivityData {
  userId?: string;
  activityType?: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  duration?: number;
  timestamp?: string | Date;
  location?: Record<string, any>;
}

interface EnrichedData {
  subtotal?: string;
  tax?: string;
  total?: string;
  currency?: string;
  processingDate?: string;
  deviceCategory?: string;
  daysSinceRegistration?: number;
  timeOfDay?: string;
  weekday?: string;
  activityCategory?: string;
  geoInfo?: Record<string, any>;
}

@Injectable()
export class WarehouseService implements OnModuleInit {
  private readonly logger = new Logger(WarehouseService.name);
  private db: Database.Database;
  private tables: Record<string, string>;
  private databasePath: string;

  constructor(private readonly configService: ConfigService) {
    this.databasePath =
      this.configService.get<string>('sqlite.database') ||
      './data/warehouse.db';
    this.tables = this.configService.get<Record<string, string>>(
      'sqlite.tables',
    ) || {
      orders: 'orders',
      devices: 'devices',
      userActivities: 'user_activities',
    };
  }

  async onModuleInit(): Promise<void> {
    try {
      // Ensure data directory exists
      const dbDir = path.dirname(this.databasePath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize SQLite database
      this.db = new Database(this.databasePath);

      // Create tables if they don't exist
      await Promise.resolve(this.createTablesIfNotExist());

      this.logger.log('SQLite warehouse initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SQLite warehouse', error);
      // Don't throw here, as we want the application to start even if warehouse setup fails
    }
  }

  private createTablesIfNotExist(): void {
    try {
      // Create orders table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${this.tables.orders} (
          document_id TEXT PRIMARY KEY,
          order_id TEXT,
          customer_id TEXT,
          operation_type TEXT,
          status TEXT,
          total_amount REAL,
          subtotal REAL,
          tax REAL,
          currency TEXT,
          shipping_address TEXT, -- JSON for shipping address
          items TEXT, -- JSON array for items
          event_timestamp TEXT,
          processing_timestamp TEXT
        )
      `);

      // Create devices table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${this.tables.devices} (
          document_id TEXT PRIMARY KEY,
          device_id TEXT,
          user_id TEXT,
          operation_type TEXT,
          device_type TEXT,
          manufacturer TEXT,
          model TEXT,
          os_version TEXT,
          app_version TEXT,
          is_active INTEGER,
          device_category TEXT,
          days_since_registration INTEGER,
          registration_date TEXT,
          last_active_date TEXT,
          event_timestamp TEXT,
          processing_timestamp TEXT
        )
      `);

      // Create user activities table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${this.tables.userActivities} (
          document_id TEXT PRIMARY KEY,
          user_id TEXT,
          operation_type TEXT,
          activity_type TEXT,
          session_id TEXT,
          device_id TEXT,
          ip_address TEXT,
          activity_category TEXT,
          time_of_day TEXT,
          weekday TEXT,
          duration INTEGER,
          location TEXT, -- JSON for location
          activity_timestamp TEXT,
          event_timestamp TEXT,
          processing_timestamp TEXT
        )
      `);

      this.logger.log('Database tables created successfully');
    } catch (error) {
      this.logger.error('Error creating tables', error);
      throw error;
    }
  }

  async uploadBatch(
    collectionType: string,
    data: ProcessedData[],
  ): Promise<void> {
    try {
      if (!data || data.length === 0) {
        this.logger.warn(`Empty batch for collection ${collectionType}`);
        return;
      }

      this.logger.log(
        `Uploading batch of ${data.length} records to ${collectionType}`,
      );

      if (collectionType === 'userActivities') {
        this.logger.log('Processing user activities batch:');
        this.logger.log(`Table name: ${this.tables.userActivities}`);
        if (data.length > 0) {
          this.logger.log(`First item collection: ${data[0].collection}`);
          this.logger.log(
            `Sample activity type: ${data[0].data.activityType || 'undefined'}`,
          );
        }
      }

      const transformedData = this.transformForSQLite(collectionType, data);

      // Use transaction for better performance
      const transaction = this.db.transaction(
        (items: Record<string, any>[]) => {
          let stmt: Database.Statement | null = null;

          switch (collectionType) {
            case 'orders':
              stmt = this.db.prepare(`
              INSERT OR REPLACE INTO ${this.tables.orders} (
                document_id, order_id, customer_id, operation_type, status,
                total_amount, subtotal, tax, currency, shipping_address,
                items, event_timestamp, processing_timestamp
              ) VALUES (
                @document_id, @order_id, @customer_id, @operation_type, @status,
                @total_amount, @subtotal, @tax, @currency, @shipping_address,
                @items, @event_timestamp, @processing_timestamp
              )
            `);
              break;
            case 'devices':
              stmt = this.db.prepare(`
              INSERT OR REPLACE INTO ${this.tables.devices} (
                document_id, device_id, user_id, operation_type, device_type,
                manufacturer, model, os_version, app_version, is_active,
                device_category, days_since_registration, registration_date,
                last_active_date, event_timestamp, processing_timestamp
              ) VALUES (
                @document_id, @device_id, @user_id, @operation_type, @device_type,
                @manufacturer, @model, @os_version, @app_version, @is_active,
                @device_category, @days_since_registration, @registration_date,
                @last_active_date, @event_timestamp, @processing_timestamp
              )
            `);
              break;
            case 'userActivities':
              this.logger.log('Preparing SQL statement for user activities');
              stmt = this.db.prepare(`
              INSERT OR REPLACE INTO ${this.tables.userActivities} (
                document_id, user_id, operation_type, activity_type, session_id,
                device_id, ip_address, activity_category, time_of_day, weekday,
                duration, location, activity_timestamp, event_timestamp, processing_timestamp
              ) VALUES (
                @document_id, @user_id, @operation_type, @activity_type, @session_id,
                @device_id, @ip_address, @activity_category, @time_of_day, @weekday,
                @duration, @location, @activity_timestamp, @event_timestamp, @processing_timestamp
              )
            `);
              break;
            default:
              throw new Error(`Unknown collection type: ${collectionType}`);
          }

          for (const item of items) {
            if (stmt) {
              try {
                stmt.run(item);
              } catch (error) {
                this.logger.error(
                  `Error running statement for collection ${collectionType}:`,
                  error,
                );
                this.logger.error('Failed item:', JSON.stringify(item));
                throw error;
              }
            }
          }
        },
      );

      // Execute the transaction
      await Promise.resolve(transaction(transformedData));

      this.logger.log(
        `Successfully uploaded ${data.length} records to ${collectionType}`,
      );
    } catch (error) {
      this.logger.error(`Error uploading batch to ${collectionType}`, error);
      throw error;
    }
  }

  private transformForSQLite(
    collectionType: string,
    data: ProcessedData[],
  ): Record<string, any>[] {
    switch (collectionType) {
      case 'orders':
        return this.transformOrdersForSQLite(data);
      case 'devices':
        return this.transformDevicesForSQLite(data);
      case 'userActivities':
        return this.transformUserActivitiesForSQLite(data);
      default:
        throw new Error(`Unknown collection type: ${collectionType}`);
    }
  }

  private transformOrdersForSQLite(
    data: ProcessedData[],
  ): Record<string, any>[] {
    return data.map((item) => {
      const orderData = item.data as OrderData;
      const enrichedData = item.enriched as EnrichedData;

      return {
        document_id: item.documentId,
        order_id: orderData.orderId || null,
        customer_id: orderData.customerId || null,
        operation_type: item.operationType,
        status: orderData.status || null,
        total_amount: orderData.totalAmount || 0,
        subtotal: parseFloat(enrichedData.subtotal || '0'),
        tax: parseFloat(enrichedData.tax || '0'),
        currency: enrichedData.currency || 'USD',
        shipping_address: orderData.shippingAddress
          ? JSON.stringify(orderData.shippingAddress)
          : null,
        items: orderData.items ? JSON.stringify(orderData.items) : null,
        event_timestamp: item.timestamp,
        processing_timestamp: new Date().toISOString(),
      };
    });
  }

  private transformDevicesForSQLite(
    data: ProcessedData[],
  ): Record<string, any>[] {
    return data.map((item) => {
      const deviceData = item.data as DeviceData;
      const enrichedData = item.enriched as EnrichedData;

      return {
        document_id: item.documentId,
        device_id: deviceData.deviceId || null,
        user_id: deviceData.userId || null,
        operation_type: item.operationType,
        device_type: deviceData.deviceType || null,
        manufacturer: deviceData.manufacturer || null,
        model: deviceData.model || null,
        os_version: deviceData.osVersion || null,
        app_version: deviceData.appVersion || null,
        is_active: deviceData.isActive ? 1 : 0,
        device_category: enrichedData.deviceCategory || null,
        days_since_registration: enrichedData.daysSinceRegistration || 0,
        registration_date: deviceData.registrationDate
          ? new Date(deviceData.registrationDate).toISOString()
          : null,
        last_active_date: deviceData.lastActive
          ? new Date(deviceData.lastActive).toISOString()
          : null,
        event_timestamp: item.timestamp,
        processing_timestamp: new Date().toISOString(),
      };
    });
  }

  private transformUserActivitiesForSQLite(
    data: ProcessedData[],
  ): Record<string, any>[] {
    this.logger.log(`Transforming ${data.length} user activities for SQLite`);

    return data.map((item, index) => {
      try {
        const activityData = item.data as UserActivityData;
        const enrichedData = item.enriched as EnrichedData;

        if (!activityData) {
          this.logger.warn(`Empty activity data for item ${index}`);
        }

        // Log for debugging
        if (index === 0) {
          this.logger.log(
            `Sample activity data keys: ${Object.keys(activityData || {}).join(', ')}`,
          );
          this.logger.log(
            `Sample enriched data keys: ${Object.keys(enrichedData || {}).join(', ')}`,
          );
        }

        return {
          document_id: item.documentId,
          user_id: activityData.userId || null,
          operation_type: item.operationType,
          activity_type: activityData.activityType || null,
          session_id: activityData.sessionId || null,
          device_id: activityData.deviceId || null,
          ip_address: activityData.ipAddress || null,
          activity_category: enrichedData.activityCategory || null,
          time_of_day: enrichedData.timeOfDay || null,
          weekday: enrichedData.weekday || null,
          duration: activityData.duration || null,
          location: activityData.location
            ? JSON.stringify({
                ...activityData.location,
                ...(enrichedData.geoInfo || {}),
              })
            : null,
          activity_timestamp: activityData.timestamp
            ? new Date(activityData.timestamp).toISOString()
            : null,
          event_timestamp: item.timestamp,
          processing_timestamp: new Date().toISOString(),
        };
      } catch (error) {
        this.logger.error(
          `Error transforming user activity at index ${index}:`,
          error,
        );
        this.logger.error('Problem item:', JSON.stringify(item));

        // Return a minimal valid record to avoid crashing the batch
        return {
          document_id: item.documentId || `error-${Date.now()}-${index}`,
          user_id: 'error-processing',
          operation_type: item.operationType || 'unknown',
          activity_type: 'error',
          event_timestamp: item.timestamp || new Date().toISOString(),
          processing_timestamp: new Date().toISOString(),
        };
      }
    });
  }

  getWarehouseStatus(): {
    orders: number;
    devices: number;
    userActivities: number;
    error?: string;
  } {
    try {
      const orders = this.db
        .prepare('SELECT COUNT(*) as count FROM orders')
        .get();

      const orderCount = (orders as { count: number }).count;
      const devices = this.db
        .prepare('SELECT COUNT(*) as count FROM devices')
        .get();

      const deviceCount = (devices as { count: number }).count;

      const activities = this.db
        .prepare('SELECT COUNT(*) as count FROM user_activities')
        .get();

      const activityCount = (activities as { count: number }).count;

      return {
        orders: orderCount,
        devices: deviceCount,
        userActivities: activityCount,
      };
    } catch (error) {
      this.logger.error(`Error getting warehouse status: ${error}`);
      return {
        orders: 0,
        devices: 0,
        userActivities: 0,
        error: (error as { message: string }).message,
      };
    }
  }

  getLatestRecords(
    collection: string,
    limit: number = 10,
  ): Record<string, any>[] {
    try {
      let tableName: string;

      // Log the requested collection for debugging
      this.logger.log(`Getting latest records for collection: ${collection}`);

      // Normalize collection name to handle various ways users might request it
      const normalizedCollection = collection.toLowerCase();

      if (normalizedCollection === 'orders') {
        tableName = this.tables.orders;
      } else if (normalizedCollection === 'devices') {
        tableName = this.tables.devices;
      } else if (
        normalizedCollection === 'useractivities' ||
        normalizedCollection === 'user_activities'
      ) {
        tableName = this.tables.userActivities;
      } else {
        throw new Error(`Unknown collection: ${collection}`);
      }

      this.logger.log(`Using table name: ${tableName}`);

      const query = `SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT ?`;

      const results = this.db.prepare(query).all(limit) as Record<
        string,
        any
      >[];
      this.logger.log(`Found ${results.length} records`);

      return results || [];
    } catch (error: any) {
      this.logger.error(
        `Error getting latest records for ${collection}: ${error}`,
      );
      return [];
    }
  }
}
