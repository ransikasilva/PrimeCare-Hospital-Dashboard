"use client";

import { CentersTable } from "@/components/CentersTable";
import { useHospitalDashboard, usePendingApprovals, useMyHospitals } from "@/hooks/useApi";
import { useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";

export default function CentersPage() {
  const { data: dashboardData, loading: dashboardLoading } = useHospitalDashboard();
  const { data: hospitalsData, loading: hospitalsLoading } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  const { data: pendingData, loading: pendingLoading } = usePendingApprovals(hospitalId || '');

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'type' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Only count approved centers for center types
  const approvedCenters = centers.filter((c: any) => c.status === 'approved');
  const dependentCenters = approvedCenters.filter((c: any) => c.center_type === 'dependent').length;
  const independentCenters = approvedCenters.filter((c: any) => c.center_type === 'independent').length;
  const totalCenters = approvedCenters.length; // Total should match dependent + independent
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

      {/* Search and Sort Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search centers by name, address, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending_hospital_approval">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="dependent">Dependent</option>
              <option value="independent">Independent</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="type">Sort by Type</option>
              <option value="created">Sort by Date Joined</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <CentersTable searchTerm={searchTerm} statusFilter={statusFilter} typeFilter={typeFilter} sortBy={sortBy} sortOrder={sortOrder} />
    </div>
  );
}