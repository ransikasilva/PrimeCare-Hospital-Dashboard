"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useHospitalDashboard, usePendingApprovals, useMyHospitals } from "@/hooks/useApi";
import {
  LayoutDashboard,
  FileText,
  MapPin,
  Users,
  Building2,
  BarChart3,
  Settings,
  ChevronRight,
  ClipboardList,
  Hospital
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Always call hooks in same order - use conditional logic inside
  const { data: dashboardData } = useHospitalDashboard();
  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  const { data: pendingData } = usePendingApprovals(hospitalId || "");

  // Only use data on dashboard page
  const isDashboardPage = pathname === '/dashboard';

  // Check if user has a main hospital
  const allHospitals = hospitalsData?.data?.hospitals || [];
  const hasMainHospital = allHospitals.some((h: any) => h.is_main_hospital);

  // Calculate counts only if we're on dashboard and have data
  const activeOrders = isDashboardPage && (dashboardData?.data as any)?.orders?.length || 0;
  const activeRiders = isDashboardPage && (dashboardData?.data as any)?.riders?.filter((r: any) => r.availability_status === 'available')?.length || 0;
  const pendingCenters = (pendingData?.data as any)?.collection_centers?.length || 0;

  const baseNavigation = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      badge: null,
      description: "Overview & analytics"
    },
    { 
      name: "Live Orders", 
      href: "/orders", 
      icon: FileText,
      badge: activeOrders > 0 ? activeOrders.toString() : null,
      description: "Active deliveries & queue"
    },
    { 
      name: "Order Management", 
      href: "/order-management", 
      icon: ClipboardList,
      badge: null,
      description: "SLA monitoring & control"
    },
    { 
      name: "Live Tracking", 
      href: "/tracking", 
      icon: MapPin,
      badge: activeRiders > 0 ? activeRiders.toString() : null,
      description: "Real-time GPS monitoring"
    },
    { 
      name: "Riders", 
      href: "/riders", 
      icon: Users,
      badge: null,
      description: "Driver management"
    },
    {
      name: "Collection Centers",
      href: "/centers",
      icon: Building2,
      badge: pendingCenters > 0 ? pendingCenters.toString() : null,
      description: "Partner facilities"
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      badge: null,
      description: "Performance & billing"
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
      description: "System configuration"
    },
  ];

  // Add Hospitals tab only for main hospitals
  const navigation = hasMainHospital
    ? [
        ...baseNavigation.slice(0, 5), // Dashboard, Live Orders, Order Management, Live Tracking, Riders
        {
          name: "Collection Centers",
          href: "/centers",
          icon: Building2,
          badge: pendingCenters > 0 ? pendingCenters.toString() : null,
          description: "Partner facilities"
        },
        {
          name: "Hospitals",
          href: "/hospitals",
          icon: Hospital,
          badge: null,
          description: "Network hospitals"
        },
        ...baseNavigation.slice(6) // Reports, Settings
      ]
    : baseNavigation;

  return (
    <div
      className="w-72 h-screen flex flex-col fixed left-0 top-0"
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRight: '1px solid rgba(203, 213, 225, 0.3)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)',
        zIndex: 40
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 pb-3 border-b border-gray-100/60">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden bg-white"
            style={{
              boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
            }}
          >
            <img
              src="/logo.png"
              alt="TransFleet Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{
                color: '#1e293b',
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              TransFleet
            </h1>
            <p className="text-sm font-medium" style={{ color: '#64748b' }}>
              Hospital Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
           style={{ scrollbarWidth: 'thin', scrollbarColor: '#4ECDC4 transparent' }}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const isHovered = hoveredItem === item.name;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="block relative group"
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                className={`
                  relative flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out
                  ${isActive ? 'transform scale-[1.02]' : 'hover:transform hover:scale-[1.01]'}
                `}
                style={{
                  background: isActive 
                    ? '#4ECDC4'
                    : isHovered 
                      ? 'rgba(78, 205, 196, 0.08)'
                      : 'transparent',
                  boxShadow: isActive 
                    ? '0 8px 32px rgba(78, 205, 196, 0.3), 0 0 0 1px rgba(78, 205, 196, 0.1)'
                    : isHovered
                      ? '0 4px 16px rgba(78, 205, 196, 0.1)'
                      : 'none'
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div 
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)'
                    }}
                  />
                )}

                <div className="flex items-center space-x-4 flex-1 relative z-10">
                  <div className="relative">
                    <Icon 
                      className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-600'}`}
                      style={{
                        filter: isActive ? 'drop-shadow(0 2px 8px rgba(255,255,255,0.3))' : 'none'
                      }}
                    />
                    {item.badge && (
                      <div 
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                          fontSize: '10px'
                        }}
                      >
                        {item.badge}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div 
                      className={`font-semibold transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-gray-800'
                      }`}
                      style={{ fontSize: '15px' }}
                    >
                      {item.name}
                    </div>
                    <div 
                      className={`text-xs transition-colors duration-300 ${
                        isActive ? 'text-white/80' : 'text-gray-500'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>

                  <ChevronRight 
                    className={`w-4 h-4 transition-all duration-300 ${
                      isActive 
                        ? 'text-white/80 transform rotate-90' 
                        : isHovered 
                          ? 'text-gray-600 transform translate-x-1' 
                          : 'text-gray-400'
                    }`}
                  />
                </div>

                {/* Hover glow effect */}
                {isHovered && !isActive && (
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-50"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(78, 205, 196, 0.1) 0%, transparent 70%)'
                    }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Status */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100/60">
        <div 
          className="p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: '#10b981' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">All Systems</p>
              <p className="text-xs text-gray-600">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}