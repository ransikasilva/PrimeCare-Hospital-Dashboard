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
  Users,
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
  RefreshCw,
  Scan,
  Route,
  Eye,
} from 'lucide-react';
import { OrderTrackingMap } from '../OrderTrackingMap';

interface OrderDetailProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface OrderDetails {
  order: any;
  qr_scans: Array<{
    qr_id: string;
    scan_type: string;
    scanned_by: string;
    scanner_type: string;
    scan_location?: string;
    scan_coordinates_lat?: number;
    scan_coordinates_lng?: number;
    scanned_at: string;
    scanned_by_email?: string;
  }>;
  location_tracking: Array<{
    location_lat: number;
    location_lng: number;
    speed_kmh?: number;
    accuracy_meters?: number;
    recorded_at: string;
  }>;
}

export function EnhancedOrderDetailModal({ orderId, isOpen, onClose }: OrderDetailProps) {
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chain' | 'qr' | 'location'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId || !isOpen) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch detailed order information with tracking data
      const orderResponse = await apiClient.getOrderDetailsWithTracking(orderId);
      console.log('Order response:', orderResponse);
      console.log('Full order response data:', JSON.stringify(orderResponse.data, null, 2));

      const order = orderResponse.data?.order;
      const locationTracking = orderResponse.data?.location_tracking || [];
      const qrScansData = orderResponse.data?.qr_scans || [];
      const handoverData = orderResponse.data?.handover;

      console.log('Location tracking data:', locationTracking);
      console.log('Location tracking length:', locationTracking.length);
      console.log('Handover data:', handoverData);
      console.log('Handover exists?', !!handoverData);

      if (!order) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      // Use QR scans data directly from the response
      // The order details API already includes complete chain of custody information
      setOrderDetails({
        order,
        qr_scans: qrScansData,
        location_tracking: locationTracking,
        handover: handoverData
      } as any);

    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLocation = async () => {
    setRefreshing(true);
    try {
      await fetchOrderDetails();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_rider_assignment': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-teal-100 text-teal-800',
      'pickup_started': 'bg-teal-100 text-teal-800',
      'picked_up': 'bg-purple-100 text-purple-800',
      'in_transit': 'bg-purple-100 text-purple-800',
      'delivery_started': 'bg-cyan-100 text-cyan-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Colombo'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Colombo'
    });
  };

  const isActiveOrder = orderDetails?.order?.status && [
    'assigned',
    'pickup_started',
    'picked_up',
    'in_transit',
    'delivery_started'
  ].includes(orderDetails.order.status);

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

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col"
        style={{
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Package className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-600 font-mono">{orderDetails?.order?.order_number || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActiveOrder && (
              <button
                onClick={handleRefreshLocation}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh location"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-6">
            {[
              { key: 'overview', label: 'Overview', icon: FileText },
              { key: 'chain', label: 'Chain of Custody', icon: Activity },
              { key: 'qr', label: 'QR Scans', icon: QrCode },
              ...(isActiveOrder ? [{ key: 'location', label: 'Live Tracking', icon: Navigation }] : [])
            ].map((tab: any) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && orderDetails && (
                <div className="space-y-6">
                  {/* Status & Urgency */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(orderDetails.order?.status)}`}>
                            {orderDetails.order?.status?.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          {(() => {
                            const now = new Date();
                            const createdAt = orderDetails.order?.created_at ? new Date(orderDetails.order.created_at) : null;
                            const assignedAt = orderDetails.order?.assigned_at ? new Date(orderDetails.order.assigned_at) : null;
                            const pickedUpAt = orderDetails.order?.picked_up_at ? new Date(orderDetails.order.picked_up_at) : null;

                            let timeInfo = null;

                            if (orderDetails.order?.status === 'assigned' && assignedAt) {
                              const minutesElapsed = Math.floor((now.getTime() - assignedAt.getTime()) / (1000 * 60));
                              const isOverdue = minutesElapsed > 15;
                              timeInfo = (
                                <span className={`text-xs px-2 py-1 rounded ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                                  {minutesElapsed} min {isOverdue ? 'overdue' : 'elapsed'}
                                </span>
                              );
                            } else if (orderDetails.order?.status === 'picked_up' && pickedUpAt) {
                              const minutesElapsed = Math.floor((now.getTime() - pickedUpAt.getTime()) / (1000 * 60));
                              const threshold = orderDetails.order?.urgency === 'urgent' ? 45 : 90;
                              const isOverdue = minutesElapsed > threshold;
                              timeInfo = (
                                <span className={`text-xs px-2 py-1 rounded ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                                  {minutesElapsed} min {isOverdue ? 'overdue' : 'in transit'}
                                </span>
                              );
                            } else if (orderDetails.order?.status === 'pending_rider_assignment' && createdAt) {
                              const minutesElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
                              timeInfo = (
                                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                  Waiting {minutesElapsed} min
                                </span>
                              );
                            }

                            return timeInfo;
                          })()}
                        </div>

                        {/* SLA Delay Type Indicator */}
                        {(() => {
                          const now = new Date();
                          const createdAt = orderDetails.order?.created_at ? new Date(orderDetails.order.created_at) : null;
                          const assignedAt = orderDetails.order?.assigned_at ? new Date(orderDetails.order.assigned_at) : null;
                          const pickedUpAt = orderDetails.order?.picked_up_at ? new Date(orderDetails.order.picked_up_at) : null;

                          const delays = [];

                          // Check pickup response delay (assigned → picked up)
                          if (orderDetails.order?.status === 'assigned' && assignedAt) {
                            const minutesElapsed = Math.floor((now.getTime() - assignedAt.getTime()) / (1000 * 60));
                            if (minutesElapsed > 15) {
                              delays.push({
                                type: 'Pickup Response Delay',
                                message: `Rider should have picked up ${minutesElapsed - 15} min ago (15 min SLA)`,
                                severity: 'critical'
                              });
                            }
                          }

                          // Check urgent total delay (created → delivered)
                          if (orderDetails.order?.urgency === 'urgent' && createdAt && orderDetails.order?.status !== 'delivered') {
                            const minutesElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
                            if (minutesElapsed > 45) {
                              delays.push({
                                type: 'Urgent Delivery Delay',
                                message: `Order should have been delivered ${minutesElapsed - 45} min ago (45 min total SLA)`,
                                severity: 'critical'
                              });
                            }
                          }

                          // Check standard delivery delay (picked up → delivered for routine)
                          if (orderDetails.order?.urgency === 'routine' && pickedUpAt && orderDetails.order?.status !== 'delivered') {
                            const minutesElapsed = Math.floor((now.getTime() - pickedUpAt.getTime()) / (1000 * 60));
                            if (minutesElapsed > 90) {
                              delays.push({
                                type: 'Standard Delivery Delay',
                                message: `Delivery should have completed ${minutesElapsed - 90} min ago (90 min SLA)`,
                                severity: 'critical'
                              });
                            }
                          }

                          if (delays.length > 0) {
                            return (
                              <div className="mt-3 space-y-2">
                                {delays.map((delay, index) => (
                                  <div key={index} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-red-800">{delay.type}</p>
                                      <p className="text-xs text-red-700">{delay.message}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                      {orderDetails.order?.urgency === 'urgent' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-lg h-fit flex-shrink-0">
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
                        <p className="font-medium text-gray-900">{orderDetails.order?.center_name}</p>
                        <p className="text-gray-600">{orderDetails.order?.center_address}</p>
                        {orderDetails.order?.center_phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {orderDetails.order.center_phone}
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
                        <p className="font-medium text-gray-900">{orderDetails.order?.hospital_name}</p>
                        <p className="text-gray-600">{orderDetails.order?.hospital_address}</p>
                        {orderDetails.order?.hospital_contact_phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {orderDetails.order.hospital_contact_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Handover Information - Show if handover occurred */}
                  {(orderDetails as any)?.handover && (
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Route className="w-5 h-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-900">Handover Occurred</h3>
                        <span className={`ml-auto text-xs px-2 py-1 rounded ${
                          (orderDetails as any).handover.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(orderDetails as any).handover.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Original Rider (Rider A) */}
                        <div className="bg-white border border-orange-200 rounded-lg p-3">
                          <label className="text-xs font-medium text-orange-700 uppercase">Original Rider (Pickup)</label>
                          <div className="mt-2 space-y-1">
                            <p className="font-semibold text-gray-900">{(orderDetails as any).handover.original_rider.name}</p>
                            <p className="text-sm text-gray-600">{(orderDetails as any).handover.original_rider.phone}</p>
                            <p className="text-xs text-gray-500">{(orderDetails as any).handover.original_rider.vehicle || 'N/A'}</p>
                          </div>
                        </div>

                        {/* New Rider (Rider B) */}
                        <div className="bg-white border border-orange-200 rounded-lg p-3">
                          <label className="text-xs font-medium text-orange-700 uppercase">New Rider (Delivery)</label>
                          <div className="mt-2 space-y-1">
                            <p className="font-semibold text-gray-900">{(orderDetails as any).handover.new_rider.name}</p>
                            <p className="text-sm text-gray-600">{(orderDetails as any).handover.new_rider.phone}</p>
                            <p className="text-xs text-gray-500">{(orderDetails as any).handover.new_rider.vehicle || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Handover Reason */}
                      {(orderDetails as any).handover.reason && (
                        <div className="bg-white border border-orange-200 rounded-lg p-3 mb-3">
                          <label className="text-xs font-medium text-orange-700 uppercase">Handover Reason</label>
                          <p className="text-sm text-gray-900 mt-1">{(orderDetails as any).handover.reason}</p>
                        </div>
                      )}

                      {/* Handover Timeline */}
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-white border border-orange-200 rounded p-2">
                          <label className="text-orange-700 font-medium">Initiated</label>
                          <p className="text-gray-900 mt-1">
                            {new Date((orderDetails as any).handover.initiated_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                          </p>
                        </div>
                        {(orderDetails as any).handover.accepted_at && (
                          <div className="bg-white border border-orange-200 rounded p-2">
                            <label className="text-orange-700 font-medium">Accepted</label>
                            <p className="text-gray-900 mt-1">
                              {new Date((orderDetails as any).handover.accepted_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                            </p>
                          </div>
                        )}
                        {(orderDetails as any).handover.confirmed_at && (
                          <div className="bg-white border border-green-600 rounded p-2">
                            <label className="text-green-700 font-medium">Confirmed</label>
                            <p className="text-gray-900 mt-1">
                              {new Date((orderDetails as any).handover.confirmed_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rider Info */}
                  {orderDetails.order?.rider_name && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      {(orderDetails as any)?.handover ? (
                        <>
                          <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-orange-600" />
                            <h3 className="font-semibold text-gray-900">Rider Information (Handover)</h3>
                          </div>

                          {/* Original Rider */}
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-xs font-semibold text-blue-900 mb-2 uppercase">Original Rider (Pickup)</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <label className="text-gray-600 text-xs">Name</label>
                                <p className="font-medium text-gray-900">{(orderDetails as any).handover.original_rider.name}</p>
                              </div>
                              <div>
                                <label className="text-gray-600 text-xs">Phone</label>
                                <p className="font-medium text-gray-900">{(orderDetails as any).handover.original_rider.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-gray-600 text-xs">Vehicle</label>
                                <p className="font-medium text-gray-900">{(orderDetails as any).handover.original_rider.vehicle || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* New Rider */}
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="text-xs font-semibold text-green-900 mb-2 uppercase">Current Rider (Delivery)</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <label className="text-gray-600 text-xs">Name</label>
                                <p className="font-medium text-gray-900">{(orderDetails as any).handover.new_rider.name}</p>
                              </div>
                              <div>
                                <label className="text-gray-600 text-xs">Phone</label>
                                <p className="font-medium text-gray-900">{(orderDetails as any).handover.new_rider.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-gray-600 text-xs">Vehicle</label>
                                <p className="font-medium text-gray-900">{(orderDetails as any).handover.new_rider.vehicle || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <Truck className="w-5 h-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Assigned Rider</h3>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <label className="text-gray-600">Name</label>
                              <p className="font-medium text-gray-900">{orderDetails.order.rider_name}</p>
                            </div>
                            <div>
                              <label className="text-gray-600">Phone</label>
                              <p className="font-medium text-gray-900">{orderDetails.order.rider_phone || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-gray-600">Vehicle</label>
                              <p className="font-medium text-gray-900">{orderDetails.order.vehicle_number || 'N/A'}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Sample Details */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900">Sample Information</h3>
                    </div>
                    {orderDetails.order?.samples && orderDetails.order.samples.length > 0 ? (
                      <div className="space-y-3">
                        {orderDetails.order.samples.map((sample: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                              <div>
                                <p className="font-medium text-gray-900 capitalize">{sample.sample_type}</p>
                                <p className="text-sm text-gray-600">Quantity: {sample.quantity}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-gray-600">Type</label>
                          <p className="font-medium text-gray-900">{orderDetails.order?.sample_type || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Quantity</label>
                          <p className="font-medium text-gray-900">{orderDetails.order?.sample_quantity || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {orderDetails.order?.special_instructions && (
                      <div className="mt-3">
                        <label className="text-gray-600">Special Instructions</label>
                        <p className="text-gray-900 bg-yellow-50 p-2 rounded mt-1">{orderDetails.order.special_instructions}</p>
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
                      {(() => {
                        const events = [
                          { label: 'Created', time: orderDetails.order?.created_at, icon: FileText },
                          { label: 'Assigned', time: orderDetails.order?.assigned_at, icon: User },
                          { label: 'Pickup Started', time: orderDetails.order?.pickup_started_at || (orderDetails.order?.picked_up_at ? orderDetails.order.picked_up_at : null), icon: Navigation },
                          { label: 'Picked Up', time: orderDetails.order?.picked_up_at, icon: CheckCircle2 },
                        ];

                        // Add handover events if handover occurred
                        if ((orderDetails as any)?.handover) {
                          events.push({ label: 'Handover Initiated', time: (orderDetails as any).handover.initiated_at, icon: Route });
                          if ((orderDetails as any).handover.accepted_at) {
                            events.push({ label: 'Handover Accepted', time: (orderDetails as any).handover.accepted_at, icon: User });
                          }
                          if ((orderDetails as any).handover.confirmed_at) {
                            events.push({ label: 'Handover Confirmed', time: (orderDetails as any).handover.confirmed_at, icon: CheckCircle2 });
                          }
                        }

                        events.push(
                          { label: 'Delivery Started', time: orderDetails.order?.delivery_started_at || (orderDetails.order?.delivered_at ? orderDetails.order.delivered_at : null), icon: Truck },
                          { label: 'Delivered', time: orderDetails.order?.delivered_at, icon: Flag }
                        );

                        return events.map((event) => {
                          const Icon = event.icon;
                          return (
                            <div key={event.label} className={`flex items-center gap-3 ${event.time ? '' : 'opacity-40'}`}>
                              <Icon className={`w-4 h-4 ${event.time ? (event.label.includes('Handover') ? 'text-orange-600' : 'text-green-600') : 'text-gray-400'}`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{event.label}</p>
                                <p className="text-xs text-gray-600">{formatDate(event.time)}</p>
                              </div>
                              {event.time && <CheckCircle2 className={`w-5 h-5 ${event.label.includes('Handover') ? 'text-orange-600' : 'text-green-600'}`} />}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Distance Information */}
                  {orderDetails.order?.handover_at ? (
                    // Handover scenario - show 5 distance cards
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Route className="w-4 h-4" />
                        <span className="font-medium">Handover Delivery Distances</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        <div className="bg-teal-50 p-3 rounded-lg">
                          <label className="text-xs text-teal-900 font-medium">Pickup</label>
                          <p className="text-lg font-bold text-teal-900 mt-1">
                            {orderDetails.order?.pickup_distance_km
                              ? `${orderDetails.order.pickup_distance_km.toFixed(1)} km`
                              : '—'}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <label className="text-xs text-orange-900 font-medium">Rider A → Handover</label>
                          <p className="text-lg font-bold text-orange-900 mt-1">
                            {orderDetails.order?.rider_a_to_handover_km
                              ? `${orderDetails.order.rider_a_to_handover_km.toFixed(1)} km`
                              : '—'}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <label className="text-xs text-purple-900 font-medium">Rider B → Hospital</label>
                          <p className="text-lg font-bold text-purple-900 mt-1">
                            {orderDetails.order?.rider_b_from_handover_km
                              ? `${orderDetails.order.rider_b_from_handover_km.toFixed(1)} km`
                              : '—'}
                          </p>
                        </div>
                        <div className="bg-teal-50 p-3 rounded-lg">
                          <label className="text-xs text-teal-900 font-medium">Delivery Total</label>
                          <p className="text-lg font-bold text-teal-900 mt-1">
                            {orderDetails.order?.delivery_distance_km
                              ? `${orderDetails.order.delivery_distance_km.toFixed(1)} km`
                              : '—'}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <label className="text-xs text-green-900 font-medium">Grand Total</label>
                          <p className="text-lg font-bold text-green-900 mt-1">
                            {orderDetails.order?.actual_distance_km
                              ? `${orderDetails.order.actual_distance_km.toFixed(1)} km`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Normal delivery - show distance info based on order status
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-teal-50 p-4 rounded-lg">
                        <label className="text-sm text-teal-900">Estimated Distance</label>
                        <p className="text-2xl font-bold text-teal-900 mt-1">
                          {orderDetails.order?.estimated_distance_km
                            ? `${orderDetails.order.estimated_distance_km.toFixed(1)} km`
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <label className="text-sm text-green-900">
                          {orderDetails.order?.status === 'delivered' ? 'Actual Distance' : 'Tracking Distance'}
                        </label>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                          {orderDetails.order?.actual_distance_km && orderDetails.order.actual_distance_km > 0
                            ? `${orderDetails.order.actual_distance_km.toFixed(1)} km`
                            : orderDetails.order?.status === 'delivered'
                              ? 'Not recorded'
                              : 'In Progress'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chain of Custody Tab */}
              {activeTab === 'chain' && orderDetails && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Chain of Custody Timeline
                  </h3>
                  <p className="text-sm text-gray-600">Complete tracking of who handled the sample and when</p>

                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    <div className="space-y-6">
                      {/* 1. Sample Created at Collection Center */}
                      <div className="relative pl-14">
                        <div className="absolute left-4 top-2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow"></div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">Sample Created</h4>
                              <p className="text-sm text-gray-600">Collection Center</p>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(orderDetails.order?.created_at)}</span>
                          </div>
                          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">Given by: {orderDetails.order?.center_name || 'Collection Center'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{orderDetails.order?.center_name || 'Collection Center'}</span>
                            </div>
                            {orderDetails.order?.sample_type && (
                              <p className="text-sm text-gray-600 mt-2">Sample Type: <span className="font-medium">{orderDetails.order.sample_type}</span></p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Assigned to Rider */}
                      {((orderDetails as any)?.handover || orderDetails.order?.rider_name) && (
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-2 w-4 h-4 bg-teal-600 rounded-full border-2 border-white shadow"></div>
                          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">Assigned to Rider</h4>
                                <p className="text-sm text-gray-600">Rider Pickup</p>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(orderDetails.order?.created_at)}</span>
                            </div>
                            <div className="bg-teal-50 border-l-4 border-teal-500 p-3 mt-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-600">From: {orderDetails.order?.center_name || 'Collection Center'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-teal-600" />
                                    <User className="w-4 h-4 text-teal-600" />
                                    <span className="font-medium text-gray-900">
                                      To: {(orderDetails as any)?.handover ? (orderDetails as any).handover.original_rider.name : orderDetails.order.rider_name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                <MapPin className="w-4 h-4" />
                                <span>{orderDetails.order?.center_name || 'Collection Center'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Picked Up from Collection Center */}
                      {orderDetails.order?.picked_up_at && (
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow"></div>
                          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">Picked Up from Collection Center</h4>
                                <p className="text-sm text-gray-600">Package Collected</p>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(orderDetails.order.picked_up_at)}</span>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-600">From: {orderDetails.order?.center_name || 'Collection Center'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-blue-600" />
                                    <User className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-gray-900">
                                      By: {(orderDetails as any)?.handover ? (orderDetails as any).handover.original_rider.name : orderDetails.order?.rider_name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">Package collected and ready for delivery</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. Pickup QR Scan (optional verification) */}
                      {orderDetails.qr_scans
                        .filter(scan => scan.scan_type === 'pickup')
                        .map((scan, index) => (
                        <div key={`pickup-${index}`} className="relative pl-14">
                          <div className="absolute left-4 top-2 w-4 h-4 bg-purple-600 rounded-full border-2 border-white shadow"></div>
                          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900 capitalize">{scan.scan_type?.replace(/_/g, ' ') || 'QR Scan'}</h4>
                                <p className="text-sm text-gray-600">Verification Checkpoint</p>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(scan.scanned_at)}</span>
                            </div>
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Scan className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-gray-900">
                                  Scanned by: {
                                    scan.scanner_type === 'rider'
                                      ? ((orderDetails as any)?.handover ? (orderDetails as any).handover.original_rider.name : orderDetails.order?.rider_name)
                                      : scan.scanned_by || 'System'
                                  }
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 capitalize">Type: {scan.scanner_type || 'N/A'}</p>
                              {scan.scan_location && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{scan.scan_location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 5. Handover Event (if occurred) */}
                      {(orderDetails as any)?.handover && (orderDetails as any).handover.status === 'confirmed' && (
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-2 w-4 h-4 bg-orange-600 rounded-full border-2 border-white shadow"></div>
                          <div className="bg-white border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">Package Handover</h4>
                                <p className="text-sm text-gray-600">Rider Transfer</p>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate((orderDetails as any).handover.confirmed_at)}</span>
                            </div>
                            <div className="bg-orange-50 border-l-4 border-orange-500 p-3 mt-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-600">From: {(orderDetails as any).handover.original_rider.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-orange-600" />
                                    <User className="w-4 h-4 text-orange-600" />
                                    <span className="font-medium text-gray-900">To: {(orderDetails as any).handover.new_rider.name}</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">Reason: {(orderDetails as any).handover.reason || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6. Delivery QR Scan */}
                      {orderDetails.qr_scans
                        .filter(scan => scan.scan_type === 'delivery')
                        .map((scan, index) => (
                        <div key={`delivery-${index}`} className="relative pl-14">
                          <div className="absolute left-4 top-2 w-4 h-4 bg-purple-600 rounded-full border-2 border-white shadow"></div>
                          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900 capitalize">{scan.scan_type?.replace(/_/g, ' ') || 'QR Scan'}</h4>
                                <p className="text-sm text-gray-600">Verification Checkpoint</p>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(scan.scanned_at)}</span>
                            </div>
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Scan className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-gray-900">
                                  Scanned by: {
                                    scan.scanner_type === 'rider'
                                      ? ((orderDetails as any)?.handover ? (orderDetails as any).handover.new_rider.name : orderDetails.order?.rider_name)
                                      : scan.scanned_by || 'System'
                                  }
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 capitalize">Type: {scan.scanner_type || 'N/A'}</p>
                              {scan.scan_location && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{scan.scan_location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 7. Delivered to Hospital */}
                      {orderDetails.order?.status === 'delivered' && (
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-2 w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow"></div>
                          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">Delivered to Hospital</h4>
                                <p className="text-sm text-gray-600">Final Destination</p>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(orderDetails.order?.delivered_at || orderDetails.order?.updated_at)}</span>
                            </div>
                            <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-600">From: {orderDetails.order?.rider_name || 'Rider'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-green-600" />
                                    <User className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-gray-900">To: Hospital Lab Staff</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                <MapPin className="w-4 h-4" />
                                <span>{orderDetails.order?.hospital_name || 'Hospital Lab'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-3 text-green-700 bg-green-100 rounded px-2 py-1 text-xs w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="font-medium">Chain of Custody Complete</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show if still in transit - only after rider has picked up */}
                      {orderDetails.order?.status !== 'delivered' &&
                       orderDetails.order?.rider_name &&
                       ['picked_up', 'in_transit', 'delivery_started'].includes(orderDetails.order?.status || '') && (
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-2 w-4 h-4 bg-yellow-600 rounded-full border-2 border-white shadow animate-pulse"></div>
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">In Transit</h4>
                                <p className="text-sm text-gray-600">Sample being transported</p>
                              </div>
                              <span className="text-xs text-gray-500">Current Status</span>
                            </div>
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Truck className="w-4 h-4 text-yellow-600" />
                                <span className="font-medium text-gray-900">With: {orderDetails.order.rider_name}</span>
                              </div>
                              <p className="text-sm text-gray-600">En route to {orderDetails.order?.hospital_name || 'Hospital'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* QR Scans Tab */}
              {activeTab === 'qr' && orderDetails && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    QR Code Scan History
                  </h3>

                  {orderDetails.qr_scans.length === 0 ? (
                    <div className="text-center py-12">
                      <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No QR scans recorded yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orderDetails.qr_scans.map((scan, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-teal-100 rounded-lg">
                              <Scan className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Scan #{index + 1}</h4>
                              <p className="text-xs text-gray-500">{formatTime(scan.scanned_at)}</p>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">QR ID:</span>
                              <span className="font-mono text-gray-900">{scan.qr_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium text-gray-900 capitalize">{scan.scan_type?.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Scanner:</span>
                              <span className="font-medium text-gray-900 capitalize">{scan.scanner_type}</span>
                            </div>
                            {scan.scan_location && (
                              <div className="pt-2 border-t border-gray-100">
                                <span className="text-gray-600">Location:</span>
                                <p className="text-gray-900 mt-1">{scan.scan_location}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Location Tracking Tab */}
              {activeTab === 'location' && isActiveOrder && orderDetails && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Navigation className="w-5 h-5" />
                      Live Location Tracking
                    </h3>
                    <button
                      onClick={handleRefreshLocation}
                      disabled={refreshing}
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  <div>
                    {(() => {
                      // Transform data to match the working map component format
                      const hasValidCoords = orderDetails.order?.center_coordinates?.lat &&
                                            orderDetails.order?.center_coordinates?.lng &&
                                            orderDetails.order?.hospital_coordinates?.lat &&
                                            orderDetails.order?.hospital_coordinates?.lng;

                      if (!hasValidCoords) {
                        return (
                          <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300 text-center">
                            <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Map Not Available</h3>
                            <p className="text-gray-600">Location coordinates are missing for this order.</p>
                          </div>
                        );
                      }

                      // Build location tracking array
                      const locationTracking = [];

                      // Add rider's current location first if available
                      if (orderDetails.order?.rider_current_location?.lat && orderDetails.order?.rider_current_location?.lng) {
                        locationTracking.push({
                          id: 'current-location',
                          rider_id: orderDetails.order.rider_id || 'unknown',
                          location: {
                            lat: orderDetails.order.rider_current_location.lat,
                            lng: orderDetails.order.rider_current_location.lng
                          },
                          speed_kmh: undefined,
                          accuracy_meters: undefined,
                          recorded_at: orderDetails.order.rider_current_location.updated_at || new Date().toISOString()
                        });
                      }

                      // Add historical tracking points
                      if (orderDetails.location_tracking && orderDetails.location_tracking.length > 0) {
                        orderDetails.location_tracking.forEach((location: any, index: number) => {
                          locationTracking.push({
                            id: `location-${index}`,
                            rider_id: orderDetails.order?.rider_id || 'unknown',
                            location: {
                              lat: location.location_lat || location.lat,
                              lng: location.location_lng || location.lng
                            },
                            speed_kmh: location.speed_kmh,
                            accuracy_meters: location.accuracy_meters,
                            recorded_at: location.recorded_at
                          });
                        });
                      }

                      const mapData = {
                        order: {
                          id: orderDetails.order?.id || '',
                          order_number: orderDetails.order?.order_number || '',
                          center_name: orderDetails.order?.center_name || '',
                          center_address: orderDetails.order?.center_address || '',
                          hospital_name: orderDetails.order?.hospital_name || '',
                          hospital_address: orderDetails.order?.hospital_address || '',
                          rider_name: orderDetails.order?.rider_name,
                          rider_phone: orderDetails.order?.rider_phone,
                          pickup_location: {
                            lat: orderDetails.order.center_coordinates.lat!,
                            lng: orderDetails.order.center_coordinates.lng!
                          },
                          delivery_location: {
                            lat: orderDetails.order.hospital_coordinates.lat!,
                            lng: orderDetails.order.hospital_coordinates.lng!
                          },
                          status: orderDetails.order?.status || ''
                        },
                        location_tracking: locationTracking
                      };

                      const OrderTrackingMapNew = require('@/components/OrderTrackingMapNew').default;
                      return <OrderTrackingMapNew orderDetails={mapData} onRefresh={handleRefreshLocation} />;
                    })()}
                    {orderDetails.location_tracking && orderDetails.location_tracking.length > 0 ? (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 bg-teal-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4" />
                          <span>{orderDetails.location_tracking.length} tracking points recorded</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Last update: {new Date(orderDetails.location_tracking[orderDetails.location_tracking.length - 1].recorded_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' })}
                        </span>
                      </div>
                    ) : orderDetails.order?.rider_current_location?.lat && orderDetails.order?.rider_current_location?.lng ? (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 bg-teal-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-teal-600" />
                          <span>Showing rider's current location</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Updated: {new Date(orderDetails.order.rider_current_location.updated_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' })}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        No rider location available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
