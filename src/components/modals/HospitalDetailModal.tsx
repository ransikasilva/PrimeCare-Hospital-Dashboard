"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  Package,
  Truck,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  Navigation,
  Activity,
  DollarSign,
} from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';

interface HospitalDetailModalProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface HospitalDetails {
  hospital: any;
  orders: any[];
  riders: any[];
  collectionCenters: any[];
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    avgDeliveryTime: number;
    totalRiders: number;
    activeRiders: number;
  };
}

export function HospitalDetailModal({ hospitalId, isOpen, onClose }: HospitalDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<HospitalDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'riders' | 'centers'>('overview');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && hospitalId) {
      fetchHospitalDetails();
    }
  }, [isOpen, hospitalId]);

  const fetchHospitalDetails = async () => {
    try {
      setLoading(true);

      // Fetch hospital info
      const hospitalResponse = await apiClient.getHospitalById(hospitalId);

      // Fetch orders for this hospital
      const ordersResponse = await apiClient.getHospitalOrders();
      const hospitalOrders = (ordersResponse.data as any)?.orders?.filter((o: any) => o.hospital_id === hospitalId) || [];

      // Fetch riders for this specific hospital
      const ridersResponse = await apiClient.getHospitalRidersByHospitalId(hospitalId);
      const hospitalRiders = (ridersResponse as any)?.data?.riders || ridersResponse || [];

      // Fetch collection centers for this hospital
      const centersResponse = await apiClient.getCollectionCentersByHospitalId(hospitalId);
      const hospitalCenters = (centersResponse as any)?.data?.collection_centers || [];

      // Calculate stats
      const stats = {
        totalOrders: hospitalOrders.length,
        activeOrders: hospitalOrders.filter((o: any) =>
          o.status === 'in_transit' || o.status === 'assigned' || o.status === 'pending_rider_assignment'
        ).length,
        completedOrders: hospitalOrders.filter((o: any) => o.status === 'delivered').length,
        avgDeliveryTime: calculateAvgDeliveryTime(hospitalOrders),
        totalRiders: hospitalRiders.length,
        activeRiders: hospitalRiders.filter((r: any) => r.availability_status === 'available').length,
      };

      setDetails({
        hospital: hospitalResponse.data?.hospital,
        orders: hospitalOrders,
        riders: hospitalRiders,
        collectionCenters: hospitalCenters,
        stats
      });
    } catch (error) {
      console.error('Error fetching hospital details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgDeliveryTime = (orders: any[]) => {
    const deliveredOrders = orders.filter((o: any) => o.delivered_at && o.created_at);
    if (deliveredOrders.length === 0) return 0;

    const totalTime = deliveredOrders.reduce((sum: number, order: any) => {
      const created = new Date(order.created_at).getTime();
      const delivered = new Date(order.delivered_at).getTime();
      return sum + (delivered - created);
    }, 0);

    return Math.round(totalTime / deliveredOrders.length / (1000 * 60)); // Convert to minutes
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      'pending_rider_assignment': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Assignment' },
      'assigned': { color: 'bg-blue-100 text-blue-800', text: 'Assigned' },
      'in_transit': { color: 'bg-purple-100 text-purple-800', text: 'In Transit' },
      'delivered': { color: 'bg-green-100 text-green-800', text: 'Delivered' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
    };
    return badges[status] || { color: 'bg-gray-100 text-gray-800', text: status };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderModal(true);
  };

  // Filter orders
  const filteredOrders = details?.orders.filter((order: any) => {
    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
      return false;
    }
    if (orderSearchQuery) {
      const searchLower = orderSearchQuery.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(searchLower) ||
        order.center_name?.toLowerCase().includes(searchLower) ||
        order.rider_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] overflow-hidden flex flex-col" style={{
          border: '1px solid rgba(203, 213, 225, 0.3)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{details?.hospital?.name || 'Loading...'}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {details?.hospital?.city}
                  </div>
                  <span className="font-mono">{details?.hospital?.hospital_code}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'orders', label: 'Orders', icon: Package, count: details?.stats.totalOrders },
                { id: 'riders', label: 'Riders', icon: Truck, count: details?.stats.totalRiders },
                { id: 'centers', label: 'Collection Centers', icon: Building2 },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Total Orders</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{details?.stats.totalOrders}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Completed</span>
                        </div>
                        <p className="text-3xl font-bold text-green-900">{details?.stats.completedOrders}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Active Riders</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-900">{details?.stats.activeRiders}/{details?.stats.totalRiders}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-orange-900">Avg Delivery</span>
                        </div>
                        <p className="text-3xl font-bold text-orange-900">{details?.stats.avgDeliveryTime}m</p>
                      </div>
                    </div>

                    {/* Hospital Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Hospital Information
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Full Address</label>
                          <p className="mt-1 text-gray-900">{details?.hospital?.address}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Contact Phone</label>
                          <p className="mt-1 text-gray-900 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {details?.hospital?.contact_phone}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="mt-1 text-gray-900 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {details?.hospital?.email || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Network</label>
                          <p className="mt-1 text-gray-900">{details?.hospital?.network_name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Orders
                      </h3>
                      <div className="space-y-3">
                        {details?.orders.slice(0, 5).map((order: any) => {
                          const statusBadge = getStatusBadge(order.status);
                          return (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{order.order_number}</p>
                                  <p className="text-sm text-gray-600">{order.center_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                  {statusBadge.text}
                                </span>
                                <button
                                  onClick={() => handleViewOrder(order.id)}
                                  className="p-2 hover:bg-gray-200 rounded-lg"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    {/* Order Filters */}
                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="all">All Status</option>
                        <option value="pending_rider_assignment">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection Center</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredOrders.map((order: any) => {
                            const statusBadge = getStatusBadge(order.status);
                            return (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">{order.order_number}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{order.center_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{order.rider_name || 'Unassigned'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                    {statusBadge.text}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {order.urgency === 'urgent' ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Urgent</span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Normal</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => handleViewOrder(order.id)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                          <Package className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">No orders found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Riders Tab */}
                {activeTab === 'riders' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Deliveries</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {details?.riders.map((rider: any) => (
                            <tr key={rider.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{rider.rider_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{rider.phone}</td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-600">{rider.vehicle_number || 'N/A'}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {rider.availability_status === 'available' ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Available</span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Busy</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rider.total_deliveries || 0}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rider.rating || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {details?.riders.length === 0 && (
                        <div className="text-center py-12">
                          <Truck className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">No riders assigned yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Collection Centers Tab */}
                {activeTab === 'centers' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Affiliated Collection Centers</h3>

                    {details?.collectionCenters.length === 0 ? (
                      <div className="text-center py-12">
                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">No collection centers affiliated with this hospital</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Orders</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {details?.collectionCenters.map((center: any) => (
                              <tr key={center.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{center.center_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{center.center_type}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{center.city}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{center.phone}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {center.status === 'approved' || center.status === 'active' ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{center.status}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{center.active_orders || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrderId(null);
          }}
        />
      )}
    </>
  );
}
