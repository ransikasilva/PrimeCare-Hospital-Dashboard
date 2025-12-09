"use client";

import { CentersTable } from "@/components/CentersTable";
import { useHospitalDashboard, usePendingApprovals, useMyHospitals } from "@/hooks/useApi";

export default function CentersPage() {
  const { data: dashboardData, loading: dashboardLoading } = useHospitalDashboard();
  const { data: hospitalsData, loading: hospitalsLoading } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  const { data: pendingData, loading: pendingLoading } = usePendingApprovals(hospitalId || '');
  
  
  // Calculate real statistics
  const allCenters = dashboardData?.data?.collection_centers || [];
  const pendingCenters = pendingData?.data?.collection_centers || [];
  
  // Combine and deduplicate centers by ID
  const centerMap = new Map();
  [...allCenters, ...pendingCenters].forEach(center => {
    centerMap.set(center.id, center);
  });
  const centers = Array.from(centerMap.values());
  
  // Separate for display counts
  const activeCenters = centers.filter(c => c.status === 'approved' || c.status === 'active');
  const pendingApprovalCenters = centers.filter(c =>
    c.status === 'pending_hospital_approval' || c.status === 'pending_hq_approval'
  );
  const rejectedCenters = centers.filter(c => c.status === 'rejected');

  // Only count non-rejected centers for center types
  const nonRejectedCenters = centers.filter((c: any) => c.status !== 'rejected');
  const dependentCenters = nonRejectedCenters.filter((c: any) => c.center_type === 'dependent').length;
  const independentCenters = nonRejectedCenters.filter((c: any) => c.center_type === 'independent').length;
  const totalCenters = nonRejectedCenters.length; // Total should match dependent + independent
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Collection Centers</h1>
          <p className="text-gray-600">Manage collection center approvals and relationships</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Center Types</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dependent Centers</span>
              <span className="font-semibold text-gray-900">{dependentCenters}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Independent Centers</span>
              <span className="font-semibold text-gray-900">{independentCenters}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="font-medium text-gray-900">Total Centers</span>
              <span className="font-semibold text-lg text-gray-900">{totalCenters}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Centers</span>
              <span className="font-semibold text-green-600">{activeCenters.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Approval</span>
              <span className="font-semibold text-yellow-600">{pendingApprovalCenters.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rejected</span>
              <span className="font-semibold text-red-600">{rejectedCenters.length}</span>
            </div>
          </div>
        </div>
      </div>

      <CentersTable />
    </div>
  );
}