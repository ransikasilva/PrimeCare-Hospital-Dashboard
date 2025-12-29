"use client";

import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  Filter,
  RefreshCw,
  Users,
  Plus,
  Trash2
} from "lucide-react";
import apiClient from '@/lib/api';

interface CollectionCenter {
  id: string;
  center_name: string;
  center_type: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  license_number: string;
  coordinates_lat: string;
  coordinates_lng: string;
  emergency_contact: string;
  status: string; // Overall status
  hospital_approval_status?: string; // This hospital's approval status: pending/approved/rejected
  hq_approval_status?: string; // HQ approval status: pending/approved/rejected/not_submitted
  hospital_approved_at?: string;
  hospital_approved_by?: string;
  created_at: string;
  updated_at: string;
  landline?: string;
  contact_person_phone?: string;
}

interface CollectionCenterModalProps {
  center: CollectionCenter | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (centerId: string, centerName: string) => Promise<void>;
  onReject: (centerId: string, centerName: string, reason?: string) => Promise<void>;
  isProcessing: boolean;
  hospitalId?: string;
}

export function CollectionCenterModal({
  center,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing,
  hospitalId
}: CollectionCenterModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'orders' | 'riders'>('details');

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrdersSection, setShowOrdersSection] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to 7 days ago
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Default to today
  });
  const [orderStatus, setOrderStatus] = useState('all');

  // Riders state
  const [assignedRiders, setAssignedRiders] = useState<any[]>([]);
  const [unassignedRiders, setUnassignedRiders] = useState<any[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);
  const [selectedRidersToAdd, setSelectedRidersToAdd] = useState<string[]>([]);

  // Fetch orders for the collection center
  const fetchOrders = async () => {
    if (!center) return;

    setLoadingOrders(true);
    try {
      const params: any = {
        date_from: startDate,
        date_to: endDate,
        limit: 50
      };

      if (orderStatus !== 'all') {
        params.status = orderStatus;
      }

      const response = await apiClient.getCollectionCenterOrders(center.id, params);
      if (response.success && response.data) {
        // Handle different possible response structures
        const ordersData = (response.data as any)?.orders || (response.data as any) || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        console.warn('No orders data received');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, startDate, endDate, orderStatus, center?.id]);

  // Fetch riders for the collection center
  const fetchRiders = async () => {
    if (!center) return;

    console.log('🚀 FETCHING RIDERS FOR CENTER:', center.id, center.center_name);
    setLoadingRiders(true);
    try {
      const [assignedResponse, unassignedResponse] = await Promise.all([
        apiClient.getRidersForCenter(center.id),
        apiClient.getUnassignedRidersForCenter(center.id, hospitalId)
      ]);
      console.log('🚀 RAW RESPONSES:', { assignedResponse, unassignedResponse });

      if (assignedResponse.success && assignedResponse.data) {
        // API returns { center_id, total_riders, riders: [...] }
        const ridersData = Array.isArray(assignedResponse.data)
          ? assignedResponse.data
          : (assignedResponse.data as any).riders || [];
        setAssignedRiders(Array.isArray(ridersData) ? ridersData : []);
      } else {
        setAssignedRiders([]);
      }

      if (unassignedResponse.success && unassignedResponse.data) {
        // API returns { center_id, total_unassigned, riders: [...] }
        console.log('Unassigned Response:', unassignedResponse);
        console.log('Unassigned Response Data:', unassignedResponse.data);
        const ridersData = Array.isArray(unassignedResponse.data)
          ? unassignedResponse.data
          : (unassignedResponse.data as any).riders || [];
        console.log('Riders Data Extracted:', ridersData);
        setUnassignedRiders(Array.isArray(ridersData) ? ridersData : []);
      } else {
        console.log('Unassigned Response Failed or Empty:', unassignedResponse);
        setUnassignedRiders([]);
      }
    } catch (error) {
      console.error('Error fetching riders:', error);
      setAssignedRiders([]);
      setUnassignedRiders([]);
    } finally {
      setLoadingRiders(false);
    }
  };

  const handleAssignRider = async (riderId: string) => {
    if (!center) return;

    try {
      const response = await apiClient.assignRiderToCenter(riderId, center.id);
      if (response.success) {
        await fetchRiders();
        setSelectedRidersToAdd([]);
      } else {
        alert(response.message || 'Failed to assign rider');
      }
    } catch (error) {
      console.error('Error assigning rider:', error);
      alert('Failed to assign rider');
    }
  };

  const handleRemoveRider = async (riderId: string) => {
    if (!center) return;

    if (!confirm('Are you sure you want to remove this rider from this collection center?')) {
      return;
    }

    try {
      const response = await apiClient.removeRiderFromCenter(riderId, center.id);
      if (response.success) {
        await fetchRiders();
      } else {
        alert(response.message || 'Failed to remove rider');
      }
    } catch (error) {
      console.error('Error removing rider:', error);
      alert('Failed to remove rider');
    }
  };

  const handleBulkAssign = async () => {
    if (!center || selectedRidersToAdd.length === 0) return;

    try {
      const response = await apiClient.bulkAssignRiders(selectedRidersToAdd, center.id);
      if (response.success) {
        await fetchRiders();
        setSelectedRidersToAdd([]);
        setShowAddRiderModal(false);
      } else {
        alert(response.message || 'Failed to assign riders');
      }
    } catch (error) {
      console.error('Error bulk assigning riders:', error);
      alert('Failed to assign riders');
    }
  };

  useEffect(() => {
    if (activeTab === 'riders') {
      fetchRiders();
    }
  }, [activeTab, center?.id]);

  if (!isOpen || !center) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_hospital_approval':
      case 'pending':
        return {
          icon: AlertTriangle,
          color: '#f59e0b',
          bg: 'bg-yellow-100',
          text: 'Pending Approval',
          className: 'text-yellow-800'
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          color: '#10b981',
          bg: 'bg-green-100',
          text: 'Approved',
          className: 'text-green-800'
        };
      case 'pending_hq_approval':
        return {
          icon: AlertTriangle,
          color: '#14b8a6',
          bg: 'bg-teal-100',
          text: 'Pending HQ Approval',
          className: 'text-teal-800'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: '#ef4444',
          bg: 'bg-red-100',
          text: 'Rejected',
          className: 'text-red-800'
        };
      default:
        return {
          icon: AlertTriangle,
          color: '#6b7280',
          bg: 'bg-gray-100',
          text: status,
          className: 'text-gray-800'
        };
    }
  };

  // Use hospital_approval_status if available (for multi-hospital centers), otherwise use center.status
  const displayStatus = center.hospital_approval_status || center.status;
  const statusConfig = getStatusConfig(displayStatus);
  const StatusIcon = statusConfig.icon;

  // Helper functions for order styling
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-teal-100 text-teal-800';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'routine':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = async () => {
    await onApprove(center.id, center.center_name);
    onClose();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    await onReject(center.id, center.center_name, rejectionReason);
    setShowRejectForm(false);
    setRejectionReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-4xl rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="relative p-8 text-white"
            style={{
              background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)'
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-black bg-opacity-20 hover:bg-red-500 hover:bg-opacity-90 border border-white border-opacity-30 hover:border-red-400 transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-lg group"
            >
              <X className="w-6 h-6 text-white drop-shadow-lg group-hover:text-white transition-all duration-200" />
            </button>
            
            <div className="flex items-start space-x-6">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Building2 className="w-10 h-10 text-white" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{center.center_name}</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-white/90">{center.city}, {center.province}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-white/90 capitalize">{center.center_type}</span>
                  </div>
                </div>
                
                <div 
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${statusConfig.bg}`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.className}`} />
                  <span className={`font-semibold ${statusConfig.className}`}>
                    {statusConfig.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-1 px-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'details'
                    ? 'border-teal-500 text-teal-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Details</span>
                </div>
              </button>

              {center.status === "approved" && (
                <>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-6 py-4 font-semibold transition-all duration-200 border-b-2 ${
                      activeTab === 'orders'
                        ? 'border-teal-500 text-teal-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>Orders</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('riders')}
                    className={`px-6 py-4 font-semibold transition-all duration-200 border-b-2 ${
                      activeTab === 'riders'
                        ? 'border-teal-500 text-teal-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Riders</span>
                      {assignedRiders.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded-full">
                          {assignedRiders.length}
                        </span>
                      )}
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-semibold text-gray-800">{center.contact_person}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-semibold text-gray-800">{center.phone}</p>
                      {center.contact_person_phone && (
                        <p className="text-sm text-gray-600">Alt: {center.contact_person_phone}</p>
                      )}
                      {center.landline && (
                        <p className="text-sm text-gray-600">Landline: {center.landline}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-semibold text-gray-800">{center.email}</p>
                    </div>
                  </div>

                  {center.emergency_contact && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="font-semibold text-gray-800">{center.emergency_contact}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Location & Details</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-semibold text-gray-800">{center.address}</p>
                      <p className="text-sm text-gray-600">
                        {center.city}, {center.province} {center.postal_code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-semibold text-gray-800">{center.license_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(center.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {center.coordinates_lat && center.coordinates_lng && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">GPS Coordinates</p>
                        <p className="font-semibold text-gray-800">
                          {parseFloat(center.coordinates_lat).toFixed(6)}, {parseFloat(center.coordinates_lng).toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                  <div className="space-y-4">
                    {/* Date and Status Filters */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-4 h-4 text-gray-600" />
                          <label className="text-sm font-medium text-gray-700">Filter Orders:</label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">From:</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">To:</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">Status:</label>
                          <select
                            value={orderStatus}
                            onChange={(e) => setOrderStatus(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                          >
                            <option value="all">All Orders</option>
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <button
                          onClick={fetchOrders}
                          disabled={loadingOrders}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                      </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-lg border overflow-hidden">
                      {loadingOrders ? (
                        <div className="p-8 text-center">
                          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                          <p className="text-gray-500">Loading orders...</p>
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="p-8 text-center">
                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No orders found for the selected period</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Hospital
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Rider
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Priority
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {order.order_number || order.id?.slice(0, 8)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(order.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
                                      {order.status?.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {order.hospital_name || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {order.rider_name || (order.rider_id ? 'Assigned' : 'Unassigned')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(order.urgency || 'routine')}`}>
                                      {(order.urgency || 'routine').toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            )}

            {/* Riders Tab */}
            {activeTab === 'riders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Assigned Riders</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Riders assigned to this collection center ({assignedRiders.length})
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddRiderModal(true)}
                    className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Riders</span>
                  </button>
                </div>

                {loadingRiders ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading riders...</p>
                  </div>
                ) : assignedRiders.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-2">No riders assigned yet</p>
                    <p className="text-gray-500 text-sm mb-4">
                      Assign riders to this collection center to handle pickups
                    </p>
                    <button
                      onClick={() => setShowAddRiderModal(true)}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 inline-flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add First Rider</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedRiders.map((rider: any) => (
                      <div
                        key={rider.rider_id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {rider.profile_picture ? (
                              <img
                                src={rider.profile_picture}
                                alt={rider.rider_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-teal-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-teal-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800">{rider.rider_name}</p>
                              <p className="text-xs text-gray-500">{rider.phone}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveRider(rider.rider_id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Remove rider"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span className={`font-medium ${
                              rider.assignment_status === 'active' ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {rider.assignment_status === 'active' ? 'Active' : rider.assignment_status}
                            </span>
                          </div>
                          {rider.total_pickups > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Total Pickups:</span>
                                <span className="font-medium text-gray-800">{rider.total_pickups}</span>
                              </div>
                              {rider.avg_pickup_time_minutes && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Avg Time:</span>
                                  <span className="font-medium text-gray-800">
                                    {Math.round(rider.avg_pickup_time_minutes)} min
                                  </span>
                                </div>
                              )}
                              {rider.rating && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Rating:</span>
                                  <span className="font-medium text-yellow-600">
                                    ⭐ {Number(rider.rating).toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span className="text-gray-500">Assigned:</span>
                            <span className="text-xs text-gray-600">
                              {new Date(rider.assigned_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Rider Modal */}
                {showAddRiderModal && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                      className="fixed inset-0 transition-all duration-300"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.15)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                      }}
                      onClick={() => {
                        setShowAddRiderModal(false);
                        setSelectedRidersToAdd([]);
                      }}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">Add Riders to Collection Center</h3>
                            <button
                              onClick={() => {
                                setShowAddRiderModal(false);
                                setSelectedRidersToAdd([]);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                        </div>

                        <div className="p-6 max-h-96 overflow-y-auto">
                          {unassignedRiders.length === 0 ? (
                            <div className="text-center py-8">
                              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">All riders are already assigned to this center</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {unassignedRiders.map((rider: any) => (
                                <label
                                  key={rider.id}
                                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-300 cursor-pointer transition-all"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedRidersToAdd.includes(rider.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRidersToAdd([...selectedRidersToAdd, rider.id]);
                                      } else {
                                        setSelectedRidersToAdd(selectedRidersToAdd.filter(id => id !== rider.id));
                                      }
                                    }}
                                    className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                                  />
                                  {rider.profile_picture ? (
                                    <img
                                      src={rider.profile_picture}
                                      alt={rider.full_name || rider.rider_name}
                                      className="ml-3 w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  ) : (
                                    <div className="ml-3 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                      <User className="w-6 h-6 text-teal-600" />
                                    </div>
                                  )}
                                  <div className="ml-4 flex-1">
                                    <p className="font-semibold text-gray-800">{rider.full_name || rider.rider_name}</p>
                                    <p className="text-sm text-gray-500">{rider.phone}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-xs font-medium px-3 py-1 rounded-full ${
                                      rider.availability_status === 'available'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {rider.availability_status}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {unassignedRiders.length > 0 && (
                          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                              onClick={() => {
                                setShowAddRiderModal(false);
                                setSelectedRidersToAdd([]);
                              }}
                              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleBulkAssign}
                              disabled={selectedRidersToAdd.length === 0}
                              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Add {selectedRidersToAdd.length > 0 && `(${selectedRidersToAdd.length})`} Riders
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {(center.status === "pending_hospital_approval" || center.status === "pending_hq_approval" || center.status === "approved" || center.status === "rejected" || center.hospital_approval_status === "pending") && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                {!showRejectForm ? (
                  <div className="flex justify-end space-x-4">
                    {/* Show Reject button only if not already rejected by this hospital */}
                    {center.hospital_approval_status !== "rejected" && center.status !== "rejected" && (
                      <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={isProcessing}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5" />
                          <span>Reject Center</span>
                        </div>
                      </button>
                    )}

                    {/* Show Approve button if THIS hospital hasn't approved yet (check hospital_approval_status) */}
                    {(center.hospital_approval_status === "pending" || center.status === "pending_hospital_approval") && (
                      <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>{isProcessing ? 'Approving...' : 'Approve Center'}</span>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a detailed reason for rejecting this collection center..."
                        className="w-full p-4 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason("");
                        }}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105"
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151'
                        }}
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={handleReject}
                        disabled={isProcessing || !rejectionReason.trim()}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5" />
                          <span>{isProcessing ? 'Rejecting...' : 'Confirm Rejection'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}