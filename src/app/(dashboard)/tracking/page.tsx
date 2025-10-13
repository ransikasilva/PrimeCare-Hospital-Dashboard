"use client";

import { LiveMap } from "@/components/LiveMap";
import { useHospitalRiders, useMyHospitals, useHospitalDashboard } from "@/hooks/useApi";

export default function TrackingPage() {
  // Get hospital data
  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  
  // Get riders data - only call if we have a hospitalId
  const shouldFetchRiders = !!hospitalId;
  const { data: ridersData, loading: ridersLoading, error: ridersError } = useHospitalRiders(shouldFetchRiders ? hospitalId : '');
  
  // Get dashboard data for collection centers
  const { data: dashboardData } = useHospitalDashboard();
  
  // Extract riders safely
  let riders: any[] = [];
  if (ridersData?.data) {
    const data = ridersData.data as any;
    if (Array.isArray(data.riders)) {
      riders = data.riders;
    } else if (Array.isArray(data)) {
      riders = data;
    }
  }

  // Extract collection centers safely
  let collectionCenters: any[] = [];
  if (dashboardData?.data?.collection_centers) {
    collectionCenters = dashboardData.data.collection_centers.filter((center: any) => 
      center.coordinates_lat && center.coordinates_lng
    );
  }

  // Debug logging for development
  console.log('Tracking Page - Hospital ID:', hospitalId);
  console.log('Tracking Page - Riders Data:', ridersData);
  console.log('Tracking Page - Dashboard Data:', dashboardData);
  console.log('Tracking Page - Dashboard Data Full:', JSON.stringify(dashboardData, null, 2));
  console.log('Tracking Page - Riders Error:', ridersError);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'px-2 py-1 text-xs bg-green-100 text-green-800 rounded';
      case 'busy':
        return 'px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded';
      case 'offline':
        return 'px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded';
      default:
        return 'px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Live Rider Tracking</h1>
        <p className="text-gray-600">Real-time GPS tracking of active riders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <LiveMap />
        </div>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">Active Riders</h3>
            {ridersError ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-600">Error: {ridersError}</p>
              </div>
            ) : ridersLoading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading riders...</p>
              </div>
            ) : riders.length > 0 ? (
              <div className="space-y-3">
                {riders.map((rider: any) => (
                  <div key={rider.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{rider.rider_name}</p>
                      <p className="text-sm text-gray-500">{rider.vehicle_type || 'Motorcycle'}</p>
                    </div>
                    <span className={getStatusBadge(rider.availability_status)}>
                      {rider.availability_status?.charAt(0).toUpperCase() + rider.availability_status?.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm py-4">No riders found</p>
            )}
          </div>
          
          {/* GPS Status Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">GPS Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Riders</span>
                <span className="text-sm font-medium">{riders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">With GPS</span>
                <span className="text-sm font-medium">
                  {riders.filter((r: any) => r.current_location).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available</span>
                <span className="text-sm font-medium text-green-600">
                  {riders.filter((r: any) => r.availability_status === 'available').length}
                </span>
              </div>
            </div>
          </div>

          {/* Collection Centers Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">Collection Centers</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Centers</span>
                <span className="text-sm font-medium">{collectionCenters.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">With GPS</span>
                <span className="text-sm font-medium text-orange-600">
                  {collectionCenters.filter((c: any) => c.coordinates_lat && c.coordinates_lng).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Orders</span>
                <span className="text-sm font-medium">
                  {collectionCenters.reduce((sum: number, c: any) => sum + (c.active_orders || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}