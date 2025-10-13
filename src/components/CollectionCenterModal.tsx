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
  RefreshCw
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
  status: string;
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
}

export function CollectionCenterModal({
  center,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing
}: CollectionCenterModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

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

  // Fetch orders for the collection center
  const fetchOrders = async () => {
    if (!center || !showOrdersSection) return;

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
    if (showOrdersSection) {
      fetchOrders();
    }
  }, [showOrdersSection, startDate, endDate, orderStatus, center?.id]);

  if (!isOpen || !center) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_hospital_approval':
        return {
          icon: AlertTriangle,
          color: '#f59e0b',
          bg: 'bg-yellow-100',
          text: 'Pending Hospital Approval',
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

  const statusConfig = getStatusConfig(center.status);
  const StatusIcon = statusConfig.icon;

  // Helper functions for order styling
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
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
              background: 'linear-gradient(135deg, #5DADE2 0%, #4A9BC7 100%)'
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

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
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
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-indigo-600" />
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

            {/* Orders Section */}
            {center.status === "approved" && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Package className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-800">Orders History</h3>
                  </div>

                  <button
                    onClick={() => setShowOrdersSection(!showOrdersSection)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  >
                    {showOrdersSection ? 'Hide Orders' : 'View Orders'}
                  </button>
                </div>

                {showOrdersSection && (
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
                )}
              </div>
            )}

            {/* Action Buttons */}
            {center.status === "pending_hospital_approval" && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                {!showRejectForm ? (
                  <div className="flex justify-end space-x-4">
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
                        className="w-full p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 resize-none"
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