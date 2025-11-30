'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface SLAConfig {
  urgent_delivery: number;
  standard_delivery: number;
  pickup_response: number;
  alert_threshold: number;
}

export function SLASettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SLAConfig>({
    urgent_delivery: 15,
    standard_delivery: 30,
    pickup_response: 5,
    alert_threshold: 10
  });

  const [originalConfig, setOriginalConfig] = useState<SLAConfig>({
    urgent_delivery: 15,
    standard_delivery: 30,
    pickup_response: 5,
    alert_threshold: 10
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch hospital SLA config on mount
  useEffect(() => {
    fetchSLAConfig();
  }, []);

  const fetchSLAConfig = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getSLAConfig();
      if (response.success && response.data) {
        const data = response.data as any;
        const fetchedConfig = {
          urgent_delivery: data.urgent_delivery || 15,
          standard_delivery: data.standard_delivery || 30,
          pickup_response: data.pickup_response || 5,
          alert_threshold: data.alert_threshold || 10
        };
        setConfig(fetchedConfig);
        setOriginalConfig(fetchedConfig);
      }
    } catch (error) {
      console.error('Failed to fetch SLA config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.updateSLAConfig(config);
      if (response.success) {
        setOriginalConfig(config);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save SLA settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setConfig(originalConfig);
    setIsEditing(false);
  };

  const updateConfig = (key: keyof SLAConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-gray-600">Loading SLA configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Urgent Delivery
          </label>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="60"
                value={config.urgent_delivery}
                onChange={(e) => updateConfig('urgent_delivery', parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-900">{config.urgent_delivery}</span>
            )}
            <span className="text-sm text-gray-500">minutes</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Standard Delivery
          </label>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="120"
                value={config.standard_delivery}
                onChange={(e) => updateConfig('standard_delivery', parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-900">{config.standard_delivery}</span>
            )}
            <span className="text-sm text-gray-500">minutes</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Pickup Response
          </label>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="30"
                value={config.pickup_response}
                onChange={(e) => updateConfig('pickup_response', parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-900">{config.pickup_response}</span>
            )}
            <span className="text-sm text-gray-500">minutes</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Alert Threshold
          </label>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="60"
                value={config.alert_threshold}
                onChange={(e) => updateConfig('alert_threshold', parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-900">{config.alert_threshold}</span>
            )}
            <span className="text-sm text-gray-500">min before deadline</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        {isEditing ? (
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0c5.523 0 10 4.477 10 10h-4c0-3.314-2.686-6-6-6v4c0 .553-.447 1-1 1s-1-.447-1-1V4c-3.314 0-6 2.686-6 6H4z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Settings</span>
          </button>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Info</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Urgent deliveries must be completed within {config.urgent_delivery} minutes</li>
          <li>• Standard deliveries must be completed within {config.standard_delivery} minutes</li>
          <li>• Pickup responses are expected within {config.pickup_response} minutes</li>
          <li>• Alerts are triggered {config.alert_threshold} minutes before deadlines</li>
        </ul>
      </div>
    </div>
  );
}