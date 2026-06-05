"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Activity, Users } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, logout, error, clearError } = useAuth();
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
        // Reject non-hospital users
        await logout();
        clearError();
        alert('Access denied. This dashboard is only for hospital network administrators. Please use the Operations dashboard if you are an operations team member.');
        setIsLoading(false);
        return;
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/20"></div>

      {/* Elegant Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-50/50 rounded-full blur-2xl"></div>
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 p-16 flex-col justify-between text-white relative overflow-hidden">
          {/* Elegant Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '48px 48px'
            }}></div>
          </div>

          {/* Soft Glow Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            {/* Logo Section */}
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl">
                <img src="/logo.png" alt="TransFleet" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">TransFleet</h1>
                <p className="text-teal-100 text-sm font-medium">Hospital Dashboard</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold leading-tight mb-4 tracking-tight">
                Medical Sample
                <br />
                Delivery Excellence
              </h2>
              <p className="text-lg text-white/80 leading-relaxed max-w-md">
                Streamline hospital operations with real-time tracking and intelligent delivery management.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-3">
              <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="w-11 h-11 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">Real-time Tracking</h3>
                    <p className="text-white/70 text-sm leading-relaxed">Live GPS tracking and instant status updates</p>
                  </div>
                </div>
              </div>

              <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="w-11 h-11 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">Network Management</h3>
                    <p className="text-white/70 text-sm leading-relaxed">Manage collection centers and riders efficiently</p>
                  </div>
                </div>
              </div>

              <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="w-11 h-11 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">Secure & Compliant</h3>
                    <p className="text-white/70 text-sm leading-relaxed">Enterprise security with complete audit trails</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between">
            <p className="text-white/60 text-sm">
              © 2026 TransFleet. Trusted by hospitals nationwide.
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-white/60 text-xs font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative z-10">
          <div className="w-full max-w-lg">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-12">
              <div className="w-14 h-14 bg-white border-2 border-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="TransFleet" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TransFleet</h1>
                <p className="text-gray-600 text-sm font-medium">Hospital Dashboard</p>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Welcome back</h2>
              <p className="text-gray-600 text-lg">Sign in to access your hospital dashboard</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-teal-100/50 p-10 border border-gray-100/50">
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-3">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base font-medium bg-gray-50/50 focus:bg-white"
                      placeholder="admin@hospital.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-3">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-14 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base font-medium bg-gray-50/50 focus:bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-teal-500 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-teal-500 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-5 w-5 text-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed group transform hover:-translate-y-0.5 mt-8"
                >
                  <span className="text-base">{isLoading ? 'Signing in...' : 'Sign In'}</span>
                  {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </div>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4 font-medium">
                Don't have an account?
              </p>
              <Link href="/register">
                <button className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-teal-500 text-teal-600 font-semibold rounded-2xl hover:bg-teal-50 hover:border-teal-600 transition-all duration-200 transform hover:-translate-y-0.5">
                  Register Your Hospital
                </button>
              </Link>
            </div>

            {/* Support Text */}
            <p className="mt-10 text-center text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:transfleet@primecare.lk" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors">
                transfleet@primecare.lk
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-2xl animate-slideUp">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordStep('email');
                setResetError('');
                setResetSuccess('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold mb-6 text-gray-900">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-center text-2xl tracking-widest"
                />
                <button
                  onClick={handleVerifyOTP}
                  disabled={resetLoading || resetOTP.length !== 6}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading || newPassword.length < 6}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
