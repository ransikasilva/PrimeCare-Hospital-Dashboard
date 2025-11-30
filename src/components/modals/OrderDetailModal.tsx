"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import {
  X,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  MapPin,
  Phone,
  Calendar,
  Hash,
  FileText,
  Navigation,
  QrCode,
  Activity,
  Flag,
  ArrowRight,
} from 'lucide-react';

interface OrderDetailProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ orderId, isOpen, onClose }: OrderDetailProps) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getOrderById(orderId);
      setOrder(response.data?.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_rider_assignment': 'text-yellow-600 bg-yellow-50',
      'assigned': 'text-teal-600 bg-teal-50',
      'in_transit': 'text-purple-600 bg-purple-50',
      'delivered': 'text-green-600 bg-green-50',
      'cancelled': 'text-red-600 bg-red-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] overflow-hidden flex flex-col" style={{
        border: '1px solid rgba(203, 213, 225, 0.3)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Package className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-600 font-mono">{order?.order_number || 'Loading...'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className={`mt-1 px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(order?.status)}`}>
                      {order?.status?.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  {order?.urgency === 'urgent' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">URGENT</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Route Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Collection Center */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">From: Collection Center</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">{order?.center_name}</p>
                    <p className="text-gray-600">{order?.center_address}</p>
                    {order?.center_phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {order.center_phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hospital */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flag className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">To: Hospital</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">{order?.hospital_name}</p>
                    <p className="text-gray-600">{order?.hospital_address}</p>
                    {order?.hospital_contact_phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {order.hospital_contact_phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rider Info */}
              {order?.rider_name && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Assigned Rider</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="text-gray-600">Name</label>
                      <p className="font-medium text-gray-900">{order.rider_name}</p>
                    </div>
                    <div>
                      <label className="text-gray-600">Phone</label>
                      <p className="font-medium text-gray-900">{order.rider_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-gray-600">Vehicle</label>
                      <p className="font-medium text-gray-900">{order.vehicle_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Sample Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Type</label>
                    <p className="font-medium text-gray-900">{order?.sample_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Quantity</label>
                    <p className="font-medium text-gray-900">{order?.sample_quantity || 'N/A'}</p>
                  </div>
                </div>
                {order?.special_instructions && (
                  <div className="mt-3">
                    <label className="text-gray-600">Special Instructions</label>
                    <p className="text-gray-900 bg-yellow-50 p-2 rounded mt-1">{order.special_instructions}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Order Timeline</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Created', time: order?.created_at, icon: FileText },
                    { label: 'Assigned', time: order?.assigned_at, icon: User },
                    { label: 'Pickup Started', time: order?.pickup_started_at, icon: Navigation },
                    { label: 'Picked Up', time: order?.picked_up_at, icon: CheckCircle2 },
                    { label: 'Delivery Started', time: order?.delivery_started_at, icon: Truck },
                    { label: 'Delivered', time: order?.delivered_at, icon: Flag },
                  ].map((event) => {
                    const Icon = event.icon;
                    return (
                      <div key={event.label} className={`flex items-center gap-3 ${event.time ? '' : 'opacity-40'}`}>
                        <Icon className={`w-4 h-4 ${event.time ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{event.label}</p>
                          <p className="text-xs text-gray-600">{formatDate(event.time)}</p>
                        </div>
                        {event.time && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Distance & Payment */}
              {(order?.estimated_distance_km || order?.estimated_payment) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <label className="text-sm text-teal-900">Estimated Distance</label>
                    <p className="text-2xl font-bold text-teal-900 mt-1">
                      {order.estimated_distance_km?.toFixed(1)} km
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <label className="text-sm text-green-900">Estimated Payment</label>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      Rs. {order.estimated_payment?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
