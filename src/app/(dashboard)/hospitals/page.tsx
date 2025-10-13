"use client";

import { useState } from "react";
import { useMyHospitals, useHospitalOrders, usePendingApprovals } from "@/hooks/useApi";
import { HospitalDetailModal } from "@/components/modals/HospitalDetailModal";
import { apiClient } from "@/lib/api";
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Hospital,
  Package,
  Eye,
  Check,
  X
} from "lucide-react";

export default function HospitalsPage() {
  const { data: hospitalsData, loading: hospitalsLoading } = useMyHospitals();
  const { data: ordersData } = useHospitalOrders();

  // Get hospitals
  const allHospitals = hospitalsData?.data?.hospitals || [];
  const mainHospital = allHospitals.find((h: any) => h.is_main_hospital);
  const regionalHospitals = allHospitals.filter((h: any) => !h.is_main_hospital);

  // Get pending regional hospitals for approval
  const mainHospitalId = mainHospital?.id;
  const { data: pendingData } = usePendingApprovals(mainHospitalId);
  const pendingRegionalHospitals = (pendingData?.data as any)?.regional_hospitals || [];

  // Combine approved and pending regional hospitals
  const allRegionalHospitals = [...regionalHospitals, ...pendingRegionalHospitals];

  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingHospitalId, setProcessingHospitalId] = useState<string | null>(null);

  // If user doesn't have a main hospital, show message
  if (!mainHospital) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Hospital className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Main Hospital Access Only</h2>
          <p className="text-gray-500">
            This page is only available for main hospital administrators.
          </p>
        </div>
      </div>
    );
  }

  // Get orders for all hospitals
  const allOrders = (ordersData?.data as any)?.orders || [];

  // Calculate statistics
  const activeHospitals = allRegionalHospitals.filter((h: any) => h.status === 'active').length;
  const pendingHospitals = allRegionalHospitals.filter((h: any) => h.status === 'pending_main_hospital_approval').length;
  const totalOrders = allOrders.length;

  // Filter hospitals
  const filteredHospitals = allRegionalHospitals.filter((hospital: any) => {
    const matchesSearch = hospital.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hospital.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || hospital.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'pending_main_hospital_approval':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
    }
  };

  const getHospitalOrders = (hospitalId: string) => {
    return allOrders.filter((o: any) => o.hospital_id === hospitalId);
  };

  const handleApproveHospital = async (hospitalId: string, hospitalName: string) => {
    if (!confirm(`Are you sure you want to approve ${hospitalName}?`)) {
      return;
    }

    try {
      setProcessingHospitalId(hospitalId);
      const response = await apiClient.approveRegionalHospital(hospitalId);

      if (response.success) {
        alert(`${hospitalName} has been approved successfully!`);
        window.location.reload(); // Reload to refresh the list
      } else {
        alert('Failed to approve hospital. Please try again.');
      }
    } catch (error) {
      console.error('Error approving hospital:', error);
      alert('An error occurred while approving the hospital.');
    } finally {
      setProcessingHospitalId(null);
    }
  };

  const handleRejectHospital = async (hospitalId: string, hospitalName: string) => {
    const reason = prompt(`Please provide a reason for rejecting ${hospitalName}:`);
    if (!reason) {
      return;
    }

    try {
      setProcessingHospitalId(hospitalId);
      const response = await apiClient.rejectRegionalHospital(hospitalId, reason);

      if (response.success) {
        alert(`${hospitalName} has been rejected.`);
        window.location.reload(); // Reload to refresh the list
      } else {
        alert('Failed to reject hospital. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting hospital:', error);
      alert('An error occurred while rejecting the hospital.');
    } finally {
      setProcessingHospitalId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Regional Hospitals</h1>
          <p className="text-gray-600">Manage regional hospitals in your network</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Hospital className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{allRegionalHospitals.length}</p>
              <p className="text-gray-600">Total Hospitals</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{activeHospitals}</p>
              <p className="text-gray-600">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{pendingHospitals}</p>
              <p className="text-gray-600">Pending Approval</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search hospitals by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending_main_hospital_approval">Pending Approval</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hospitals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHospitals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Hospital className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No hospitals found</p>
                    {searchQuery && (
                      <p className="text-sm text-gray-400 mt-1">
                        Try adjusting your search or filters
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredHospitals.map((hospital: any) => {
                  const hospitalOrders = getHospitalOrders(hospital.id);
                  return (
                    <tr key={hospital.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Hospital className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                            <div className="text-sm text-gray-500">{hospital.network_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div>{hospital.city || 'N/A'}</div>
                            {hospital.province && (
                              <div className="text-xs text-gray-500">{hospital.province}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {hospital.contact_phone && (
                            <div className="flex items-center mb-1">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              {hospital.contact_phone}
                            </div>
                          )}
                          {hospital.admin_phone && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Phone className="w-3 h-3 text-gray-400 mr-2" />
                              {hospital.admin_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(hospital.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{hospitalOrders.length}</span>
                          <span className="text-gray-500 ml-1">orders</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hospital.status === 'pending_main_hospital_approval' ? (
                            <>
                              <button
                                onClick={() => handleApproveHospital(hospital.id, hospital.name)}
                                disabled={processingHospitalId === hospital.id}
                                className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectHospital(hospital.id, hospital.name)}
                                disabled={processingHospitalId === hospital.id}
                                className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => {
                              setSelectedHospitalId(hospital.id);
                              setShowDetailModal(true);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hospital Detail Modal */}
      {selectedHospitalId && (
        <HospitalDetailModal
          hospitalId={selectedHospitalId}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedHospitalId(null);
          }}
        />
      )}
    </div>
  );
}
