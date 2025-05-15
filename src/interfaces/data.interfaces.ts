// Common interfaces used across modules

// MongoDB models
export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentInfo {
  method: string;
  transactionId: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

// Change Data Capture
export interface DocumentKey {
  _id: string;
}

export interface ChangeMessage {
  collection: string;
  operationType: string;
  documentKey: DocumentKey;
  fullDocument?: OrderDocument | DeviceDocument | UserActivityDocument;
  updateDescription?: Record<string, any>;
  timestamp: string | Date;
}

// Document structures based on MongoDB models
export interface OrderDocument {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress?: ShippingAddress;
  paymentInfo?: PaymentInfo;
}

export interface DeviceDocument {
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
  metadata?: Record<string, any>;
}

export interface UserActivityDocument {
  userId: string;
  activityType: string;
  timestamp: Date;
  deviceId?: string;
  ipAddress?: string;
  location?: GeoLocation;
  sessionId?: string;
  metadata?: Record<string, any>;
  duration?: number;
}

// Processed data
export interface EnrichedOrderData {
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
  processingDate: string;
}

export interface EnrichedDeviceData {
  deviceCategory: string;
  isActive: boolean;
  daysSinceRegistration: number;
  processingDate: string;
}

export interface GeoInfo {
  region: string;
  isInternational: boolean;
}

export interface EnrichedUserActivityData {
  activityCategory: string;
  timeOfDay: string;
  weekday: string;
  geoInfo: GeoInfo | null;
  processingDate: string;
}

export interface ProcessedData {
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

// BigQuery schemas and row data
export interface BigQueryTableSchema {
  name: string;
  type: string;
  mode?: string;
  fields?: BigQueryTableSchema[];
}

export interface BigQueryOrderRow {
  document_id: string;
  order_id: string;
  customer_id: string;
  operation_type: string;
  status: string;
  total_amount: number;
  subtotal: number;
  tax: number;
  currency: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  } | null;
  items: {
    product_id: string;
    quantity: number;
    price: number;
  }[];
  event_timestamp: Date;
  processing_timestamp: Date;
}

export interface BigQueryDeviceRow {
  document_id: string;
  device_id: string;
  user_id: string;
  operation_type: string;
  device_type: string;
  manufacturer: string;
  model: string;
  os_version: string | null;
  app_version: string | null;
  is_active: boolean;
  device_category: string;
  days_since_registration: number;
  registration_date: Date | null;
  last_active_date: Date | null;
  event_timestamp: Date;
  processing_timestamp: Date;
}

export interface BigQueryUserActivityRow {
  document_id: string;
  user_id: string;
  operation_type: string;
  activity_type: string;
  session_id: string | null;
  device_id: string | null;
  ip_address: string | null;
  activity_category: string;
  time_of_day: string;
  weekday: string;
  duration: number | null;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    region: string;
    is_international: boolean;
  } | null;
  activity_timestamp: Date | null;
  event_timestamp: Date;
  processing_timestamp: Date;
}

export type BigQueryRow =
  | BigQueryOrderRow
  | BigQueryDeviceRow
  | BigQueryUserActivityRow;

export interface OrderInput {
  customerId?: string;
  items?: OrderItem[];
  totalAmount?: number;
  status?: string;
  shippingAddress?: ShippingAddress;
  paymentInfo?: PaymentInfo;
  [key: string]: any;
}

export interface DeviceInput {
  userId?: string;
  type?: string;
  model?: string;
  osVersion?: string;
  [key: string]: any;
}

export interface ActivityDetails {
  page: string;
  duration: number;
}

export interface ActivityInput {
  userId?: string;
  type?: string;
  details?: ActivityDetails;
  ipAddress?: string;
  [key: string]: any;
}
