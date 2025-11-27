"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      const loginResponse = await login(formData.email, formData.password);

      // Login successful, check if user needs approval
      const user = loginResponse.data?.user;
      const billingStatus = loginResponse.data?.billing_status;

      if (user?.user_type === 'hospital') {
        // Check if services are suspended
        if (billingStatus && (!billingStatus.services_active || billingStatus.subscription_status === 'Suspended')) {
          sessionStorage.setItem('suspension_data', JSON.stringify({
            network_name: billingStatus.network_name,
            contact_email: 'transfleet.primecare@gmail.com',
            contact_phone: '+94 77 788 4049'
          }));
          router.push('/service-suspended');
          return;
        }

        // For hospital users, check their hospital/network status
        try {
          const { apiClient } = await import('@/lib/api');
          const hospitalsResponse = await apiClient.getMyHospitals();

          console.log('=== LOGIN STATUS CHECK ===');
          console.log('User type:', user.user_type);
          console.log('Hospitals response:', hospitalsResponse);

          // Check if any hospital network is still pending approval
          if (hospitalsResponse.success && hospitalsResponse.data?.hospitals) {
            const hospitals = hospitalsResponse.data.hospitals;
            console.log('Hospitals data:', hospitals);

            // Check if any network is pending main hospital approval
            const hasPendingNetwork = hospitals.some((h: any) => {
              console.log('Checking hospital:', h.name, 'Network status:', h.network_status);
              return h.network_status === 'pending_main_hospital_approval';
            });

            console.log('Has pending network?', hasPendingNetwork);

            if (hasPendingNetwork) {
              console.log('Redirecting to /pending-approval - pending main hospital approval');
              router.push("/pending-approval");
              return;
            }

            // Check if any network is pending HQ approval
            const hasPendingHQApproval = hospitals.some((h: any) =>
              h.network_status === 'pending_hq_approval'
            );

            if (hasPendingHQApproval) {
              console.log('Redirecting to /pending-approval - pending HQ approval');
              router.push("/pending-approval");
              return;
            }
          }

          // All approved - go to dashboard
          console.log('Redirecting to /dashboard - all approved');
          router.push("/dashboard");
        } catch (approvalError: any) {
          console.error('Error checking hospital status:', approvalError);
          // If there's an error, still try to go to dashboard
          router.push("/dashboard");
        }
      } else {
        // Non-hospital users go directly to dashboard
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error('Login failed:', error);

      // Check if service is suspended
      if (error?.response?.data?.error?.code === 'SERVICE_SUSPENDED') {
        const suspensionData = error.response.data.error.data;
        // Store suspension data in session storage
        sessionStorage.setItem('suspension_data', JSON.stringify(suspensionData));
        // Redirect to suspension page
        router.push('/service-suspended');
        return;
      }

      // Error is handled by the auth hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: '#F8F9FA' }}
    >
      <div className="w-full">
        {/* Top Navigation Bar */}
        <div 
          className="bg-white border-b px-6 py-4"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white"
                style={{ boxShadow: '0 4px 16px rgba(93, 173, 226, 0.3)' }}
              >
                <img src="/logo.png" alt="TransFleet Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: '#2C3E50' }}>
                  TransFleet Login
                </h1>
                <p className="text-sm" style={{ color: '#4A5568' }}>
                  Hospital Dashboard Access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex items-center justify-center min-h-screen -mt-20">
          <div className="max-w-2xl w-full mx-6">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 
                className="font-semibold mb-4"
                style={{ 
                  fontSize: '42px',
                  fontWeight: '700',
                  color: '#2C3E50'
                }}
              >
                Welcome Back
              </h1>
              <p 
                style={{ 
                  color: '#4A5568',
                  fontSize: '20px',
                  lineHeight: '1.6'
                }}
              >
                Sign in to your hospital dashboard
              </p>
            </div>

            {/* Login Form */}
            <div 
              className="bg-white rounded-2xl p-12"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}
            >
              {error && (
                <div 
                  className="mb-6 p-4 rounded-xl border border-red-200"
                  style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                >
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label 
                  htmlFor="email"
                  className="block font-semibold mb-3"
                  style={{ 
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2C3E50'
                  }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                  style={{ 
                    borderColor: '#E5E7EB',
                    backgroundColor: '#FFFFFF',
                    color: '#2C3E50',
                    fontSize: '16px'
                  }}
                  placeholder="admin@hospital.com"
                />
              </div>
              <div>
                <label 
                  htmlFor="password"
                  className="block font-semibold mb-3"
                  style={{ 
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2C3E50'
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                  style={{ 
                    borderColor: '#E5E7EB',
                    backgroundColor: '#FFFFFF',
                    color: '#2C3E50',
                    fontSize: '16px'
                  }}
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label 
                    htmlFor="remember-me" 
                    className="ml-3"
                    style={{ 
                      fontSize: '16px',
                      color: '#4A5568'
                    }}
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-base hover:underline font-medium"
                  style={{ color: '#5DADE2' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 shadow-lg"
                style={{
                  backgroundColor: '#5DADE2',
                  color: '#FFFFFF',
                  fontSize: '18px'
                }}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              </form>
            </div>

            {/* Registration Link */}
            <div className="text-center mt-10">
              <p 
                className="mb-6"
                style={{ 
                  color: '#4A5568',
                  fontSize: '18px'
                }}
              >
                Don't have an account?
              </p>
              <Link href="/register">
                <button 
                  className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50"
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid #5DADE2',
                    color: '#5DADE2',
                    fontSize: '16px'
                  }}
                >
                  Register Your Hospital
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}