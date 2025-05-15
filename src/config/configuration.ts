export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/etl-pipeline',
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
    queues: {
      changes: 'data-changes',
      processed: 'processed-data',
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  spark: {
    appName: 'ETL Pipeline',
    master: 'local[*]',
    jarsDir: process.env.SPARK_JARS_DIR || './spark-jars',
    checkpointDir: process.env.SPARK_CHECKPOINT_DIR || './spark-checkpoints',
    batchDuration: parseInt(process.env.SPARK_BATCH_DURATION || '10', 10),
  },
  sqlite: {
    database: process.env.SQLITE_DATABASE || './data/warehouse.db',
    tables: {
      orders: process.env.SQLITE_ORDERS_TABLE || 'orders',
      devices: process.env.SQLITE_DEVICES_TABLE || 'devices',
      userActivities:
        process.env.SQLITE_USER_ACTIVITIES_TABLE || 'user_activities',
    },
  },
  warehouse: {
    type: process.env.WAREHOUSE_TYPE || 'sqlite',
    sqlite: {
      path: process.env.SQLITE_PATH || './data/warehouse.db',
    },
  },
});
