// This script will be executed when MongoDB starts for the first time
// It sets up the database, collections, and initial documents

// Create database
db = db.getSiblingDB('etl-pipeline');

// Create collections with validators
db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['orderId', 'customerId', 'items', 'totalAmount', 'status'],
      properties: {
        orderId: { bsonType: 'string' },
        customerId: { bsonType: 'string' },
        items: { bsonType: 'array' },
        totalAmount: { bsonType: 'number' },
        status: { bsonType: 'string' },
        shippingAddress: { bsonType: 'object' },
        paymentInfo: { bsonType: 'object' },
      },
    },
  },
});

db.createCollection('devices', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['deviceId', 'userId'],
      properties: {
        deviceId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        deviceType: { bsonType: 'string' },
        manufacturer: { bsonType: 'string' },
        model: { bsonType: 'string' },
        osVersion: { bsonType: 'string' },
        appVersion: { bsonType: 'string' },
        isActive: { bsonType: 'bool' },
        registrationDate: { bsonType: 'date' },
        lastActive: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('useractivities', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'activityType'],
      properties: {
        userId: { bsonType: 'string' },
        activityType: { bsonType: 'string' },
        sessionId: { bsonType: 'string' },
        deviceId: { bsonType: 'string' },
        ipAddress: { bsonType: 'string' },
        duration: { bsonType: 'number' },
        timestamp: { bsonType: 'date' },
        location: { bsonType: 'object' },
      },
    },
  },
});

// Create some sample data
db.orders.insertMany([
  {
    orderId: 'ORD-001',
    customerId: 'CUST-001',
    items: [
      { productId: 'PROD-001', quantity: 2, price: 29.99 },
      { productId: 'PROD-002', quantity: 1, price: 49.99 },
    ],
    totalAmount: 109.97,
    status: 'processing',
    shippingAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA',
    },
    paymentInfo: {
      method: 'credit_card',
      transactionId: 'TXN-001',
    },
  },
]);

db.devices.insertMany([
  {
    deviceId: 'DEV-001',
    userId: 'CUST-001',
    deviceType: 'smartphone',
    manufacturer: 'Apple',
    model: 'iPhone 13',
    osVersion: 'iOS 15.4',
    appVersion: '2.1.0',
    isActive: true,
    registrationDate: new Date('2023-01-15'),
    lastActive: new Date(),
  },
]);

db.useractivities.insertMany([
  {
    userId: 'CUST-001',
    activityType: 'login',
    sessionId: 'SESSION-001',
    deviceId: 'DEV-001',
    ipAddress: '192.168.1.1',
    duration: 300,
    timestamp: new Date(),
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
]); 