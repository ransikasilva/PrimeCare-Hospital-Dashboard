"use client";

import { useState, useEffect } from "react";
import { MetricsCards } from "@/components/MetricsCards";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useHospitalDashboard, usePendingApprovals, useMyHospitals } from "@/hooks/useApi";
import Link from "next/link";
import { 
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Users,
  FileText,
  BarChart3,
  ArrowUpRight,
  Zap,
  Bell,
  Activity,
  Eye,
  ExternalLink,
  Settings
} from "lucide-react";

interface CollectionCenter {
  id: string;
  name: string;
  location: string;
  activeOrders: number;
  lastPickup: string;
  status: 'active' | 'pending' | 'offline';
  priority: 'high' | 'medium' | 'low';
  distance: string;
  completionRate: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  actionText: string;
  actionLink: string;
  icon: any;
}

// This will be replaced with real data from API

// This will be replaced with real alerts from API

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  const { data: dashboardData, loading, error } = useHospitalDashboard();
  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  const { data: pendingData } = usePendingApprovals(hospitalId || '');

  // Get real metrics from dashboard data
  const metrics = (dashboardData?.data as any)?.metrics || {};

  // Extract collection centers and alerts from real data, remove duplicates by ID
  const collectionCentersRaw = (dashboardData?.data as any)?.collection_centers || [];
  const [lateOrderAlerts, setLateOrderAlerts] = useState<any[]>([]);

  // Remove duplicates based on ID
  const collectionCenters = collectionCentersRaw.filter((center: any, index: number, self: any[]) =>
    index === self.findIndex((c: any) => c.id === center.id)
  );

  // Fetch late orders for alerts (only today's orders)
  useEffect(() => {
    const fetchLateOrders = async () => {
      try {
        const response = await apiClient.getHospitalOrders();
        if (response.success && response.data) {
          const orders = (response.data as any).orders || [];

          // Get today's date at midnight
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Filter for late orders created today
          const lateOrders = orders.filter((order: any) => {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);
            const isToday = orderDate.getTime() === today.getTime();
            const isLate = order.pickup_late || order.delivery_late;
            return isToday && isLate;
          });

          const lateAlerts = lateOrders.map((order: any) => {
            const lateType = order.pickup_late ? 'Pickup' : 'Delivery';

            return {
              id: `late-${order.id}`,
              type: 'critical',
              title: `Late ${lateType}: ${order.order_number}`,
              message: `${order.center_name}`,
              time: 'Just now',
              actionText: 'View Order',
              actionLink: `/orders?id=${order.id}`,
              icon: AlertTriangle
            };
          });

          setLateOrderAlerts(lateAlerts);
        }
      } catch (error) {
        console.error('Error fetching late orders for alerts:', error);
      }
    };

    fetchLateOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLateOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Create quickActions with real data
  const quickActions = [
    {
      icon: Building2,
      title: 'Manage Centers',
      description: 'Add new collection center',
      link: '/centers',
      gradient: ['#4ECDC4', '#4A9BC7'],
      count: `${collectionCenters.length} Active`
    },
    {
      icon: FileText,
      title: 'Manage Orders',
      description: 'Manual order entry',
      link: '/orders',
      gradient: ['#4ECDC4', '#6BB6E8'],
      count: `${metrics?.completed_today?.value || 0} Today`
    },
    {
      icon: Users,
      title: 'Manage Riders',
      description: 'Rider assignments',
      link: '/riders',
      gradient: ['#4ECDC4', '#4FA5D8'],
      count: `${metrics?.available_riders?.value || 0} Available`
    },
    {
      icon: BarChart3,
      title: 'View Reports',
      description: 'Analytics & insights',
      link: '/reports',
      gradient: ['#4ECDC4', '#7BBFEA'],
      count: `${metrics?.sla_compliance?.value || 0}% SLA`
    }
  ];

  // Combine alerts from API and late orders
  const alerts = lateOrderAlerts;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse bg-gray-200 rounded-3xl h-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse bg-gray-200 rounded-3xl h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
          border: '#10b981',
          color: '#065f46',
          text: 'Active',
          pulse: true
        };
      case 'pending':
        return {
          bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
          border: '#f59e0b',
          color: '#92400e',
          text: 'Pending',
          pulse: false
        };
      case 'offline':
        return {
          bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '#ef4444',
          color: '#991b1b',
          text: 'Offline',
          pulse: false
        };
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.1)',
          border: '#9ca3af',
          color: '#374151',
          text: 'Unknown',
          pulse: false
        };
    }
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
          border: '#ef4444',
          iconBg: '#ef4444',
          textColor: '#991b1b'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
          border: '#f59e0b',
          iconBg: '#f59e0b',
          textColor: '#92400e'
        };
      case 'info':
        return {
          bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
          border: '#3b82f6',
          iconBg: '#3b82f6',
          textColor: '#1e40af'
        };
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.1)',
          border: '#9ca3af',
          iconBg: '#9ca3af',
          textColor: '#374151'
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section - Clean & Simple */}
      <div 
        className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
          boxShadow: '0 20px 40px rgba(78, 205, 196, 0.3)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋
              </h1>
              <p className="text-white/90 text-xl mb-4">
                {hospitalsData?.data?.hospitals?.[0]?.name || 'Hospital Dashboard'}
              </p>
              <p className="text-white/80 text-lg">
                Welcome back to your TransFleet dashboard
              </p>
            </div>
            <div className="text-right">
              <div className="text-white/90 mb-2">
                <div className="text-2xl font-bold">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-sm">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 text-white/80">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Simple background pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Metrics Cards */}
      <MetricsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Collection Centers - Takes 2 columns */}
        <div className="xl:col-span-2">
          <div 
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="p-8 border-b border-gray-100/60">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Collection Centers</h2>
                  <p className="text-gray-600">Real-time status and performance metrics</p>
                </div>
                <Link href="/centers">
                  <button 
                    className="flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)',
                      boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                    }}
                  >
                    <span className="text-white font-semibold">View All</span>
                    <ExternalLink className="w-4 h-4 text-white" />
                  </button>
                </Link>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {collectionCenters.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No collection centers found</p>
                    <p className="text-sm text-gray-400 mt-1">Collection centers will appear here once registered</p>
                  </div>
                ) : (
                  collectionCenters.map((center: any) => {
                    const statusConfig = getStatusConfig(center.status || 'active');
                    // Calculate completion rate on frontend (excluding cancelled orders)
                    // Convert strings to numbers for proper calculation
                    const totalOrders = Number(center.total_orders) || 0;
                    const deliveredOrders = Number(center.delivered_orders) || 0;
                    const cancelledOrders = Number(center.cancelled_orders) || 0;

                    const validOrders = totalOrders - cancelledOrders;
                    const completionRate = validOrders > 0
                      ? Math.round((deliveredOrders / validOrders) * 100)
                      : 0; // Default to 0% if no valid orders
                    return (
                      <div 
                        key={center.id}
                        className="group p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                          border: '1px solid rgba(203, 213, 225, 0.3)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-12 h-12 rounded-2xl flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, #4ECDC4 0%, #4A9BC7 100%)'
                              }}
                            >
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">{center.center_name || center.name}</h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center space-x-1 text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  <span className="text-sm">{center.city || center.location}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-600">
                                  <Activity className="w-4 h-4" />
                                  <span className="text-sm">{center.center_type || 'Independent'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="font-bold text-2xl text-gray-800">{center.active_orders || 0}</div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider">Active Orders</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="font-bold text-2xl text-gray-800">{completionRate}%</div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider">Success Rate</div>
                            </div>

                            <div className="text-center">
                              <div className="text-sm text-gray-600">{center.last_pickup || 'N/A'}</div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider">Last Pickup</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Alerts & Quick Actions */}
        <div className="space-y-8">
          {/* Live Alerts */}
          <div 
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="p-6 border-b border-gray-100/60">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-800">Live Alerts</h2>
                <div 
                  className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  title="Live updates active"
                />
              </div>
            </div>

            <div className="p-6">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active alerts</p>
                  <p className="text-sm text-gray-400 mt-1">System alerts will appear here</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                  {alerts.map((alert: any) => {
                    const alertConfig = getAlertConfig(alert.type || 'info');
                    const Icon = alert.icon ? alert.icon : AlertTriangle;
                    return (
                      <div
                        key={alert.id}
                        className="group p-4 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02]"
                        style={{
                          background: alertConfig.bg,
                          border: `1px solid ${alertConfig.border}30`
                        }}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: alertConfig.iconBg }}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-1">{alert.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{alert.time || alert.created_at}</span>
                              <Link href={alert.actionLink || '/orders'}>
                                <button
                                  className="text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 hover:opacity-80"
                                  style={{
                                    backgroundColor: alertConfig.iconBg,
                                    color: 'white'
                                  }}
                                >
                                  {alert.actionText || 'View'}
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div 
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="p-6 border-b border-gray-100/60">
              <div className="flex items-center space-x-3">
                <Zap className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.link}>
                    <div 
                      className="group p-4 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer"
                      style={{
                        background: `linear-gradient(135deg, ${action.gradient[0]}15 0%, ${action.gradient[1]}10 100%)`,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${action.gradient[0]} 0%, ${action.gradient[1]} 100%)`
                          }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800">{action.title}</h4>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{action.description}</p>
                          <div className="flex items-center justify-between">
                            <span 
                              className="text-xs font-bold"
                              style={{ color: action.gradient[0] }}
                            >
                              {action.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}