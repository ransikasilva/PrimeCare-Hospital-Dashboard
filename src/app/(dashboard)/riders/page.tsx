"use client";

import { RidersTable } from "@/components/RidersTable";
import { useMyHospitals, usePendingApprovals, useRiders } from "@/hooks/useApi";

export default function RidersPage() {
  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  const { data: pendingData } = usePendingApprovals(hospitalId || '');
  const { data: ridersData } = useRiders(hospitalId || '');
  
  // Get all riders from both sources
  const activeRiders = ridersData?.data?.riders || [];
  const pendingRiders = pendingData?.data?.riders || [];
  
  // Combine and deduplicate riders by ID
  const riderMap = new Map();
  [...activeRiders, ...pendingRiders].forEach(rider => {
    riderMap.set(rider.id, rider);
  });
  const allRiders = Array.from(riderMap.values());
  
  const pendingCount = allRiders.filter((r: any) => r.status === 'pending_hospital_approval').length;
  const activeCount = allRiders.filter((r: any) => r.status === 'approved').length;
  const totalRiders = allRiders.length;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rider Management</h1>
          <p className="text-gray-600">Manage rider approvals and performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{activeCount}</p>
              <p className="text-gray-600">Active Riders</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
              <p className="text-gray-600">Pending Approval</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{totalRiders}</p>
              <p className="text-gray-600">Total Riders</p>
            </div>
          </div>
        </div>
      </div>

      <RidersTable />
    </div>
  );
}