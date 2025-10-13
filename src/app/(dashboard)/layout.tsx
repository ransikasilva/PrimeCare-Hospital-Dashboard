"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // Check hospital approval status
    if (!isLoading && isAuthenticated && user) {
      // For hospital users, check if their hospital/network needs approval
      if (user.user_type === 'hospital') {
        const hospitalStatus = user.status;
        const networkStatus = user.network_status;

        // Check if hospital or network is pending any approval
        if (hospitalStatus === 'pending_hq_approval' || networkStatus === 'pending_hq_approval' ||
            hospitalStatus === 'pending_main_hospital_approval' || networkStatus === 'pending_main_hospital_approval') {
          router.push("/pending-approval");
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Check if user should be redirected to pending approval
  if (user?.user_type === 'hospital') {
    const hospitalStatus = user.status;
    const networkStatus = user.network_status;

    if (hospitalStatus === 'pending_hq_approval' || networkStatus === 'pending_hq_approval' ||
        hospitalStatus === 'pending_main_hospital_approval' || networkStatus === 'pending_main_hospital_approval') {
      return null; // Will redirect to pending approval
    }
  }

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: '#F8F9FA' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '24px' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}