"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HospitalStatus {
  network_name: string;
  hospital_name: string;
  status: string;
  created_at: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
}

export default function PendingApprovalPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [hospitalInfo, setHospitalInfo] = useState<HospitalStatus | null>(null);

  // Move all useState hooks to the top to avoid hook order issues
  const [daysSinceRegistration, setDaysSinceRegistration] = useState<number>(0);
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [formattedTime, setFormattedTime] = useState<string>('');

  // Move ALL useEffect hooks to the top as well
  useEffect(() => {
    if (hospitalInfo?.created_at) {
      const registrationDate = new Date(hospitalInfo.created_at);
      const days = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
      setDaysSinceRegistration(days);
      setFormattedDate(registrationDate.toLocaleDateString());
      setFormattedTime(registrationDate.toLocaleTimeString());
    }
  }, [hospitalInfo?.created_at]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Determine the actual pending status
      const hospitalStatus = user.status || user.hospital_status;
      const networkStatus = user.network_status;

      let actualStatus = 'pending_hq_approval'; // default

      if (hospitalStatus === 'pending_main_hospital_approval' ||
          networkStatus === 'pending_main_hospital_approval') {
        actualStatus = 'pending_main_hospital_approval';
      }

      // Set hospital info from user profile
      setHospitalInfo({
        network_name: user.network_name || 'Hospital Network',
        hospital_name: user.hospital_name || 'Hospital',
        status: actualStatus,
        created_at: user.created_at || new Date().toISOString(),
        admin_name: user.admin_name || user.name || 'Administrator',
        admin_email: user.admin_email || user.email || '',
        admin_phone: user.admin_phone || user.phone || ''
      });
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleRefreshStatus = () => {
    // Force a page refresh to check latest status
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!hospitalInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Unable to load hospital information</h1>
          <Button onClick={() => router.push('/login')} className="mt-4">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {hospitalInfo?.status === 'pending_main_hospital_approval'
              ? 'Pending Main Hospital Approval'
              : 'Pending HQ Approval'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 px-4 sm:px-0">
            {hospitalInfo?.status === 'pending_main_hospital_approval'
              ? 'Your regional hospital registration is awaiting approval from the main hospital'
              : 'Your main hospital registration is currently under review by TransFleet HQ'}
          </p>
        </div>

        {/* Main Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              Application Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">
                  {hospitalInfo?.status === 'pending_main_hospital_approval'
                    ? 'Awaiting Main Hospital Approval'
                    : 'Awaiting TransFleet HQ Approval'}
                </span>
              </div>
              <p className="mt-2 text-sm text-yellow-700">
                {hospitalInfo?.status === 'pending_main_hospital_approval'
                  ? 'Your regional hospital registration is being reviewed by the main hospital administrator. This process typically takes 1-2 business days.'
                  : 'Your main hospital registration is being reviewed by our operations team. This process typically takes 2-3 business days.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Network Name</label>
                <p className="mt-1 text-sm text-gray-900">{hospitalInfo.network_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                <p className="mt-1 text-sm text-gray-900">{hospitalInfo.hospital_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Application Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formattedDate} ({daysSinceRegistration} days ago)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Administrator</label>
                <p className="mt-1 text-sm text-gray-900">{hospitalInfo.admin_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900">Application Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Registration Submitted</h3>
                  <p className="text-sm text-gray-600">
                    {formattedDate} at {formattedTime}
                  </p>
                  <p className="text-xs text-gray-500">Your application was successfully submitted to TransFleet</p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Under Review</h3>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="text-xs text-gray-500">
                    Our team is reviewing your documents and hospital information
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-400">Approval & Activation</h3>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-xs text-gray-400">
                    Access to dashboard and system features will be granted upon approval
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-teal-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">TransFleet Support</p>
                  <p className="text-sm text-gray-600">+94 11 234 5678</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-teal-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Support</p>
                  <p className="text-sm text-gray-600">support@primecare.lk</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM<br />
                <strong>Note:</strong> Poya days and public holidays may affect processing times
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleRefreshStatus}
            variant="outline"
            className="flex-1"
          >
            <Clock className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex-1"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}