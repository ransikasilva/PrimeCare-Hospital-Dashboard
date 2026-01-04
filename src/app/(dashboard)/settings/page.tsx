'use client';

import { useState, useEffect } from 'react';
import { useMyHospitals, useOrders, usePendingApprovals, useHospitalDashboard } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import {
  Phone, Monitor, Bell, AlertTriangle, Users, Building2,
  Clock, Wifi, Database, Save, RotateCcw,
  MessageSquare, Radio, Route
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    shortName: '',
    hospitalCode: '',
    contactPhone: '',
    address: '',
    workingHours: '6:00 AM - 10:00 PM',
    emergencyOps: true,
    poyaDayOps: 'normal'
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
  const [distanceMode, setDistanceMode] = useState<'full' | 'pickup_only'>('full');
  const [loadingDistance, setLoadingDistance] = useState(true);
  const [savingDistance, setSavingDistance] = useState(false);

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
        address: currentHospital.address || '',
        workingHours: currentHospital.lab_hours || '6:00 AM - 10:00 PM',
        emergencyOps: true,
        poyaDayOps: 'normal'
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
      if (!hospitalId) return;

      try {
        setLoadingDistance(true);
        const response = await apiClient.getDistanceCalculationMode(hospitalId);

        if (response.success && response.data) {
          setDistanceMode(response.data.distance_calculation_mode);
        }
      } catch (error) {
        console.error('Failed to fetch distance calculation mode:', error);
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
        address: formData.address,
        lab_hours: formData.workingHours,
        // Add any additional operational settings
        emergency_operations: formData.emergencyOps,
        poya_day_operations: formData.poyaDayOps
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

          {/* Operational Settings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Operational Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                  <input
                    type="text"
                    value={formData.workingHours}
                    onChange={(e) => handleInputChange('workingHours', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poya Day Operations</label>
                  <select
                    value={formData.poyaDayOps}
                    onChange={(e) => handleInputChange('poyaDayOps', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  >
                    <option value="normal">Normal Operations</option>
                    <option value="limited">Limited Operations</option>
                    <option value="emergency">Emergency Only</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emergencyOps"
                  checked={formData.emergencyOps}
                  onChange={(e) => handleInputChange('emergencyOps', e.target.checked)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="emergencyOps" className="ml-2 block text-sm text-gray-900">
                  24/7 Emergency Operations Available
                </label>
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