const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  
  get currentToken() {
    return this.token;
  }

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private isValidToken(token: string): boolean {
    try {
      // Check if token has proper JWT format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format: not a valid JWT');
        return false;
      }

      // Decode the payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.warn('Token expired');
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Token validation failed:', error);
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token && this.isValidToken(this.token)) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 specifically - token expired/invalid
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Authentication expired. Please login again.');
      }

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        // Return the full response object so the caller can access error.details
        return data;
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const url = `${this.baseURL}/api/auth/dashboard/login`;
    const headers = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    user_type: string;
    name: string;
    organization: string;
  }) {
    return this.request('/api/auth/dashboard/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyEmail(email: string, otp_code: string) {
    return this.request('/api/auth/dashboard/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code }),
    });
  }

  async refreshToken() {
    return this.request<{ access_token: string }>('/api/auth/refresh-token', {
      method: 'POST',
    });
  }

  async logout() {
    const response = await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  // Profile endpoints
  async getProfile() {
    return this.request('/api/profile');
  }

  // Hospital management endpoints
  async getMyHospitals() {
    return this.request<{hospitals: any[], total: number, summary: any}>('/api/hospitals/my');
  }

  async getHospitalDetails(hospitalId: string) {
    return this.request<any>(`/api/hospitals/${hospitalId}`);
  }

  async getHospitalDashboard() {
    return this.request('/api/hospitals/dashboard');
  }

  async updateHospital(hospitalId: string, data: any) {
    return this.request<any>(`/api/hospitals/${hospitalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async registerMainHospital(hospitalData: {
    network_name: string;
    admin_name: string;
    admin_email: string;
    admin_phone: string;
    hospital_name: string;
    address: string;
    city?: string;
    province?: string;
    contact_phone: string;
    emergency_contact?: string;
    coordinates_lat: number;
    coordinates_lng: number;
  }) {
    return this.request('/api/hospitals/register-main', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    });
  }

  async registerRegionalHospital(hospitalData: {
    hospital_code: string;
    network_name: string;
    admin_name: string;
    admin_email: string;
    admin_phone: string;
    admin_designation?: string;
    hospital_name: string;
    address: string;
    city: string;
    province?: string;
    postal_code?: string;
    contact_phone: string;
    contact_person_phone?: string;
    landline?: string;
    email?: string;
    coordinates_lat?: number;
    coordinates_lng?: number;
  }) {
    return this.request('/api/hospitals/register-regional', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    });
  }

  async verifyHospitalCode(code: string) {
    return this.request(`/api/hospitals/verify-code/${code}`);
  }

  // Approval workflows
  async getPendingApprovals(hospitalId: string) {
    return this.request<any[]>(`/api/approvals/hospitals/${hospitalId}/pending`);
  }

  async approveRider(riderId: string, notes?: string) {
    return this.request<any>(`/api/approvals/riders/${riderId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approval_notes: notes }),
    });
  }

  async approveCollectionCenter(centerId: string, hospitalId: string, notes?: string) {
    return this.request<any>(`/api/approvals/collection-centers/${centerId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ 
        hospitalId: hospitalId,
        approval_notes: notes 
      }),
    });
  }

  async rejectApproval(type: string, itemId: string, reason: string, notes?: string) {
    return this.request<any>(`/api/approvals/reject/${type}/${itemId}`, {
      method: 'POST',
      body: JSON.stringify({ 
        rejection_reason: reason,
        notes: notes
      }),
    });
  }

  // Orders management
  async getMyOrders(params?: {
    status?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/orders/my${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getHospitalOrders(params?: {
    status?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/hospitals/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getOrderDetails(orderId: string) {
    return this.request<any>(`/api/orders/${orderId}`);
  }

  async assignRider(orderId: string, riderId: string, notes?: string) {
    return this.request<any>(`/api/orders/${orderId}/assign-rider`, {
      method: 'POST',
      body: JSON.stringify({ 
        rider_id: riderId,
        assignment_notes: notes
      }),
    });
  }

  async getAvailableRiders(orderId: string) {
    return this.request(`/api/orders/${orderId}/available-riders`);
  }

  async updateOrderStatus(orderId: string, status: string, notes?: string, location?: { latitude: number; longitude: number }) {
    return this.request<any>(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ 
        status, 
        notes,
        location
      }),
    });
  }

  // Riders management
  // Get riders for a specific hospital by ID (for hospital detail modal)
  async getHospitalRidersByHospitalId(hospitalId: string) {
    return this.request<any[]>(`/api/riders/hospitals/${hospitalId}`);
  }

  // Get all riders for logged-in user's hospitals (for Riders page)
  async getMyHospitalRiders() {
    return this.request<any>(`/api/riders/hospital`);
  }

  async getRiderDailyKM(hospitalId: string, date: string, riderId: string) {
    return this.request<any>(`/api/hospitals/${hospitalId}/riders/daily-km?date=${date}&rider_id=${riderId}`);
  }

  async getRiderKMRange(hospitalId: string, startDate: string, endDate: string, riderId: string) {
    return this.request<any>(`/api/hospitals/${hospitalId}/riders/km-range?start_date=${startDate}&end_date=${endDate}&rider_id=${riderId}`);
  }

  async getAllRidersDailyKM(hospitalId: string, date: string) {
    return this.request<any>(`/api/hospitals/${hospitalId}/riders/daily-km-batch?date=${date}`);
  }

  async getCollectionCenterOrders(centerId: string, params?: {
    status?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/hospitals/collection-centers/${centerId}/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getPendingRiders(hospitalId: string) {
    return this.request<any[]>(`/api/riders/hospitals/${hospitalId}/pending`);
  }

  async getAvailableRidersForHospital(hospitalId: string) {
    return this.request<any[]>(`/api/riders/hospitals/${hospitalId}/available`);
  }

  async getRiderPerformance(riderId: string) {
    return this.request<any>(`/api/riders/${riderId}/performance`);
  }

  // Collection Centers management
  async getHospitalCollectionCenters(hospitalId: string) {
    return this.request<any[]>(`/api/collection-centers/hospitals/${hospitalId}`);
  }

  // Orders management - Additional endpoints
  async assignRiderToOrder(orderId: string, riderId: string, notes?: string) {
    return this.request<any>(`/api/orders/${orderId}/assign-rider`, {
      method: 'POST',
      body: JSON.stringify({ 
        rider_id: riderId,
        assignment_notes: notes
      }),
    });
  }

  async getAvailableRidersForOrder(orderId: string) {
    return this.request<any[]>(`/api/orders/${orderId}/available-riders`);
  }

  async cancelOrder(orderId: string, reason: string) {
    return this.request<any>(`/api/orders/${orderId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ 
        cancellation_reason: reason
      }),
    });
  }

  async trackOrderLocation(orderId: string, location: { latitude: number; longitude: number }) {
    return this.request<any>(`/api/orders/${orderId}/track-location`, {
      method: 'POST',
      body: JSON.stringify({ location }),
    });
  }

  // QR Code management
  async generatePickupQR(orderId: string, pickupLocation: { latitude: number; longitude: number }, expiryHours: number = 24) {
    return this.request('/api/qr/generate/pickup', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        pickup_location: pickupLocation,
        expiry_hours: expiryHours,
      }),
    });
  }

  async generateDeliveryQR(orderData: {
    order_id: string;
    center_id: string;
    hospital_id: string;
    rider_id?: string;
    sample_type?: string; // Optional - feature-based
    urgency?: string; // Optional - feature-based
    delivery_location?: string;
  }) {
    return this.request('/api/qr/generate/delivery', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async scanQR(qrData: string, scanLocation: { latitude: number; longitude: number }) {
    return this.request('/api/qr/scan', {
      method: 'POST',
      body: JSON.stringify({
        qr_data: qrData,
        scan_location: scanLocation,
        scan_time: new Date().toISOString(),
      }),
    });
  }

  async getOrderQRCodes(orderId: string) {
    return this.request(`/api/qr/order/${orderId}`);
  }

  async getChainOfCustody(qrId: string) {
    return this.request(`/api/qr/${qrId}/chain-of-custody`);
  }

  // SLA API methods
  async getSLAMetrics(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/metrics${params}`);
  }

  async getSLAPerformance(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/performance${params}`);
  }

  async getSLAAlerts(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/alerts${params}`);
  }

  async getSLAConfig() {
    return this.request(`/api/hospital-sla/config`);
  }

  async updateSLAConfig(config: any) {
    return this.request('/api/hospital-sla/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async sendSLAEmailReport() {
    return this.request('/api/sla/email-report', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Development bypass (only for dev environment)
  async devBypassLogin(userType: string, phone: string) {
    return this.request('/api/auth/dev-bypass', {
      method: 'POST',
      body: JSON.stringify({
        user_type: userType,
        phone: phone,
      }),
    });
  }

  // Reports & Analytics endpoints
  async getReportsMetrics(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/metrics${params}`);
  }

  async getReportsPerformance(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/performance${params}`);
  }

  async getReportsAlerts(period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/api/sla/alerts${params}`);
  }

  async getHospitalOrdersReport(params?: {
    status?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
    period?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/hospitals/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getRiderPerformanceReport(params?: {
    period?: string;
    hospital_id?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/sla/performance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async exportReport(reportType: 'pdf' | 'excel' | 'csv', period?: string) {
    const params = new URLSearchParams();
    params.append('format', reportType);
    if (period) {
      params.append('period', period);
    }
    
    return this.request(`/api/reports/export?${params.toString()}`);
  }

  async sendReportEmail(period?: string) {
    return this.request('/api/sla/email-report', {
      method: 'POST',
      body: JSON.stringify({ period }),
    });
  }

  // Get hospital by ID
  async getHospitalById(hospitalId: string) {
    return this.request<any>(`/api/hospitals/${hospitalId}`);
  }

  // Get order by ID
  async getOrderById(orderId: string) {
    return this.request<any>(`/api/orders/${orderId}`);
  }

  // Get detailed order information with tracking data (for operations/hospital dashboard)
  async getOrderDetailsWithTracking(orderId: string) {
    return this.request<any>(`/api/operations/orders/${orderId}/details`);
  }

  // Get regional hospitals for approval (main hospital action)
  async getRegionalHospitalsForApproval(hospitalId: string) {
    return this.request<any>(`/api/hospitals/regional/pending-approval`);
  }

  // Get collection centers for a specific hospital (for Hospital Detail Modal)
  async getCollectionCentersByHospitalId(hospitalId: string) {
    return this.request<any>(`/api/hospitals/${hospitalId}/collection-centers`);
  }

  // Approve regional hospital (main hospital action)
  async approveRegionalHospital(hospitalId: string) {
    return this.request<any>(`/api/hospitals/regional/${hospitalId}/approve`, {
      method: 'POST',
    });
  }

  // Reject regional hospital (main hospital action)
  async rejectRegionalHospital(hospitalId: string, reason: string) {
    return this.request<any>(`/api/hospitals/regional/${hospitalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: reason }),
    });
  }

  // SMS Notifications via Text.lk
  async sendBulkSms(data: {
    hospitalId: string;
    recipientType: string; // 'riders' | 'collection_centers' | 'both'
    message: string;
    subject?: string;
    priority?: string;
  }) {
    return this.request<{ count: number; recipients: any[] }>('/api/notifications/send-bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Alias for sendBulkSms
  async sendBulkNotification(data: {
    hospitalId: string;
    recipientType: string;
    message: string;
    subject?: string;
    priority?: string;
  }) {
    return this.sendBulkSms(data);
  }

  // Rider-Center Assignment Management
  async assignRiderToCenter(riderId: string, centerId: string) {
    return this.request('/api/rider-center-assignments/assign', {
      method: 'POST',
      body: JSON.stringify({ rider_id: riderId, center_id: centerId }),
    });
  }

  async removeRiderFromCenter(riderId: string, centerId: string) {
    return this.request('/api/rider-center-assignments/remove', {
      method: 'POST',
      body: JSON.stringify({ rider_id: riderId, center_id: centerId }),
    });
  }

  async bulkAssignRiders(riderIds: string[], centerId: string) {
    return this.request('/api/rider-center-assignments/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ rider_ids: riderIds, center_id: centerId }),
    });
  }

  async getRidersForCenter(centerId: string) {
    return this.request<any[]>(`/api/rider-center-assignments/center/${centerId}/riders`);
  }

  async getCentersForRider(riderId: string) {
    return this.request<any[]>(`/api/rider-center-assignments/rider/${riderId}/centers`);
  }

  async getHospitalAssignments() {
    return this.request<any[]>('/api/rider-center-assignments/hospital/assignments');
  }

  async getUnassignedRidersForCenter(centerId: string) {
    return this.request<any[]>(`/api/rider-center-assignments/center/${centerId}/unassigned-riders`);
  }

  async getHospitalAssignmentStats() {
    return this.request<any>('/api/rider-center-assignments/hospital/stats');
  }
}

export const apiClient = new ApiClient(API_URL);

// Export types for use in components
export type { ApiResponse };

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

// Helper function to format API response data
export const formatApiResponse = <T>(response: ApiResponse<T>): T | null => {
  if (response.success && response.data) {
    return response.data;
  }
  return null;
};

export default apiClient;