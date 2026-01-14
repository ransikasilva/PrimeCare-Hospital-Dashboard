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

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOTP, setResetOTP] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Forgot Password - Step 1: Send Email
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/dashboard/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await response.json();

      if (data.success) {
        setResetSuccess('Reset code sent to your email!');
        setForgotPasswordStep('otp');
      } else {
        setResetError(data.error?.message || 'Failed to send reset code');
      }
    } catch (error) {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Forgot Password - Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/dashboard/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOTP })
      });
      const data = await response.json();

      if (data.success) {
        setResetToken(data.data.resetToken);
        setResetSuccess('Code verified! Now set your new password.');
        setForgotPasswordStep('reset');
      } else {
        setResetError(data.error?.message || 'Invalid or expired code');
      }
    } catch (error) {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Forgot Password - Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/dashboard/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          resetToken: resetToken,
          newPassword: newPassword
        })
      });
      const data = await response.json();

      if (data.success) {
        setResetSuccess('Password reset successfully! You can now login.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordStep('email');
          setResetEmail('');
          setResetOTP('');
          setNewPassword('');
          setResetToken('');
        }, 2000);
      } else {
        setResetError(data.error?.message || 'Failed to reset password');
      }
    } catch (error) {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
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

      // Check if email is not verified
      if (error?.code === 'EMAIL_NOT_VERIFIED' && error?.data?.email) {
        // Store email in session storage for the verify-email page
        sessionStorage.setItem('pending_verification_email', error.data.email);
        // Redirect to verify-email page
        router.push('/verify-email');
        return;
      }

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
                style={{ boxShadow: '0 4px 16px rgba(78, 205, 196, 0.3)' }}
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
                  onClick={() => setShowForgotPassword(true)}
                  className="text-base hover:underline font-medium"
                  style={{ color: '#4ECDC4' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 shadow-lg"
                style={{
                  backgroundColor: '#4ECDC4',
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
                    border: '2px solid #4ECDC4',
                    color: '#4ECDC4',
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordStep('email');
                setResetError('');
                setResetSuccess('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold mb-6" style={{ color: '#4ECDC4' }}>
              Reset Password
            </h2>

            {resetError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {resetSuccess}
              </div>
            )}

            {/* Step 1: Enter Email */}
            {forgotPasswordStep === 'email' && (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Enter your email address and we'll send you a verification code.
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#4ECDC4', color: 'white' }}
                >
                  {resetLoading ? 'Sending...' : 'Send Code'}
                </button>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {forgotPasswordStep === 'otp' && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Enter the 6-digit code sent to <strong>{resetEmail}</strong>
                </p>
                <input
                  type="text"
                  value={resetOTP}
                  onChange={(e) => setResetOTP(e.target.value)}
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-2xl tracking-widest"
                />
                <button
                  onClick={handleVerifyOTP}
                  disabled={resetLoading || resetOTP.length !== 6}
                  className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#4ECDC4', color: 'white' }}
                >
                  {resetLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={() => setForgotPasswordStep('email')}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to email
                </button>
              </div>
            )}

            {/* Step 3: Set New Password */}
            {forgotPasswordStep === 'reset' && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Create a new password for your account
                </p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min. 6 characters)"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading || newPassword.length < 6}
                  className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#4ECDC4', color: 'white' }}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}