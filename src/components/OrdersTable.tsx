import { useState, useMemo } from "react";
import { useOrders } from "@/hooks/useApi";
import { QrCode, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { QRModal } from "./QRModal";
import { EnhancedOrderDetailModal } from "./modals/EnhancedOrderDetailModal";

interface OrdersTableProps {
  priorityFilter?: string;
  statusFilter?: string;
  sortByDate?: string;
}

type SortField = 'order_number' | 'urgency' | 'center_name' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc' | null;

export function OrdersTable({ priorityFilter = "All Priorities", statusFilter = "All Status", sortByDate = "newest" }: OrdersTableProps = {}) {
  const filters = useMemo(() => ({}), []); // Fetch all orders (no status filter)
  const { data: ordersResponse, loading, error } = useOrders(filters);
  // State declarations
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const ordersPerPage = 10;

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

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 text-teal-600" />;
    }
    return <ArrowDown className="h-4 w-4 text-teal-600" />;
  };

  // Apply filters and sorting
  const orders = useMemo(() => {
    let filtered = deduplicatedOrders.filter((order: any) => {
      // Filter by priority
      const priorityMatch = priorityFilter === "All Priorities" ||
        order.urgency?.toLowerCase() === priorityFilter.toLowerCase();

      // Filter by status
      const statusMatch = statusFilter === "All Status" || statusFilter === "" ||
        order.status === statusFilter;

      // Filter by search query (order number or center name)
      const searchMatch = searchQuery === "" ||
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.center_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.rider_name?.toLowerCase().includes(searchQuery.toLowerCase());

      return priorityMatch && statusMatch && searchMatch;
    });

    // Apply column sorting (from clicking headers)
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // Convert to lowercase for string comparison
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        // Priority sorting (urgent > routine)
        if (sortField === 'urgency') {
          const priorityOrder: any = { 'emergency': 3, 'urgent': 2, 'routine': 1 };
          aValue = priorityOrder[aValue] || 0;
          bValue = priorityOrder[bValue] || 0;
        }

        // Status sorting (custom order)
        if (sortField === 'status') {
          const statusOrder: any = {
            'pending_rider_assignment': 1,
            'assigned': 2,
            'picked_up': 3,
            'in_transit': 4,
            'delivered': 5,
            'cancelled': 6
          };
          aValue = statusOrder[aValue] || 0;
          bValue = statusOrder[bValue] || 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Apply date sorting from dropdown filter (when no column sorting is active)
      filtered = [...filtered].sort((a, b) => {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();

        if (sortByDate === 'newest') {
          return bDate - aDate; // Newest first (descending)
        } else {
          return aDate - bDate; // Oldest first (ascending)
        }
      });
    }

    return filtered;
  }, [deduplicatedOrders, priorityFilter, statusFilter, searchQuery, sortField, sortDirection, sortByDate]);

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [priorityFilter, statusFilter, searchQuery]);

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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Live Orders</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Center, or Rider..."
              className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">Unable to load orders. Using demo data.</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => handleSort('order_number')}
              >
                <div className="flex items-center space-x-1">
                  <span>Order ID</span>
                  {getSortIcon('order_number')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => handleSort('urgency')}
              >
                <div className="flex items-center space-x-1">
                  <span>Priority</span>
                  {getSortIcon('urgency')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => handleSort('center_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Collection Center</span>
                  {getSortIcon('center_name')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Samples
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rider
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
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
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              currentOrders.map((order: any) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">{Math.min(endIndex, orders.length)}</span> of{" "}
              <span className="font-medium">{orders.length}</span> orders
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-teal-50 border border-gray-300"
                }`}
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  const showEllipsis =
                    (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2);

                  if (showEllipsis) {
                    return (
                      <span key={page} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }

                  if (!showPage) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === page
                          ? "bg-teal-600 text-white"
                          : "bg-white text-gray-700 hover:bg-teal-50 border border-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-teal-50 border border-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

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