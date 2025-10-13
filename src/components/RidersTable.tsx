"use client";

import { useState, useEffect } from "react";
import { useMyHospitals, usePendingApprovals, useRiders, useApproveRider } from "@/hooks/useApi";
import { RiderModal } from "./RiderModal";
import apiClient from "@/lib/api";

export function RidersTable() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [riderKMData, setRiderKMData] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Today's date
  const { approveRider, loading: approveLoading } = useApproveRider();
  
  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  const { data: pendingData, loading: pendingLoading, error, refetch: refetchPending } = usePendingApprovals(hospitalId || '');
  const { data: ridersData, loading: ridersLoading, refetch: refetchRiders } = useRiders(hospitalId || '');
  
  // Get all riders from both sources
  const activeRiders = (ridersData?.data as any)?.riders || [];
  const pendingRiders = (pendingData?.data as any)?.riders || [];
  
  // Combine and deduplicate riders by ID
  const riderMap = new Map();
  [...activeRiders, ...pendingRiders].forEach(rider => {
    riderMap.set(rider.id, rider);
  });
  const riders = Array.from(riderMap.values());
  
  const loading = pendingLoading || ridersLoading;

  // Fetch KM data for all riders using batch endpoint
  useEffect(() => {
    const fetchRiderKMData = async () => {
      if (!hospitalId) return;

      try {
        // Use the new batch endpoint to get all riders' KM data at once
        const batchResponse = await apiClient.getAllRidersDailyKM(hospitalId, selectedDate);

        if (batchResponse.success && batchResponse.data.riders_data) {
          // Convert the response to match our expected format
          const kmData: Record<string, any> = {};

          Object.entries(batchResponse.data.riders_data).forEach(([riderId, data]: [string, any]) => {
            kmData[riderId] = {
              daily_km: data.daily_km || 0,
              weekly_km: data.weekly_km || 0,
              monthly_km: data.monthly_km || 0
            };
          });

          setRiderKMData(kmData);
        } else {
          console.warn('No batch KM data received from API');
          setRiderKMData({});
        }
      } catch (error) {
        console.error('Error fetching batch KM data:', error);
        setRiderKMData({});
      }
    };

    fetchRiderKMData();
  }, [hospitalId, selectedDate]);

  const handleApprove = async (riderId: string, riderName: string) => {
    if (processingIds.has(riderId)) return;
    
    setProcessingIds(prev => new Set(prev).add(riderId));
    
    try {
      const result = await approveRider(riderId);
      if (result.success) {
        await Promise.all([refetchPending(), refetchRiders()]);
        alert(`✅ ${riderName} has been approved successfully!`);
      } else {
        alert(`❌ Failed to approve ${riderName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Rider approval error:', error);
      alert(`❌ Error approving ${riderName}: ${error}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(riderId);
        return newSet;
      });
    }
  };

  const handleReject = async (riderId: string, riderName: string) => {
    if (processingIds.has(riderId)) return;
    
    const reason = prompt(`Enter rejection reason for ${riderName}:`);
    if (!reason) return;
    
    setProcessingIds(prev => new Set(prev).add(riderId));
    
    try {
      const response = await fetch(`http://localhost:3000/api/approvals/reject/rider/${riderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          rejection_reason: reason,
          notes: `Rejected by hospital: ${reason}`
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await Promise.all([refetchPending(), refetchRiders()]);
        alert(`✅ ${riderName} has been rejected.`);
      } else {
        alert(`❌ Failed to reject ${riderName}: ${result.error?.message}`);
      }
    } catch (error) {
      console.error('Rider rejection error:', error);
      alert(`❌ Error rejecting ${riderName}: ${error}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(riderId);
        return newSet;
      });
    }
  };

  const handleViewDetails = (rider: any) => {
    setSelectedRider(rider);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRider(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border border-green-200 shadow-sm";
      case "Pending Approval":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm";
      case "Offline":
        return "bg-gray-100 text-gray-800 border border-gray-200 shadow-sm";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200 shadow-sm";
    }
  };

  const getVehicleColor = (vehicleType: string) => {
    switch (vehicleType?.toLowerCase()) {
      case "motorcycle":
      case "bike":
        return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
      case "car":
      case "vehicle":
        return "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm";
      case "van":
        return "bg-green-50 text-green-700 border border-green-200 shadow-sm";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200 shadow-sm";
    }
  };

  const getRiderNameColor = (riderName: string) => {
    // Different colors for different riders based on name patterns
    if (riderName?.toLowerCase().includes('kamal')) {
      return "text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 font-medium";
    } else if (riderName?.toLowerCase().includes('silva')) {
      return "text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200 font-medium";
    } else if (riderName?.toLowerCase().includes('fernando')) {
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
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = riders.filter((r: any) => r.status === 'pending').length;
  const activeCount = riders.filter((r: any) => r.status === 'approved').length;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Rider Management</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded">
              Pending ({pendingCount})
            </button>
            <button className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
              Active ({activeCount})
            </button>
          </div>
        </div>

        {/* Date Selector for KM Data */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            View KM data for:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
          />
          <span className="text-xs text-gray-600 font-medium">
            Showing individual rider KM for {selectedDate}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Daily KM
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {riders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No riders found
                </td>
              </tr>
            ) : (
              riders.map((rider: any) => (
                <tr key={rider.id} className="hover:bg-indigo-50 cursor-pointer transition-colors duration-200" onClick={() => handleViewDetails(rider)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-12 bg-indigo-400 rounded-l-md mr-3"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center border border-indigo-300">
                        <span className="text-indigo-700 font-bold text-sm">
                          {(rider.rider_name || rider.name || 'R').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm ${getRiderNameColor(rider.rider_name || rider.name)}`}>
                          {rider.rider_name || rider.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            ID: {rider.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-sm font-medium text-gray-900">{rider.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVehicleColor(rider.vehicle_type || rider.vehicle || 'Motorcycle')}`}>
                      {rider.vehicle_type || rider.vehicle || 'Motorcycle'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rider.status === 'pending' ? 'Pending Approval' : 'Active')}`}>
                      {rider.status === 'pending' ? 'Pending Approval' : rider.status === 'approved' ? 'Active' : rider.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700">
                      {riderKMData[rider.id]?.daily_km || '0'} km
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {rider.status === "pending" ? (
                      <div className="flex space-x-2">
                        <button 
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors duration-200 disabled:opacity-50"
                          disabled={processingIds.has(rider.id) || approveLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(rider.id, rider.rider_name || rider.name);
                          }}
                        >
                          {processingIds.has(rider.id) ? 'Approving...' : 'Approve'}
                        </button>
                        <button 
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50"
                          disabled={processingIds.has(rider.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(rider.id, rider.rider_name || rider.name);
                          }}
                        >
                          {processingIds.has(rider.id) ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(rider);
                        }}
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rider Details Modal */}
      <RiderModal
        rider={selectedRider}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={processingIds.has(selectedRider?.id || '')}
        hospitalId={hospitalId}
      />
    </div>
  );
}