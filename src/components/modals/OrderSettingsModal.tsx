"use client";

import { useState, useEffect } from 'react';
import { X, Settings, Info } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface OrderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: string;
}

export function OrderSettingsModal({ isOpen, onClose, hospitalId }: OrderSettingsModalProps) {
  const [distanceMode, setDistanceMode] = useState<'full' | 'pickup_only'>('full');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && hospitalId) {
      fetchSettings();
    }
  }, [isOpen, hospitalId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/hospitals/${hospitalId}/distance-mode`);
      if (response.data.success) {
        setDistanceMode(response.data.hospital.distance_calculation_mode || 'full');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put(`/hospitals/${hospitalId}/distance-mode`, {
        mode: distanceMode
      });

      if (response.data.success) {
        alert('Settings saved successfully!');
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-900">Order Management Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* Distance Calculation Mode */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Rider Distance Calculation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose how rider travel distance is calculated for payment purposes
                  </p>
                </div>

                {/* Option 1: Full Distance */}
                <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  distanceMode === 'full'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="distanceMode"
                      value="full"
                      checked={distanceMode === 'full'}
                      onChange={(e) => setDistanceMode('full')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Full Distance Tracking
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Calculate distance from rider assignment to final delivery
                      </p>
                      <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-700">
                          <strong>Includes:</strong> Distance to reach first pickup + all pickups + delivery
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Example: If rider is 5km from collection center → 20km total trip = Rider paid for 20km
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Option 2: Pickup to Delivery Only */}
                <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  distanceMode === 'pickup_only'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="distanceMode"
                      value="pickup_only"
                      checked={distanceMode === 'pickup_only'}
                      onChange={(e) => setDistanceMode('pickup_only')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Pickup to Delivery Only
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Calculate distance only from first pickup point to final delivery
                      </p>
                      <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-700">
                          <strong>Excludes:</strong> Distance to reach first pickup location
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Example: If rider is 5km from collection center → 20km total trip = Rider paid for 15km (excludes first 5km)
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Info Box */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>This setting affects rider payment calculations</li>
                      <li>Multi-parcel and handover scenarios follow the same rule</li>
                      <li>Changes apply to new orders only (not retroactive)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
