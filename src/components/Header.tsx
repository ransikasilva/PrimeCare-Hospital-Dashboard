"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMyHospitals } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { SearchBar } from "./SearchBar";
import { apiClient } from "@/lib/api";
import {
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Power
} from "lucide-react";

const quickActions = [
  { icon: Plus, label: "New Order", color: "#4ECDC4" },
  { icon: RefreshCw, label: "Refresh", color: "#0ea5e9" }
];

const pathTitles: { [key: string]: string } = {
  "/dashboard": "Dashboard Overview",
  "/orders": "Live Orders Management",
  "/tracking": "Real-time GPS Tracking",
  "/riders": "Rider Management",
  "/centers": "Collection Centers",
  "/reports": "Reports & Analytics",
  "/audit": "Audit & Compliance",
  "/settings": "System Settings"
};

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activityStatus, setActivityStatus] = useState<{
    is_active: boolean;
    scheduled_active_at?: string;
  }>({ is_active: true });
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    status: string;
    redirect_to: string | null;
  } | null>(null);
  const pathname = usePathname();
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get real data from APIs
  const { user } = useAuth();
  const { data: hospitalsData } = useMyHospitals();


  const hospital = hospitalsData?.data?.hospitals?.[0];
  const hospitalName = hospital?.name || "Loading...";
  const hospitalCode = hospital?.hospital_code || "---";
  const hospitalId = hospital?.id;
  
  // Get user display info
  const userDisplayName = user?.name || user?.hospital_name || user?.center_name || user?.rider_name || user?.email?.split('@')[0] || "User";
  const userEmail = user?.email || "user@hospital.com";
  const userInitials = userDisplayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || "U";

  const unreadCount = notifications.filter(n => n.unread).length;
  const currentTitle = pathTitles[pathname] || "TransFleet Dashboard";

  // Check subscription and approval status
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const response = await apiClient.getSubscriptionStatus();
        if (response.success && response.data) {
          const { status, redirect_to, details } = response.data;

          setSubscriptionStatus({ status, redirect_to });

          // Redirect if not active
          if (redirect_to && status !== 'active') {
            // Store rejection/suspension data in sessionStorage
            if (details) {
              sessionStorage.setItem(
                status === 'rejected' ? 'rejectionData' : 'suspensionData',
                JSON.stringify(details)
              );
            }

            // Redirect to appropriate page
            window.location.href = redirect_to;
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    // Check immediately on mount
    checkSubscriptionStatus();

    // Check every 30 seconds
    const interval = setInterval(checkSubscriptionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch late orders for notifications
  useEffect(() => {
    const fetchLateOrders = async () => {
      try {
        const response = await apiClient.getHospitalOrders();
        if (response.success && response.data) {
          const orders = (response.data as any).orders || [];
          const lateOrders = orders.filter((order: any) =>
            order.pickup_late || order.delivery_late
          );

          // Get dismissed notification IDs from localStorage
          const dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');

          const lateNotifications = lateOrders
            .filter((order: any) => !dismissedIds.includes(`late-${order.id}`))
            .map((order: any) => {
              const lateType = order.pickup_late ? 'Pickup' : 'Delivery';
              const lateMinutes = order.pickup_late
                ? order.pickup_late_by_minutes
                : order.delivery_late_by_minutes;

              return {
                id: `late-${order.id}`,
                type: 'urgent',
                title: `🚨 Late ${lateType}: ${order.order_number}`,
                message: `${order.center_name} - ${lateMinutes} minutes overdue`,
                time: 'Just now',
                unread: true,
                orderId: order.id
              };
            });

          setNotifications(lateNotifications);
        }
      } catch (error) {
        console.error('Error fetching late orders for notifications:', error);
      }
    };

    fetchLateOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLateOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch activity status
  useEffect(() => {
    const fetchActivityStatus = async () => {
      if (!hospitalId) return;

      const token = localStorage.getItem('auth_token');
      if (!token) return; // Don't fetch if no token

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals/activity-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Only process successful responses
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setActivityStatus({
              is_active: data.data.is_active ?? true,
              scheduled_active_at: data.data.scheduled_active_at
            });
          }
        }
      } catch (error) {
        // Silently handle errors - no console spam
      }
    };

    fetchActivityStatus();

    // Listen for activity status changes from settings page
    const handleActivityStatusChange = (event: CustomEvent) => {
      setActivityStatus({
        is_active: event.detail.is_active ?? true,
        scheduled_active_at: event.detail.scheduled_active_at
      });
    };

    window.addEventListener('activityStatusChanged', handleActivityStatusChange as EventListener);

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivityStatus, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('activityStatusChanged', handleActivityStatusChange as EventListener);
    };
  }, [hospitalId]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'success': return CheckCircle2;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent': return '#ef4444';
      case 'success': return '#10b981';
      default: return '#4ECDC4';
    }
  };

  return (
    <header 
      className="relative z-20"
      style={{
        height: '80px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(203, 213, 225, 0.3)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 24px rgba(0, 0, 0, 0.02)'
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Title & Breadcrumb */}
        <div className="flex items-center space-x-6">
          <div>
            <h1 
              className="text-2xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {currentTitle}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <div
                className="flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: '#4ECDC4',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(78, 205, 196, 0.3)'
                }}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {hospitalName} • {hospitalCode}
              </div>
              {/* Activity Status Badge */}
              <div
                className="flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  background: activityStatus.is_active
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  color: activityStatus.is_active ? '#065f46' : '#7f1d1d',
                  border: activityStatus.is_active
                    ? '1px solid rgba(16, 185, 129, 0.2)'
                    : '1px solid rgba(239, 68, 68, 0.2)'
                }}
                title={activityStatus.is_active
                  ? 'Hospital is accepting orders'
                  : `Inactive - Resumes: ${activityStatus.scheduled_active_at ? new Date(activityStatus.scheduled_active_at).toLocaleString('en-LK') : 'Not scheduled'}`
                }
              >
                <Power className={`w-3 h-3 mr-1 ${activityStatus.is_active ? '' : 'animate-pulse'}`} />
                {activityStatus.is_active ? 'Accepting Orders' : 'Not Accepting Orders'}
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-xl mx-8">
          <SearchBar />
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="group relative p-3 rounded-xl transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: showNotifications 
                  ? '#4ECDC4'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: showNotifications 
                  ? '0 8px 32px rgba(78, 205, 196, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}
            >
              <Bell 
                className={`w-5 h-5 transition-colors duration-300 ${
                  showNotifications ? 'text-white' : 'text-gray-600'
                }`} 
              />
              {unreadCount > 0 && (
                <div 
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                    fontSize: '11px'
                  }}
                >
                  {unreadCount}
                </div>
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 top-full mt-2 w-96 rounded-2xl border-0 overflow-hidden z-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="p-4 border-b border-gray-100/60">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">{unreadCount} unread</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => {
                            // Save dismissed notification IDs to localStorage
                            const currentDismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
                            const newDismissed = [...currentDismissed, ...notifications.map(n => n.id)];
                            localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed));

                            // Clear notifications from state
                            setNotifications([]);
                          }}
                          className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors duration-200"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p className="text-sm font-medium text-gray-700">All clear!</p>
                      <p className="text-xs text-gray-500 mt-1">No late orders at the moment</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-gray-50 hover:bg-gray-25 transition-colors duration-200 cursor-pointer"
                          onClick={() => {
                            // Navigate to orders page
                            window.location.href = '/orders';
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${getNotificationColor(notification.type)}20 0%, ${getNotificationColor(notification.type)}10 100%)`,
                                border: `1px solid ${getNotificationColor(notification.type)}30`
                              }}
                            >
                              <Icon
                                className="w-5 h-5"
                                style={{ color: getNotificationColor(notification.type) }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-800">{notification.title}</h4>
                                {notification.unread && (
                                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl transition-all duration-300 hover:bg-gray-50"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{userDisplayName}</p>
                <p className="text-xs text-gray-500">Hospital Administrator</p>
              </div>
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundColor: '#4ECDC4',
                  boxShadow: '0 4px 16px rgba(78, 205, 196, 0.3)'
                }}
              >
                <span className="text-white font-bold text-lg relative z-10">{userInitials}</span>
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 50%)'
                  }}
                />
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                  showUserMenu ? 'transform rotate-180' : ''
                }`} 
              />
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl border-0 overflow-hidden z-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="p-4 border-b border-gray-100/60">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        backgroundColor: '#4ECDC4'
                      }}
                    >
                      <span className="text-white font-bold">{userInitials}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{userDisplayName}</p>
                      <p className="text-sm text-gray-500">{userEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  {[
                    { icon: Settings, label: "Settings", color: "#64748b", path: "/settings" },
                    { icon: LogOut, label: "Sign Out", color: "#ef4444", path: null }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-left"
                        onClick={() => {
                          if (item.label === 'Sign Out') {
                            localStorage.clear();
                            window.location.href = '/login';
                          } else if (item.path) {
                            window.location.href = item.path;
                          }
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: item.color }}
                        />
                        <span className="font-medium text-gray-700">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}