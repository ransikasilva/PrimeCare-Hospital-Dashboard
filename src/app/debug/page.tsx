"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useHospitalDashboard, useMyHospitals, usePendingApprovals } from "@/hooks/useApi";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useHospitalDashboard();
  const { data: hospitalsData, loading: hospitalsLoading, error: hospitalsError } = useMyHospitals();
  const [hospitalId, setHospitalId] = useState<string>('');
  
  useEffect(() => {
    console.log('🔍 Hospital data received:', hospitalsData);
    console.log('🔍 Extracting ID from:', hospitalsData?.data?.hospitals?.[0]?.id);
    if (hospitalsData?.data?.hospitals?.[0]?.id) {
      const extractedId = hospitalsData.data.hospitals[0].id;
      console.log('✅ Setting hospital ID:', extractedId);
      setHospitalId(extractedId);
    }
  }, [hospitalsData]);
  
  const { data: pendingData, loading: pendingLoading, error: pendingError } = usePendingApprovals(hospitalId);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">API Debug Page</h1>
      
      {/* Auth Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <div className="space-y-2">
          <p><strong>Is Authenticated:</strong> {isAuthenticated.toString()}</p>
          <p><strong>Auth Loading:</strong> {authLoading.toString()}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
          <p><strong>Token in localStorage:</strong> {typeof window !== 'undefined' ? localStorage.getItem('auth_token') ? 'Present' : 'Not Found' : 'SSR'}</p>
        </div>
      </div>

      {/* My Hospitals API */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">My Hospitals API</h2>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {hospitalsLoading.toString()}</p>
          <p><strong>Error:</strong> {hospitalsError || 'None'}</p>
          <p><strong>Hospital ID:</strong> {hospitalId || 'Not found'}</p>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">{JSON.stringify(hospitalsData, null, 2)}</pre>
          </div>
        </div>
      </div>

      {/* Dashboard API */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Hospital Dashboard API</h2>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {dashboardLoading.toString()}</p>
          <p><strong>Error:</strong> {dashboardError || 'None'}</p>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">{JSON.stringify(dashboardData, null, 2)}</pre>
          </div>
        </div>
      </div>

      {/* Pending Approvals API */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Pending Approvals API</h2>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {pendingLoading.toString()}</p>
          <p><strong>Error:</strong> {pendingError || 'None'}</p>
          <p><strong>Hospital ID used:</strong> {hospitalId}</p>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">{JSON.stringify(pendingData, null, 2)}</pre>
          </div>
        </div>
      </div>
      
      {/* Expected vs Actual */}
      <div className="bg-yellow-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Expected vs Actual</h2>
        <div className="space-y-2">
          <p><strong>Expected Pending Centers:</strong> 5 collection centers</p>
          <p><strong>Actual Centers Count:</strong> {(pendingData as any)?.data?.collection_centers?.length || 0}</p>
          <p><strong>Expected Names:</strong> Elite Medical, Advanced Medical Labs, TransFleet Test Lab 1, TransFleet Test Lab 2, Handover Test Lab</p>
        </div>
      </div>
    </div>
  );
}