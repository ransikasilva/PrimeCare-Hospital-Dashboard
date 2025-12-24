"use client";

import { useHospitalDashboard, usePendingApprovals, useMyHospitals, useApproveCollectionCenter } from "@/hooks/useApi";
import { useState } from "react";
import { CollectionCenterModal } from "./CollectionCenterModal";

interface CentersTableProps {
  searchTerm?: string;
  statusFilter?: string;
  typeFilter?: string;
  sortBy?: 'name' | 'status' | 'type' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export function CentersTable({ searchTerm = '', statusFilter = 'all', typeFilter = 'all', sortBy = 'name', sortOrder = 'asc' }: CentersTableProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { approveCenter, loading: approveLoading } = useApproveCollectionCenter();

  const { data: dashboardData, loading: dashboardLoading, refetch: refetchDashboard } = useHospitalDashboard();
  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  console.log('🔍 hospitalId being passed to usePendingApprovals:', hospitalId, typeof hospitalId);
  const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = usePendingApprovals(hospitalId || '');

  // Force refresh pending data when hospitalId changes
  useState(() => {
    if (hospitalId) {
      refetchPending();
    }
  });

  // Get all centers from dashboard (now includes pending ones too)
  const allCenters = (dashboardData as any)?.data?.collection_centers || [];
  const pendingCenters = (pendingData as any)?.data?.collection_centers || [];

  // Combine and deduplicate centers by ID
  const centerMap = new Map();
  [...allCenters, ...pendingCenters].forEach(center => {
    centerMap.set(center.id, center);
  });
  let centers = Array.from(centerMap.values());

  // Apply status filter
  if (statusFilter !== 'all') {
    centers = centers.filter((center: any) => center.status === statusFilter);
  }

  // Apply type filter
  if (typeFilter !== 'all') {
    centers = centers.filter((center: any) => center.center_type === typeFilter);
  }

  // Apply search filter
  if (searchTerm) {
    centers = centers.filter((center: any) =>
      center.center_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply sorting
  centers = centers.sort((a: any, b: any) => {
    let compareValue = 0;
    switch (sortBy) {
      case 'name':
        compareValue = (a.center_name || '').localeCompare(b.center_name || '');
        break;
      case 'status':
        compareValue = (a.status || '').localeCompare(b.status || '');
        break;
      case 'type':
        compareValue = (a.center_type || '').localeCompare(b.center_type || '');
        break;
      case 'created':
        compareValue = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        break;
    }
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });
  
  // Separate for display counts
  const activeCenters = centers.filter(c => c.status === 'approved' || c.status === 'active');
  const pendingHospitalCenters = centers.filter(c => c.status === 'pending_hospital_approval');
  const pendingHQCenters = centers.filter(c => c.status === 'pending_hq_approval');
  const totalPendingCenters = pendingHospitalCenters.length + pendingHQCenters.length;
  
  const loading = dashboardLoading || pendingLoading;

  // Debug logging
  console.log('🏢 Centers Debug:', {
    dashboardData,
    pendingData,
    activeCenters,
    pendingCenters,
    centers,
    loading,
    hospitalId
  });
  
  // Full API response debug
  console.log('🔍 Full pendingData:', JSON.stringify(pendingData, null, 2));
  console.log('🔍 API URL being called:', `/api/approvals/hospitals/${hospitalId}/pending`);
  console.log('🔍 Auth token:', localStorage.getItem('auth_token')?.substring(0, 20) + '...');


  // Real approve function
  const handleApprove = async (centerId: string, centerName: string) => {
    console.log('🏥 Approve attempt:', { centerId, centerName, hospitalId, hospitalsData });
    
    if (processingIds.has(centerId)) {
      console.log('❌ Already processing this center');
      return;
    }
    
    if (!hospitalId) {
      alert('❌ Hospital ID not found. Please refresh the page and try again.');
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(centerId));
    
    try {
      const result = await approveCenter(centerId, hospitalId);
      if (result.success) {
        // Refresh data after successful approval
        await Promise.all([refetchDashboard(), refetchPending()]);
        alert(`✅ ${centerName} has been approved successfully!`);
      } else {
        alert(`❌ Failed to approve ${centerName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert(`❌ Error approving ${centerName}: ${error}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(centerId);
        return newSet;
      });
    }
  };

  // Real reject function
  const handleReject = async (centerId: string, centerName: string, reason?: string) => {
    if (processingIds.has(centerId)) return;

    if (!hospitalId) {
      alert('❌ Hospital ID not found. Please refresh the page and try again.');
      return;
    }

    // If no reason provided (e.g., from modal), prompt for it
    const rejectionReason = reason || prompt(`Enter rejection reason for ${centerName}:`);
    if (!rejectionReason) return;

    setProcessingIds(prev => new Set(prev).add(centerId));

    try {
      // Using the new hospital-specific reject API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/approvals/collection-centers/${centerId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          hospitalId: hospitalId,
          reason: rejectionReason
        })
      });

      const result = await response.json();

      if (result.success) {
        await Promise.all([refetchDashboard(), refetchPending()]);
        alert(`✅ ${centerName} has been rejected for this hospital.`);
      } else {
        alert(`❌ Failed to reject ${centerName}: ${result.error?.message || result.error?.details}`);
      }
    } catch (error) {
      console.error('Rejection error:', error);
      alert(`❌ Error rejecting ${centerName}: ${error}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(centerId);
        return newSet;
      });
    }
  };

  // Open center details modal
  const handleViewCenter = (center: any) => {
    setSelectedCenter(center);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCenter(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
        return "bg-green-100 text-green-800 border border-green-200 shadow-sm";
      case "pending_hospital_approval":
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm";
      case "pending_hq_approval":
        return "bg-teal-100 text-teal-800 border border-teal-200 shadow-sm";
      case "inactive":
      case "rejected":
        return "bg-gray-100 text-gray-800 border border-gray-200 shadow-sm";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200 shadow-sm";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "independent":
        return "bg-teal-100 text-teal-800 border border-teal-200 shadow-sm";
      case "dependent":
        return "bg-purple-100 text-purple-800 border border-purple-200 shadow-sm";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200 shadow-sm";
    }
  };

  const getCenterNameColor = (centerName: string) => {
    // Different colors for different center types based on name patterns
    if (centerName?.toLowerCase().includes('silva')) {
      return "text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200 font-medium";
    } else if (centerName?.toLowerCase().includes('elite')) {
      return "text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-200 font-medium";
    } else {
      return "text-gray-700 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 font-medium";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Collection Centers</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
            Active ({activeCenters.length})
          </button>
          <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded">
            Pending Hospital ({pendingHospitalCenters.length})
          </button>
          <button className="px-3 py-1 text-sm bg-teal-100 text-teal-800 rounded">
            Pending HQ ({pendingHQCenters.length})
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Center
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Pickup
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {centers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No collection centers found
                </td>
              </tr>
            ) : (
              centers.map((center: any) => (
                <tr key={center.id} className="hover:bg-teal-50 cursor-pointer transition-colors duration-200" onClick={() => handleViewCenter(center)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-12 bg-green-400 rounded-l-md mr-3"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center border border-green-300">
                        <span className="text-green-700 font-bold text-sm">
                          {(center.center_name || center.name || 'CC').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm ${getCenterNameColor(center.center_name || center.name)}`}>
                          {center.center_name || center.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{center.center_type || 'Independent'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={center.address || center.city || center.location || 'N/A'}>
                      {center.address || center.city || center.location || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(center.center_type || center.type)}`}>
                      {center.center_type || center.type || 'Independent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(center.relation_status || center.status)}`}>
                      {(center.relation_status === 'pending' ? 'Pending Approval' :
                        center.relation_status === 'approved' ? 'Approved' :
                        center.status === 'approved' ? 'Active' :
                        center.status === 'pending_hospital_approval' ? 'Pending Hospital Approval' :
                        center.status === 'pending_hq_approval' ? 'Pending HQ Approval' :
                        center.status === 'active' ? 'Active' :
                        center.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{center.active_orders || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {center.last_pickup || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-teal-600 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCenter(center);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Collection Center Details Modal */}
      <CollectionCenterModal
        center={selectedCenter}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={processingIds.has(selectedCenter?.id || '')}
        hospitalId={hospitalId}
      />
    </div>
  );
}