'use client';

import { useState, useEffect } from 'react';
import { SLAMetrics } from '@/components/SLAMetrics';
import { SLAChart } from '@/components/SLAChart';
import { LiveAlerts } from '@/components/LiveAlerts';
import { SLASettings } from '@/components/SLASettings';
import { useSLAMetrics, useSLAPerformance, useSLAAlerts } from '@/hooks/useApi';

type FilterType = 'Today' | 'Last 7 days' | 'Last 30 days';
type AlertFilter = 'All' | 'Critical' | 'Warning' | 'Info';

export default function OrderManagementPage() {
  const [timeFilter, setTimeFilter] = useState<FilterType>('Today');
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('All');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: slaData, loading, refetch } = useSLAMetrics(timeFilter);
  const { data: alertsData } = useSLAAlerts(timeFilter);
  const { data: chartData } = useSLAPerformance(timeFilter);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetch();
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleExportData = async () => {
    try {
      // Use current data from hooks for export
      const csvData = generateCSVReport(slaData?.data, alertsData?.data, chartData?.data);
      downloadCSV(csvData, `sla-report-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      alert('Failed to export data');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
          <p className="text-gray-600">SLA compliance monitoring and order performance tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value as FilterType)}
            className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Today">Today</option>
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-md ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <SLAMetrics data={slaData?.data as any} loading={loading} />

      {/* SLA Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">SLA Performance (24 Hours)</h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <SLAChart data={chartData?.data as any} />
      </div>

      {/* Live Alerts and SLA Settings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Live Alerts</h2>
            <select 
              value={alertFilter} 
              onChange={(e) => setAlertFilter(e.target.value as AlertFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="All">All</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </select>
          </div>
          <LiveAlerts data={alertsData?.data as any} filter={alertFilter} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SLA Configuration</h2>
          <SLASettings />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleExportData}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Data</span>
        </button>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

// Utility functions
function generateCSVReport(slaData: any, alertsData: any, chartData: any): string {
  const timestamp = new Date().toISOString();
  const csvSections = [];
  
  // SLA Summary Section
  csvSections.push('SLA COMPLIANCE SUMMARY');
  csvSections.push('Metric,Value,Target,Status');
  if (slaData) {
    csvSections.push(`Overall SLA,${slaData.overall_sla}%,${slaData.sla_target}%,${slaData.overall_sla >= slaData.sla_target ? 'PASS' : 'FAIL'}`);
    csvSections.push(`Critical Alerts,${slaData.critical_alerts},-,${slaData.critical_alerts > 0 ? 'ATTENTION' : 'OK'}`);
    csvSections.push(`Average Time,${slaData.average_time}m,${slaData.time_target}m,${slaData.average_time <= slaData.time_target ? 'PASS' : 'FAIL'}`);
    csvSections.push(`Current Delays,${slaData.current_delays},-,${slaData.current_delays > 0 ? 'ATTENTION' : 'OK'}`);
  }
  
  csvSections.push(''); // Empty line
  
  // Alerts Section
  csvSections.push('ACTIVE ALERTS');
  csvSections.push('Order ID,Priority,Title,Message,Timestamp');
  if (alertsData && alertsData.length > 0) {
    alertsData.forEach((alert: any) => {
      csvSections.push(`${alert.order_id},${alert.type},${alert.title},"${alert.message}",${alert.timestamp}`);
    });
  } else {
    csvSections.push('No active alerts,Info,All systems operational,-,-');
  }
  
  csvSections.push(''); // Empty line
  
  // Hourly Performance Section
  csvSections.push('HOURLY SLA PERFORMANCE');
  csvSections.push('Hour,SLA Performance %,Target %,Status');
  if (chartData && chartData.length > 0) {
    chartData.forEach((hour: any) => {
      csvSections.push(`${hour.time},${hour.sla_percentage}%,${hour.target}%,${hour.sla_percentage >= hour.target ? 'PASS' : 'FAIL'}`);
    });
  }
  
  csvSections.push(''); // Empty line
  csvSections.push(`Report Generated: ${timestamp}`);
  csvSections.push('Hospital Order Management Report');
  
  return csvSections.join('\n');
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}