"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const mountedRef = useRef(true);
  const hasCalledRef = useRef(false);
  const lastCallRef = useRef<number>(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      hasCalledRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      // Don't make API calls if not authenticated
      console.log('🔍 useApi fetchData - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading, 'mounted:', mountedRef.current);
      if (!isAuthenticated || authLoading || !mountedRef.current) {
        console.log('🔍 useApi - auth check failed, returning early');
        if (!authLoading) {
          setLoading(false);
        }
        return;
      }

      // Rate limiting: prevent calls within 500ms
      const now = Date.now();
      console.log('🔍 useApi - rate limit check - now:', now, 'lastCall:', lastCallRef.current, 'diff:', now - lastCallRef.current);
      if (now - lastCallRef.current < 500) {
        console.log('🔍 useApi - rate limited, returning early');
        return;
      }

      // Prevent duplicate calls for dependency-less hooks
      console.log('🔍 useApi - duplicate check - hasCalledRef:', hasCalledRef.current, 'dependencies.length:', dependencies.length);
      if (hasCalledRef.current && dependencies.length === 0) {
        console.log('🔍 useApi - duplicate call prevented, returning early');
        return;
      }

      try {
        console.log('🔍 useApi - starting API call');
        setLoading(true);
        setError(null);
        lastCallRef.current = now;
        
        console.log('🔍 useApi - calling apiCall function');
        const result = await apiCall();
        console.log('🔍 useApi - API call result:', result);
        
        if (!isCancelled && mountedRef.current) {
          setData(result);
          hasCalledRef.current = true;
        }
      } catch (err) {
        if (!isCancelled && mountedRef.current) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (!isCancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Debounce the API call by 1000ms
    timeoutId = setTimeout(fetchData, 1000);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, authLoading, ...dependencies]); // Remove apiCall from dependencies

  const refetch = useCallback(async () => {
    if (!isAuthenticated || !mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, isAuthenticated]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Specific API hooks
export function useOrders(filters?: any) {
  return useApi(
    () => apiClient.getHospitalOrders(filters),
    [filters]
  );
}

export function useRiders(hospitalId: string) {
  return useApi(
    async () => {
      if (!hospitalId || hospitalId === 'undefined' || !hospitalId.trim()) {
        return { success: true, data: { riders: [], total: 0 } };
      }
      return await apiClient.getHospitalRidersByHospitalId(hospitalId);
    },
    [hospitalId]
  );
}

export function useOrderDetails(orderId: string) {
  return useApi(
    () => apiClient.getOrderDetails(orderId),
    [orderId]
  );
}

export function useHospitalDashboard() {
  return useApi(
    () => apiClient.getHospitalDashboard(),
    []
  );
}

// Mutation hooks for API calls that modify data
export function useApiMutation<TData, TVariables = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = async (
    apiCall: (variables: TVariables) => Promise<TData>,
    variables: TVariables
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(variables);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    mutate,
    loading,
    error,
    data,
  };
}

// Specific mutation hooks
export function useApproveRider() {
  const { mutate, loading, error } = useApiMutation<any, string>();

  const approveRider = (riderId: string) => {
    return mutate(apiClient.approveRider.bind(apiClient), riderId);
  };

  return { approveRider, loading, error };
}

export function useApproveCollectionCenter() {
  const { mutate, loading, error } = useApiMutation<any, { centerId: string; hospitalId: string; notes?: string }>();

  const approveCenter = (centerId: string, hospitalId: string, notes?: string) => {
    return mutate(
      ({ centerId, hospitalId, notes }) => apiClient.approveCollectionCenter(centerId, hospitalId, notes),
      { centerId, hospitalId, notes }
    );
  };

  return { approveCenter, loading, error };
}

export function useAssignRider() {
  const { mutate, loading, error } = useApiMutation<any, { orderId: string; riderId: string }>();

  const assignRider = (orderId: string, riderId: string) => {
    return mutate(
      ({ orderId, riderId }) => apiClient.assignRider(orderId, riderId),
      { orderId, riderId }
    );
  };

  return { assignRider, loading, error };
}

export function useUpdateOrderStatus() {
  const { mutate, loading, error } = useApiMutation<any, { orderId: string; status: string }>();

  const updateStatus = (orderId: string, status: string) => {
    return mutate(
      ({ orderId, status }) => apiClient.updateOrderStatus(orderId, status),
      { orderId, status }
    );
  };

  return { updateStatus, loading, error };
}

// GPS Tracking hooks
export function useHospitalRiders(hospitalId: string) {
  return useApi(
    () => hospitalId ? apiClient.getHospitalRidersByHospitalId(hospitalId) : Promise.resolve({ success: true, data: { riders: [], total: 0 } } as any),
    [hospitalId]
  );
}

export function useCollectionCenters(hospitalId: string) {
  return useApi(
    () => hospitalId ? apiClient.getHospitalCollectionCenters(hospitalId) : Promise.resolve({ success: true, data: { collection_centers: [], total: 0 } } as any),
    [hospitalId]
  );
}

// QR Code and Audit hooks
export function useChainOfCustody(qrId: string) {
  return useApi(
    () => qrId ? apiClient.getChainOfCustody(qrId) : Promise.resolve({ success: true, data: { chain_of_custody: [] } } as any),
    [qrId]
  );
}

export function useOrderQRCodes(orderId: string) {
  return useApi(
    () => orderId && orderId.trim() ? apiClient.getOrderQRCodes(orderId) : Promise.resolve({ success: true, data: { qr_codes: [] } } as any),
    [orderId]
  );
}

// QR Scanning mutation hook
export function useQRScanner() {
  const { mutate, loading, error } = useApiMutation<any, { qrData: string; scanType: string; location?: string }>();

  const scanQR = async (qrData: string, scanType: string = 'delivery_confirm', location: string = 'Hospital Reception') => {
    return mutate(
      ({ qrData, scanType, location }) => apiClient.scanQR(qrData, { latitude: 0, longitude: 0 }),
      { qrData, scanType, location }
    );
  };

  return { scanQR, loading, error };
}

// SLA Dashboard hooks
export function useSLAMetrics(period?: string) {
  return useApi(
    () => apiClient.getSLAMetrics(period),
    [period]
  );
}

export function useSLAPerformance(period?: string) {
  return useApi(
    () => apiClient.getSLAPerformance(period),
    [period]
  );
}

export function useSLAAlerts(period?: string) {
  return useApi(
    () => apiClient.getSLAAlerts(period),
    [period]
  );
}

export function useSLAConfig() {
  return useApi(
    () => apiClient.getSLAConfig(),
    []
  );
}

// Reports & Analytics hooks
export function useReportsMetrics(period?: string) {
  return useApi(
    () => apiClient.getReportsMetrics(period),
    [period]
  );
}

export function useReportsPerformance(period?: string) {
  return useApi(
    () => apiClient.getReportsPerformance(period),
    [period]
  );
}

export function useReportsAlerts(period?: string) {
  return useApi(
    () => apiClient.getReportsAlerts(period),
    [period]
  );
}

export function useHospitalOrdersReport(params?: {
  status?: string;
  limit?: number;
  offset?: number;
  date_from?: string;
  date_to?: string;
  period?: string;
}) {
  return useApi(
    () => apiClient.getHospitalOrdersReport(params),
    [params]
  );
}

export function useRiderPerformanceReport(params?: {
  period?: string;
  hospital_id?: string;
}) {
  return useApi(
    () => apiClient.getRiderPerformanceReport(params),
    [params]
  );
}

// Hospital Orders hook
export function useHospitalOrders() {
  return useApi(
    () => apiClient.getHospitalOrders(),
    []
  );
}

// Hospital Riders hook - for Riders page (logged-in user's riders)
export function useHospitalRidersList() {
  return useApi(
    () => apiClient.getMyHospitalRiders(),
    []
  );
}

// My Hospitals hook
export function useMyHospitals() {
  return useApi(
    () => apiClient.getMyHospitals(),
    []
  );
}

// Pending Approvals hook
// Get pending riders for current hospital (riders with pending_hospital_approval status)
export function usePendingApprovals(hospitalId: string | undefined) {
  return useApi(
    () => hospitalId ? apiClient.getPendingRiders(hospitalId) : Promise.resolve({ success: true, data: { riders: [] } } as any),
    [hospitalId]
  );
}

// Get regional hospitals pending approval (for main hospitals only)
export function usePendingRegionalHospitals(hospitalId: string | undefined) {
  return useApi(
    () => hospitalId ? apiClient.getRegionalHospitalsForApproval(hospitalId) : Promise.resolve({ success: true, data: { regional_hospitals: [] } } as any),
    [hospitalId]
  );
}
