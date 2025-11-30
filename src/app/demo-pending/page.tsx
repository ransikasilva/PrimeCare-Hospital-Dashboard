"use client";

import { Clock, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Demo data for the pending approval page
const demoHospitalInfo = {
  network_name: 'Colombo Medical Network',
  hospital_name: 'National Hospital Colombo',
  status: 'pending_hq_approval',
  created_at: '2025-09-23T10:30:00.000Z', // Fixed date to avoid hydration issues
  admin_name: 'Dr. Saman Perera',
  admin_email: 'admin@nhc.lk',
  admin_phone: '+94 71 234 5678'
};

export default function DemoPendingApprovalPage() {
  const handleRefreshStatus = () => {
    alert('This is a demo - Status refresh functionality would check for latest approval status');
  };

  const handleLogout = () => {
    alert('This is a demo - Logout functionality would redirect to login page');
  };

  const daysSinceRegistration = 2; // Fixed value for demo to avoid hydration issues

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Demo Banner */}
        <div className="mb-6 p-3 bg-teal-100 border border-teal-300 rounded-lg">
          <p className="text-sm text-teal-800 text-center font-medium">
            🎯 DEMO: Pending Hospital Approval Page Preview
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pending HQ Approval</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your hospital registration is currently under review by TransFleet HQ
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
                <span className="font-medium text-yellow-800">Awaiting TransFleet HQ Approval</span>
              </div>
              <p className="mt-2 text-sm text-yellow-700">
                Your main hospital registration is being reviewed by our operations team.
                This process typically takes 2-3 business days.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Network Name</label>
                <p className="mt-1 text-sm text-gray-900">{demoHospitalInfo.network_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                <p className="mt-1 text-sm text-gray-900">{demoHospitalInfo.hospital_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Application Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  September 23, 2025 ({daysSinceRegistration} days ago)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Administrator</label>
                <p className="mt-1 text-sm text-gray-900">{demoHospitalInfo.admin_name}</p>
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
                    September 23, 2025 at 10:30 AM
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
                  <p className="text-sm text-gray-600">+94 77 788 4049</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-teal-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Support</p>
                  <p className="text-sm text-gray-600">transfleet.primecare@gmail.com</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-sm text-teal-800">
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

        {/* Demo Instructions */}
        <div className="mt-8 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Information:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• This page shows when hospitals have `pending_hq_approval` status</li>
            <li>• Real hospitals would see their actual registration data</li>
            <li>• The system automatically redirects pending hospitals here</li>
            <li>• Once approved, hospitals get full dashboard access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}