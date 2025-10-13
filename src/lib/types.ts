// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  hospitalId: string;
  hospitalName: string;
  hospitalCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Hospital Types
export interface Hospital {
  id: string;
  name: string;
  code: string;
  type: 'main' | 'regional';
  email: string;
  phone: string;
  address: string;
  parentHospitalId?: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface Order {
  id: string;
  orderId: string;
  collectionCenterId: string;
  collectionCenterName: string;
  hospitalId: string;
  hospitalName: string;
  riderId?: string;
  riderName?: string;
  sampleTypes: string[];
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'created' | 'assigned' | 'pickup_started' | 'picked_up' | 'delivery_started' | 'delivered' | 'cancelled';
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  qrCodes: {
    pickup?: string;
    delivery?: string;
    handover?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Rider Types
export interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nicNumber: string;
  licenseNumber: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  vehicleNumber: string;
  hospitalIds: string[];
  hospitalNames: string[];
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  rating: number;
  totalDeliveries: number;
  successRate: number;
  documents: {
    license: string;
    nic: string;
    vehicleRegistration?: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

// Collection Center Types
export interface CollectionCenter {
  id: string;
  name: string;
  type: 'dependent' | 'independent';
  email: string;
  phone: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  hospitalIds: string[];
  hospitalNames: string[];
  status: 'pending' | 'active' | 'inactive';
  licenseNumber: string;
  contactPersonName: string;
  contactPersonPhone: string;
  sampleTypes: string[];
  operatingHours: {
    open: string;
    close: string;
    days: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Real-time Location Types
export interface RiderLocation {
  riderId: string;
  riderName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  status: 'available' | 'busy' | 'offline';
  currentOrderId?: string;
}

// QR Code Types
export interface QRCode {
  id: string;
  orderId: string;
  type: 'pickup' | 'delivery' | 'handover' | 'combined';
  code: string;
  securityHash: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  usedBy?: string;
  metadata?: {
    location?: string;
    orderIds?: string[]; // For combined QR codes
  };
  createdAt: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  orderId: string;
  action: 'qr_pickup_scan' | 'qr_delivery_scan' | 'qr_handover_scan' | 'status_change' | 'rider_assignment' | 'order_creation';
  actorType: 'rider' | 'hospital' | 'collection_center' | 'system';
  actorId: string;
  actorName: string;
  details: {
    previousStatus?: string;
    newStatus?: string;
    qrCodeId?: string;
    location?: string;
    metadata?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed' | 'warning';
  errorMessage?: string;
  timestamp: string;
}

// Analytics Types
export interface SLAMetrics {
  totalOrders: number;
  completedOrders: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  complianceRate: number;
  averageDeliveryTime: number; // in minutes
  criticalAlerts: number;
  period: {
    start: string;
    end: string;
  };
}

export interface KMReport {
  riderId: string;
  riderName: string;
  totalKM: number;
  totalDeliveries: number;
  averageKMPerDelivery: number;
  billingAmount: number;
  period: {
    month: string;
    year: number;
  };
}

export interface PerformanceMetrics {
  deliveryVolume: {
    date: string;
    count: number;
  }[];
  sampleDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  hourlyActivity: {
    hour: number;
    orders: number;
  }[];
  riderPerformance: {
    riderId: string;
    riderName: string;
    completedOrders: number;
    rating: number;
    onTimeRate: number;
  }[];
}

// Notification Types
export interface Notification {
  id: string;
  type: 'order_created' | 'rider_assignment' | 'sla_alert' | 'system_alert' | 'approval_request';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  userId?: string;
  hospitalId?: string;
  orderId?: string;
  riderId?: string;
  actionUrl?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Socket.io Event Types
export interface SocketEvents {
  'order_created': Order;
  'order_updated': Order;
  'rider_location_update': RiderLocation;
  'order_status_changed': {
    orderId: string;
    previousStatus: string;
    newStatus: string;
    timestamp: string;
  };
  'alert_triggered': Notification;
  'qr_scan_event': {
    orderId: string;
    qrType: string;
    success: boolean;
    timestamp: string;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface OrderFilters {
  status?: string;
  priority?: string;
  riderId?: string;
  collectionCenterId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  limit?: number;
}

export interface ApprovalFilters {
  type?: 'rider' | 'collection_center';
  status?: 'pending' | 'approved' | 'rejected';
  hospitalId?: string;
}