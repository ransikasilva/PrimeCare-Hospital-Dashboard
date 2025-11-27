"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMyHospitals } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Bell, 
  ChevronDown, 
  Search, 
  Settings,
  LogOut,
  User,
  HelpCircle,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

const notifications: any[] = [];

const quickActions = [
  { icon: Plus, label: "New Order", color: "#5DADE2" },
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
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get real data from APIs
  const { user } = useAuth();
  const { data: hospitalsData } = useMyHospitals();
  
  
  const hospital = hospitalsData?.data?.hospitals?.[0];
  const hospitalName = hospital?.name || "Loading...";
  const hospitalCode = hospital?.hospital_code || "---";
  
  // Get user display info
  const userDisplayName = user?.name || user?.hospital_name || user?.center_name || user?.rider_name || user?.email?.split('@')[0] || "User";
  const userEmail = user?.email || "user@hospital.com";
  const userInitials = userDisplayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || "U";

  const unreadCount = notifications.filter(n => n.unread).length;
  const currentTitle = pathTitles[pathname] || "TransFleet Dashboard";

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
      default: return '#5DADE2';
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
                  backgroundColor: '#5DADE2',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(93, 173, 226, 0.3)'
                }}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {hospitalName} • {hospitalCode}
              </div>
              <div 
                className="flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  color: '#065f46',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, riders, centers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-0 text-gray-800 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)'
              }}
            />
            {searchQuery && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl border-0 overflow-hidden z-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="p-2">
                  <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Search Results
                  </div>
                  <div className="space-y-1">
                    <div className="px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                      <div className="font-medium text-gray-800">Order #1247</div>
                      <div className="text-sm text-gray-500">MediLab Centre → General Hospital</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
                  ? '#5DADE2'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                border: '1px solid rgba(203, 213, 225, 0.3)',
                boxShadow: showNotifications 
                  ? '0 8px 32px rgba(93, 173, 226, 0.3)'
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
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{unreadCount} unread</span>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div 
                        key={notification.id}
                        className="p-4 border-b border-gray-50 hover:bg-gray-25 transition-colors duration-200 cursor-pointer"
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
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-gray-100/60">
                  <button 
                    className="w-full text-center text-sm font-medium transition-colors duration-200"
                    style={{ color: '#5DADE2' }}
                  >
                    View All Notifications
                  </button>
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
                  backgroundColor: '#5DADE2',
                  boxShadow: '0 4px 16px rgba(93, 173, 226, 0.3)'
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
                        backgroundColor: '#5DADE2'
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