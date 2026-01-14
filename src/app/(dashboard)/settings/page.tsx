'use client';

import { useState, useEffect } from 'react';
import { useMyHospitals, useOrders, usePendingApprovals, useHospitalDashboard } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import {
  Phone, Monitor, Bell, AlertTriangle, Users, Building2,
  Clock, Wifi, Database, Save, RotateCcw,
  MessageSquare, Radio, Route, Power
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    shortName: '',
    hospitalCode: '',
    contactPhone: '',
    address: ''
  });

  // SMS sending state
  const [smsData, setSmsData] = useState({
    sendTo: 'all-riders',
    subject: '',
    message: '',
    priority: 'Normal'
  });
  const [sendingSms, setSendingSms] = useState(false);
  const [realRiderCount, setRealRiderCount] = useState(0);
  const [realCenterCount, setRealCenterCount] = useState(0);

  // Distance calculation settings
  const [distanceMode, setDistanceMode] = useState<'full' | 'pickup_only' | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(true);
  const [savingDistance, setSavingDistance] = useState(false);

  // Activity status settings
  const [activityStatus, setActivityStatus] = useState({
    is_active: true,
    scheduled_active_at: '',
    inactive_reason: '',
    inactive_since: null as string | null,
    last_status_change: null as string | null
  });
  const [loadingActivityStatus, setLoadingActivityStatus] = useState(true);
  const [savingActivityStatus, setSavingActivityStatus] = useState(false);
  const [showInactiveDialog, setShowInactiveDialog] = useState(false);
  const [reactivationDate, setReactivationDate] = useState('');
  const [reactivationTime, setReactivationTime] = useState('');

  // Get current hospital data and real counts
  const { data: hospitalsData, loading } = useMyHospitals();
  const currentHospital = hospitalsData?.data?.hospitals?.[0];
  const hospitalId = currentHospital?.id;

  // Get dashboard data for collection centers
  const { data: dashboardData } = useHospitalDashboard();

  const totalRecipients = realRiderCount + realCenterCount;

  // Load hospital data when available
  useEffect(() => {
    if (currentHospital) {
      setFormData({
        hospitalName: currentHospital.name || '',
        shortName: currentHospital.name?.split(' ').slice(0, 2).join(' ') || '',
        hospitalCode: currentHospital.hospital_code || '',
        contactPhone: currentHospital.contact_phone || '',
        address: currentHospital.address || ''
      });
    }
  }, [currentHospital]);

  // Fetch real rider and collection center counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!hospitalId) {
        console.log('No hospitalId yet, skipping fetch');
        return;
      }

      console.log('Fetching counts for hospital:', hospitalId);

      try {
        // Get riders count
        console.log('Fetching riders for hospital:', hospitalId);
        const ridersResponse = await apiClient.getHospitalRidersByHospitalId(hospitalId);
        console.log('Riders response:', ridersResponse);

        // Handle riders response - check if it's an array or nested in data
        let riders: any[] = [];
        if (Array.isArray(ridersResponse?.data)) {
          riders = ridersResponse.data;
        } else if (Array.isArray((ridersResponse?.data as any)?.riders)) {
          riders = (ridersResponse.data as any).riders;
        }

        console.log('All riders:', riders);
        const approvedRiders = riders.filter((r: any) => r.status === 'approved');
        console.log('Approved riders count:', approvedRiders.length);
        setRealRiderCount(approvedRiders.length);

        // Get collection centers count from dashboard data
        console.log('Getting collection centers from dashboard');
        const centers = (dashboardData?.data as any)?.collection_centers || [];
        console.log('All centers from dashboard:', centers);
        const approvedCenters = centers.filter((c: any) => c.status === 'approved' || c.relation_status === 'approved');
        console.log('Approved centers count:', approvedCenters.length);
        setRealCenterCount(approvedCenters.length);
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      }
    };

    fetchCounts();
  }, [hospitalId, dashboardData]);

  // Fetch distance calculation mode
  useEffect(() => {
    const fetchDistanceMode = async () => {
      if (!hospitalId) {
        console.log('⏭️ No hospitalId, skipping distance mode fetch');
        return;
      }

      try {
        console.log('🔄 Fetching distance calculation mode for hospital:', hospitalId);
        setLoadingDistance(true);
        const response = await apiClient.getDistanceCalculationMode(hospitalId);
        console.log('📥 Distance mode response:', response);

        if (response.success && response.data) {
          console.log('✅ Setting distance mode to:', response.data.distance_calculation_mode);
          setDistanceMode(response.data.distance_calculation_mode);
        } else {
          console.warn('⚠️ Invalid response structure:', response);
        }
      } catch (error) {
        console.error('❌ Failed to fetch distance calculation mode:', error);
      } finally {
        setLoadingDistance(false);
      }
    };

    fetchDistanceMode();
  }, [hospitalId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!currentHospital?.id) {
      alert('Hospital ID not found. Please refresh the page.');
      return;
    }

    setSaving(true);
    try {
      // Prepare data for API call
      const updateData = {
        name: formData.hospitalName,
        contact_phone: formData.contactPhone,
        address: formData.address
      };

      console.log('Saving hospital settings:', updateData);
      
      // Call the backend API to update hospital
      const response = await apiClient.updateHospital(currentHospital.id, updateData);
      
      if (response.success) {
        alert('Hospital settings saved successfully!');
        // Optionally refresh the data
        window.location.reload();
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save hospital settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendSms = async () => {
    if (!hospitalId) {
      alert('Hospital ID not found. Please refresh the page.');
      return;
    }

    if (!smsData.message.trim()) {
      alert('Please enter a message to send.');
      return;
    }

    setSendingSms(true);
    try {
      // Determine recipient type based on selection
      let recipientType = '';
      if (smsData.sendTo === 'all-riders') {
        recipientType = 'riders';
      } else if (smsData.sendTo === 'all-centers') {
        recipientType = 'collection_centers';
      } else if (smsData.sendTo === 'emergency') {
        recipientType = 'both';
      }

      // Call backend API to send SMS via Text.lk
      const response = await apiClient.sendBulkSms({
        hospitalId: hospitalId,
        recipientType: recipientType,
        message: smsData.message,
        subject: smsData.subject,
        priority: smsData.priority.toLowerCase()
      });

      if (response.success) {
        alert(`SMS sent successfully to ${response.data?.count || 'recipients'}!`);
        // Reset form
        setSmsData({
          sendTo: 'all-riders',
          subject: '',
          message: '',
          priority: 'Normal'
        });
      } else {
        throw new Error(response.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      alert('Failed to send SMS. Please try again.');
    } finally {
      setSendingSms(false);
    }
  };

  const handleSaveDistanceMode = async () => {
    if (!hospitalId) {
      alert('Hospital ID not found. Please refresh the page.');
      return;
    }

    if (!distanceMode) {
      alert('Please select a distance calculation mode.');
      return;
    }

    setSavingDistance(true);
    try {
      const response = await apiClient.updateDistanceCalculationMode(hospitalId, distanceMode);

      if (response.success) {
        alert('Distance calculation settings saved successfully!');
      } else {
        throw new Error(response.error?.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving distance settings:', error);
      alert(error.message || 'Failed to save settings');
    } finally {
      setSavingDistance(false);
    }
  };

  // Load activity status on mount
  useEffect(() => {
    const fetchActivityStatus = async () => {
      if (!hospitalId) return;

      try {
        setLoadingActivityStatus(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals/activity-status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        const data = await response.json();
        if (data.success && data.data) {
          setActivityStatus({
            is_active: data.data.is_active ?? true,
            scheduled_active_at: data.data.scheduled_active_at || '',
            inactive_reason: data.data.inactive_reason || '',
            inactive_since: data.data.inactive_since || null,
            last_status_change: data.data.last_status_change || null
          });
        }
      } catch (error) {
        console.error('Error fetching activity status:', error);
      } finally {
        setLoadingActivityStatus(false);
      }
    };

    fetchActivityStatus();
  }, [hospitalId]);

  // Handle activity status update
  const handleUpdateActivityStatus = async (isActive: boolean, scheduledActiveAt: string | null, reason: string) => {
    if (!hospitalId) {
      alert('Hospital ID not found. Please refresh the page.');
      return;
    }

    setSavingActivityStatus(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals/activity-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: isActive,
          scheduled_active_at: scheduledActiveAt,
          reason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || `Hospital marked as ${isActive ? 'active' : 'inactive'} successfully!`);

        // Update local state
        setActivityStatus({
          is_active: data.data.is_active,
          scheduled_active_at: data.data.scheduled_active_at || '',
          inactive_reason: data.data.inactive_reason || '',
          inactive_since: data.data.inactive_since || null,
          last_status_change: data.data.last_status_change || null
        });

        // Reset dialog fields
        setReactivationDate('');
        setReactivationTime('');

        // Trigger header refresh by dispatching a custom event
        window.dispatchEvent(new CustomEvent('activityStatusChanged', {
          detail: {
            is_active: data.data.is_active,
            scheduled_active_at: data.data.scheduled_active_at
          }
        }));
      } else {
        throw new Error(data.error?.message || 'Failed to update activity status');
      }
    } catch (error: any) {
      console.error('Error updating activity status:', error);
      alert(error.message || 'Failed to update activity status');
    } finally {
      setSavingActivityStatus(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Hospital Settings</h1>
        <p className="text-gray-600">Configure hospital operations and notification preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', name: 'General Settings', icon: Building2 },
            { id: 'activity', name: 'Activity Status', icon: Power },
            { id: 'distance', name: 'Distance Calculation', icon: Route },
            { id: 'send', name: 'Send SMS Notifications', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Hospital Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Hospital Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                  <input
                    type="text"
                    value={formData.hospitalName}
                    onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => handleInputChange('shortName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Code</label>
                  <input
                    type="text"
                    value={formData.hospitalCode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Database</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">API</p>
                  <p className="text-xs text-gray-500">Responsive</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Notifications</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Last system check: 30 seconds ago</p>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Activity Status Card */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Hospital Activity Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                Control whether your hospital is accepting new sample collection orders
              </p>
            </div>
            <div className="p-6">
              {/* Current Status Display */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${activityStatus.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current Status</p>
                      <p className={`text-lg font-semibold ${activityStatus.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {activityStatus.is_active ? '🟢 Active - Accepting Orders' : '🔴 Inactive - Not Accepting Orders'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (activityStatus.is_active) {
                        // Going inactive - show dialog
                        setShowInactiveDialog(true);
                      } else {
                        // Going active - activate immediately
                        handleUpdateActivityStatus(true, null, '');
                      }
                    }}
                    disabled={savingActivityStatus}
                    className={`px-6 py-3 rounded-md font-medium text-white transition-colors ${
                      activityStatus.is_active
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {savingActivityStatus ? 'Updating...' : activityStatus.is_active ? 'Mark as Inactive' : 'Reactivate Hospital'}
                  </button>
                </div>

                {!activityStatus.is_active && activityStatus.scheduled_active_at && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <strong>Scheduled to reactivate:</strong>{' '}
                      {new Date(activityStatus.scheduled_active_at).toLocaleString('en-LK', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    {activityStatus.inactive_reason && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Reason:</strong> {activityStatus.inactive_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Information Panel */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Important Information:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>When inactive, collection centers <strong>cannot create new orders</strong> to your hospital</li>
                      <li>SMS notifications will be sent to all affiliated collection centers and riders</li>
                      <li>You must specify when you plan to reactivate when going inactive</li>
                      <li>Existing active orders will continue to be processed normally</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inactive Dialog Modal */}
          {showInactiveDialog && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div
                className="rounded-2xl shadow-2xl max-w-md w-full mx-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">⚠️ Mark Hospital as Inactive</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">
                    Collection centers will <strong>NOT</strong> be able to create new orders while inactive.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When will you reactivate? *
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Reactivation Date</label>
                        <input
                          type="date"
                          value={reactivationDate}
                          onChange={(e) => setReactivationDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Reactivation Time</label>
                        <input
                          type="time"
                          value={reactivationTime}
                          onChange={(e) => setReactivationTime(e.target.value)}
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason (Optional)
                    </label>
                    <textarea
                      value={activityStatus.inactive_reason}
                      onChange={(e) => setActivityStatus(prev => ({ ...prev, inactive_reason: e.target.value }))}
                      placeholder="e.g., Annual maintenance, Public holiday, etc."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This will send SMS notifications to all affiliated collection centers and riders.
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowInactiveDialog(false);
                      setReactivationDate('');
                      setReactivationTime('');
                      setActivityStatus(prev => ({ ...prev, inactive_reason: '' }));
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!reactivationDate || !reactivationTime) {
                        alert('Please select both date and time for reactivation');
                        return;
                      }
                      const scheduledDateTime = `${reactivationDate}T${reactivationTime}:00`;
                      handleUpdateActivityStatus(false, scheduledDateTime, activityStatus.inactive_reason);
                      setShowInactiveDialog(false);
                    }}
                    disabled={!reactivationDate || !reactivationTime}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm - Go Inactive
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'distance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Rider Distance Calculation</h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure how rider travel distance is calculated for payment purposes
              </p>
            </div>

            {loadingDistance ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {/* Full Mode Option */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      distanceMode === 'full'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setDistanceMode('full')}
                  >
                    <div className="flex items-start">
                      <input
                        type="radio"
                        id="full-mode"
                        name="distance-mode"
                        value="full"
                        checked={distanceMode === 'full'}
                        onChange={() => setDistanceMode('full')}
                        className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <label htmlFor="full-mode" className="block font-medium text-gray-900 cursor-pointer">
                          Full Distance Tracking
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Count ALL distance from the moment the order is assigned/accepted until delivery is completed.
                        </p>
                        <div className="mt-3 bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Example:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Rider at location A when order assigned</li>
                            <li>• Travels to Collection Center B (5 km) - <span className="font-semibold text-teal-700">COUNTED</span></li>
                            <li>• Picks up samples from B</li>
                            <li>• Travels to Hospital C (10 km) - <span className="font-semibold text-teal-700">COUNTED</span></li>
                            <li className="pt-1 border-t border-gray-200 font-semibold text-gray-900">
                              Total rider payment: 15 km
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Only Mode Option */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      distanceMode === 'pickup_only'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setDistanceMode('pickup_only')}
                  >
                    <div className="flex items-start">
                      <input
                        type="radio"
                        id="pickup-only-mode"
                        name="distance-mode"
                        value="pickup_only"
                        checked={distanceMode === 'pickup_only'}
                        onChange={() => setDistanceMode('pickup_only')}
                        className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <label htmlFor="pickup-only-mode" className="block font-medium text-gray-900 cursor-pointer">
                          From First Pickup Only
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Exclude the distance to the first pickup location. Only count distance from the first pickup onwards.
                        </p>
                        <div className="mt-3 bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Example:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Rider at location A when order assigned</li>
                            <li>• Travels to Collection Center B (5 km) - <span className="font-semibold text-red-700">NOT COUNTED</span></li>
                            <li>• Picks up samples from B</li>
                            <li>• Travels to Hospital C (10 km) - <span className="font-semibold text-teal-700">COUNTED</span></li>
                            <li className="pt-1 border-t border-gray-200 font-semibold text-gray-900">
                              Total rider payment: 10 km
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Important Notes:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>This setting applies to all routes and affects rider payment calculations</li>
                        <li>In multi-parcel scenarios, only the distance to the FIRST pickup (chronologically) is excluded</li>
                        <li>For handovers, this applies to each rider's segment separately</li>
                        <li>Changes take effect immediately for new orders</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveDistanceMode}
                    disabled={savingDistance}
                    className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingDistance ? 'Saving...' : 'Save Distance Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="space-y-6">
          {/* Send To Options */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Send To</h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                { id: 'all-riders', label: 'All Riders', count: realRiderCount },
                { id: 'all-centers', label: 'All Collection Centers', count: realCenterCount },
                { id: 'emergency', label: 'Emergency Broadcast (Both)', count: totalRecipients }
              ].map((option) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={option.id}
                    name="sendTo"
                    value={option.id}
                    checked={smsData.sendTo === option.id}
                    onChange={(e) => setSmsData(prev => ({ ...prev, sendTo: e.target.value }))}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                  />
                  <label htmlFor={option.id} className="ml-2 text-sm font-medium text-gray-900">
                    {option.label} {option.count !== null && `(${option.count})`}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Message Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Message Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject (Optional)</label>
                <input
                  type="text"
                  value={smsData.subject}
                  onChange={(e) => setSmsData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter message subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  value={smsData.message}
                  onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your SMS message here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Character count: {smsData.message.length} (SMS supports up to 160 characters per message)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <div className="flex space-x-4">
                  {['Normal', 'High', 'Critical'].map((priority) => (
                    <div key={priority} className="flex items-center">
                      <input
                        type="radio"
                        id={priority.toLowerCase()}
                        name="priority"
                        value={priority}
                        checked={smsData.priority === priority}
                        onChange={(e) => setSmsData(prev => ({ ...prev, priority: e.target.value }))}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                      <label htmlFor={priority.toLowerCase()} className="ml-2 text-sm text-gray-900">
                        {priority}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSendSms}
                disabled={sendingSms || !smsData.message.trim()}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingSms ? 'Sending SMS...' : 'Send SMS Notification'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}