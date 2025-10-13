"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { apiClient } from "@/lib/api";

function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const userType = searchParams.get('type') || 'hospital';

  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Timer for resend cooldown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMessage('');

    try {
      if (!otpCode || otpCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit verification code');
      }

      const response = await apiClient.verifyEmail(email, otpCode);

      if (response.success) {
        setVerificationStatus('success');
      } else {
        throw new Error(response.error?.message || 'Verification failed');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Verification failed. Please try again.');
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/dashboard/resend-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResendTimer(60); // 60 second cooldown
        alert('Verification code sent! Please check your email.');
      } else {
        throw new Error(result.error?.message || 'Failed to resend verification code');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleOTPInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
    setOtpCode(value);
    setErrorMessage('');
    setVerificationStatus('pending');
  };

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been successfully verified.
              </p>
              <div className="mt-6 space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Next Steps:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Your hospital registration is under review</li>
                    <li>You will receive your Hospital Code after approval</li>
                    <li>You can now log in to track your application status</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Login
                  </Link>
                  <Link
                    href="/register"
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Register Another Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-center text-sm font-medium text-gray-900">
          {email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otpCode}
                  onChange={handleOTPInputChange}
                  placeholder="000000"
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest text-gray-900"
                  maxLength={6}
                  autoComplete="off"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isVerifying || otpCode.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendOTP}
                disabled={isResending || resendTimer > 0}
                className="mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  'Sending...'
                ) : resendTimer > 0 ? (
                  `Resend in ${resendTimer}s`
                ) : (
                  'Resend verification code'
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <Link
                href="/register"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Registration
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center text-sm text-blue-800">
            <p className="font-medium">What happens next?</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Verify your email address</li>
              <li>• Your hospital registration will be reviewed</li>
              <li>• You'll receive a Hospital Code after approval</li>
              <li>• Use your email and password to log in</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <EmailVerificationContent />
    </Suspense>
  );
}