import { useState, useMemo } from "react";
import { useOrders } from "@/hooks/useApi";
import { QrCode, Eye } from "lucide-react";
import { QRModal } from "./QRModal";
import { EnhancedOrderDetailModal } from "./modals/EnhancedOrderDetailModal";

interface OrdersTableProps {
  priorityFilter?: string;
  statusFilter?: string;
}

export function OrdersTable({ priorityFilter = "All Priorities", statusFilter = "All Status" }: OrdersTableProps = {}) {
  const filters = useMemo(() => ({ status: "active", limit: 10 }), []);
  const { data: ordersResponse, loading, error } = useOrders(filters);
  // Deduplicate orders that may have multiple QR codes
  const rawOrders = Array.isArray((ordersResponse?.data as any)?.orders) ? (ordersResponse?.data as any).orders : [];
  const deduplicatedOrders = rawOrders.reduce((unique: any[], order: any) => {
    const existingIndex = unique.findIndex(u => u.id === order.id);
    if (existingIndex === -1) {
      // First time seeing this order - add it
      unique.push(order);
    }
    // If duplicate, ignore it (keep the first occurrence)
    return unique;
  }, []);

  // Apply filters
  const orders = useMemo(() => {
    return deduplicatedOrders.filter((order: any) => {
      // Filter by priority
      const priorityMatch = priorityFilter === "All Priorities" ||
        order.urgency?.toLowerCase() === priorityFilter.toLowerCase();

      // Filter by status
      const statusMatch = statusFilter === "All Status" || statusFilter === "" ||
        order.status === statusFilter;

      return priorityMatch && statusMatch;
    });
  }, [deduplicatedOrders, priorityFilter, statusFilter]);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "emergency":
        return "bg-red-100 text-red-800 border border-red-200 shadow-sm";
      case "urgent":
        return "bg-orange-100 text-orange-800 border border-orange-200 shadow-sm";
      case "routine":
        return "bg-teal-100 text-teal-800 border border-teal-200 shadow-sm";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200 shadow-sm";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border border-green-200 shadow-sm";
      case "in_transit":
      case "picked_up":
        return "bg-teal-100 text-teal-800 border border-teal-200 shadow-sm";
      case "assigned":
        return "bg-purple-100 text-purple-800 border border-purple-200 shadow-sm";
      case "pending_rider_assignment":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm";
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-200 shadow-sm";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200 shadow-sm";
    }
  };

  const getSampleTypeColor = (sampleType: string) => {
    switch (sampleType?.toLowerCase()) {
      case "blood":
        return "bg-red-50 text-red-700 border border-red-200 shadow-sm";
      case "urine":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm";
      case "saliva":
        return "bg-teal-50 text-teal-700 border border-teal-200 shadow-sm";
      case "stool":
        return "bg-green-50 text-green-700 border border-green-200 shadow-sm";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200 shadow-sm";
    }
  };

  const getRiderColor = (riderName: string) => {
    if (!riderName || riderName === 'Unassigned') {
      return "text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 italic";
    }
    return "text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200 font-medium";
  };

  // Check if order is late based on backend tracking (CC-specific thresholds)
  const getSLARowColor = (order: any) => {
    // Skip if already delivered or cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return "hover:bg-gray-50";
    }

    // Use backend late tracking flags
    // Backend marks pickup_late or delivery_late based on CC-specific thresholds
    if (order.pickup_late || order.delivery_late) {
      return "bg-red-50 hover:bg-red-100 border-2 border-red-500"; // Critical - LATE
    }

    // Default - no SLA issues
    return "hover:bg-teal-50";
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Live Orders</h3>
        {error && (
          <p className="text-sm text-red-600 mt-1">Unable to load orders. Using demo data.</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collection Center
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Samples
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SLA Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order: any) => (
                <tr key={order.id} className={`transition-colors duration-200 ${getSLARowColor(order)}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-8 bg-teal-400 rounded-l-md mr-3"></div>
                      <span className="text-sm font-bold text-teal-900 bg-teal-50 px-2 py-1 rounded-md border border-teal-200">
                        {order.order_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.urgency || 'routine')}`}>
                      {order.urgency || 'routine'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-sm font-medium text-gray-900">{order.center_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {order.samples && order.samples.length > 0 ? (
                        order.samples.map((sample: any, idx: number) => (
                          <span key={idx} className={`px-2 py-1 text-xs font-medium rounded-full ${getSampleTypeColor(sample.sample_type)}`}>
                            {sample.sample_type} ({sample.quantity})
                          </span>
                        ))
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSampleTypeColor(order.sample_type || 'N/A')}`}>
                          {order.sample_type || 'N/A'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getRiderColor(order.rider_name)}>
                      {order.rider_name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.pickup_late || order.delivery_late ? (
                      <div className="flex items-center space-x-1">
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300 shadow-sm">
                          🚨 LATE
                        </span>
                        {order.pickup_late && order.pickup_late_by_minutes && (
                          <span className="text-xs text-red-700 font-medium">
                            Pickup: +{order.pickup_late_by_minutes}m
                          </span>
                        )}
                        {order.delivery_late && order.delivery_late_by_minutes && (
                          <span className="text-xs text-red-700 font-medium">
                            Delivery: +{order.delivery_late_by_minutes}m
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                        ✓ On Time
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowQRModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-teal-600 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors duration-200"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        Show QR
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setShowDetailModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* QR Code Modal */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        order={selectedOrder}
      />

      {/* Enhanced Order Detail Modal */}
      {selectedOrderId && (
        <EnhancedOrderDetailModal
          orderId={selectedOrderId}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrderId(null);
          }}
        />
      )}
    </div>
  );
}