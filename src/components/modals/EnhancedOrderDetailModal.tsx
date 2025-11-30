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
      const order = orderResponse.data?.order;
      const locationTracking = orderResponse.data?.location_tracking || [];
      const qrScansData = orderResponse.data?.qr_scans || [];

      console.log('Location tracking data:', locationTracking);
      console.log('Location tracking length:', locationTracking.length);

      if (!order) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      // Process QR scans data from the response
      let qrScans: any[] = qrScansData;

      // If we need chain of custody details, fetch them separately
      if (qrScansData.length === 0) {
        try {
          const qrResponse = await apiClient.getOrderQRCodes(orderId);
          if (qrResponse.success && qrResponse.data) {
            const qrCodes = (qrResponse.data as any)?.qr_codes || [];

            // Fetch chain of custody for each QR code
            for (const qr of qrCodes) {
              try {
                const chainResponse = await apiClient.getChainOfCustody(qr.qr_id);
                if (chainResponse.success && chainResponse.data) {
                  const chainData = (chainResponse.data as any)?.chain_of_custody || [];
                  qrScans = [...qrScans, ...chainData];
                }
              } catch (err) {
                console.error('Error fetching chain for QR:', qr.qr_id, err);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching QR codes:', err);
        }
      }

      setOrderDetails({
        order,
        qr_scans: qrScans,
        location_tracking: locationTracking
      });

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
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <p className={`mt-1 px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(orderDetails.order?.status)}`}>
                          {orderDetails.order?.status?.replace(/_/g, ' ').toUpperCase()}
                        </p>
                      </div>
                      {orderDetails.order?.urgency === 'urgent' && (
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

                  {/* Rider Info */}
                  {orderDetails.order?.rider_name && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
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
                      {[
                        { label: 'Created', time: orderDetails.order?.created_at, icon: FileText },
                        { label: 'Assigned', time: orderDetails.order?.assigned_at, icon: User },
                        { label: 'Pickup Started', time: orderDetails.order?.pickup_started_at, icon: Navigation },
                        { label: 'Picked Up', time: orderDetails.order?.picked_up_at, icon: CheckCircle2 },
                        { label: 'Delivery Started', time: orderDetails.order?.delivery_started_at, icon: Truck },
                        { label: 'Delivered', time: orderDetails.order?.delivered_at, icon: Flag },
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
                    // Normal delivery - show 3 distance cards
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-teal-50 p-4 rounded-lg">
                        <label className="text-sm text-teal-900">Pickup Distance</label>
                        <p className="text-2xl font-bold text-teal-900 mt-1">
                          {orderDetails.order?.pickup_distance_km
                            ? `${orderDetails.order.pickup_distance_km.toFixed(1)} km`
                            : 'Calculating...'}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <label className="text-sm text-purple-900">Delivery Distance</label>
                        <p className="text-2xl font-bold text-purple-900 mt-1">
                          {orderDetails.order?.delivery_distance_km
                            ? `${orderDetails.order.delivery_distance_km.toFixed(1)} km`
                            : 'Calculating...'}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <label className="text-sm text-green-900">Total Distance</label>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                          {orderDetails.order?.actual_distance_km
                            ? `${orderDetails.order.actual_distance_km.toFixed(1)} km`
                            : orderDetails.order?.estimated_distance_km
                              ? `${orderDetails.order.estimated_distance_km.toFixed(1)} km (est.)`
                              : 'N/A'}
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

                  {orderDetails.qr_scans.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No chain of custody events recorded yet</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                      <div className="space-y-6">
                        {orderDetails.qr_scans.map((scan, index) => (
                          <div key={index} className="relative pl-14">
                            {/* Timeline dot */}
                            <div className="absolute left-4 top-2 w-4 h-4 bg-teal-600 rounded-full border-2 border-white shadow"></div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900 capitalize">{scan.scan_type?.replace(/_/g, ' ')}</h4>
                                  <p className="text-sm text-gray-600">QR ID: {scan.qr_id}</p>
                                </div>
                                <span className="text-xs text-gray-500">{formatDate(scan.scanned_at)}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                                <div>
                                  <label className="text-gray-600">Scanned by</label>
                                  <p className="font-medium text-gray-900">{scan.scanned_by || 'System'}</p>
                                  {scan.scanned_by_email && (
                                    <p className="text-xs text-gray-500">{scan.scanned_by_email}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-gray-600">Scanner Type</label>
                                  <p className="font-medium text-gray-900 capitalize">{scan.scanner_type || 'N/A'}</p>
                                </div>
                                {scan.scan_location && (
                                  <div className="col-span-2">
                                    <label className="text-gray-600">Location</label>
                                    <p className="font-medium text-gray-900">{scan.scan_location}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    <OrderTrackingMap
                      locationPoints={orderDetails.location_tracking || []}
                      pickupLocation={
                        orderDetails.order?.center_coordinates?.lat && orderDetails.order?.center_coordinates?.lng
                          ? {
                              lat: orderDetails.order.center_coordinates.lat,
                              lng: orderDetails.order.center_coordinates.lng,
                              name: orderDetails.order.center_name || 'Pickup'
                            }
                          : undefined
                      }
                      deliveryLocation={
                        orderDetails.order?.hospital_coordinates?.lat && orderDetails.order?.hospital_coordinates?.lng
                          ? {
                              lat: orderDetails.order.hospital_coordinates.lat,
                              lng: orderDetails.order.hospital_coordinates.lng,
                              name: orderDetails.order.hospital_name || 'Hospital'
                            }
                          : undefined
                      }
                      handoverLocation={
                        orderDetails.order?.handover_point_lat && orderDetails.order?.handover_point_lng
                          ? {
                              lat: orderDetails.order.handover_point_lat,
                              lng: orderDetails.order.handover_point_lng
                            }
                          : undefined
                      }
                      riderLocation={
                        orderDetails.order?.rider_current_location?.lat && orderDetails.order?.rider_current_location?.lng
                          ? {
                              lat: orderDetails.order.rider_current_location.lat,
                              lng: orderDetails.order.rider_current_location.lng
                            }
                          : undefined
                      }
                    />
                    {orderDetails.location_tracking && orderDetails.location_tracking.length > 0 ? (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 bg-teal-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4" />
                          <span>{orderDetails.location_tracking.length} tracking points recorded</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Last update: {new Date(orderDetails.location_tracking[orderDetails.location_tracking.length - 1].recorded_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : orderDetails.order?.rider_current_location?.lat && orderDetails.order?.rider_current_location?.lng ? (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 bg-teal-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-teal-600" />
                          <span>Showing rider's current location</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Updated: {new Date(orderDetails.order.rider_current_location.updated_at).toLocaleTimeString()}
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
