"use client";

import { useState, useEffect } from "react";
import { useMyHospitals } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import { Download, FileText, BarChart3, TrendingUp, DollarSign, Clock, Package, Users, AlertCircle, Calendar, Edit2 } from "lucide-react";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [selectedReport, setSelectedReport] = useState("transport");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report data states
  const [transportReport, setTransportReport] = useState<any>(null);
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [tatReport, setTATReport] = useState<any>(null);
  const [sampleReport, setSampleReport] = useState<any>(null);
  const [riderPerformanceReport, setRiderPerformanceReport] = useState<any>(null);
  const [hospitalRatePerKm, setHospitalRatePerKm] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get hospital data
  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  const hospitalName = hospitalsData?.data?.hospitals?.[0]?.hospital_name || 'Hospital';

  // Fetch reports based on selected type
  useEffect(() => {
    if (!hospitalId) return;

    const fetchReport = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.append('period', selectedPeriod);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        console.log('Fetching report with params:', {
          period: selectedPeriod,
          startDate,
          endDate,
          params: params.toString()
        });

        let response;
        switch (selectedReport) {
          case 'transport':
            response = await apiClient.getTransportSummary(hospitalId, params.toString());
            setTransportReport(response.data);
            break;
          case 'financial':
            response = await apiClient.getFinancialReport(hospitalId, params.toString());
            setFinancialReport(response.data);
            if (response.data.rate_per_km) {
              setHospitalRatePerKm(response.data.rate_per_km);
            }
            break;
          case 'tat':
            response = await apiClient.getTATReport(hospitalId, params.toString());
            setTATReport(response.data);
            break;
          case 'sample':
            response = await apiClient.getSampleReport(hospitalId, params.toString());
            setSampleReport(response.data);
            break;
          case 'rider':
            response = await apiClient.getRiderPerformanceReport(hospitalId, params.toString());
            setRiderPerformanceReport(response.data);
            // Also fetch rate_per_km for rider performance calculations
            const rateResponse = await apiClient.getFinancialReport(hospitalId, params.toString());
            if (rateResponse.data.rate_per_km) {
              setHospitalRatePerKm(rateResponse.data.rate_per_km);
            }
            break;
        }
      } catch (err: any) {
        console.error('Error fetching report:', err);
        setError(err.message || 'Failed to fetch report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [hospitalId, selectedReport, selectedPeriod, startDate, endDate]);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      let csvContent = '';
      let filename = '';

      // Generate CSV based on selected report
      if (selectedReport === 'transport' && transportReport) {
        csvContent = generateTransportCSV(transportReport);
        filename = `transport-summary-${selectedPeriod}`;
      } else if (selectedReport === 'financial' && financialReport) {
        csvContent = generateFinancialCSV(financialReport);
        filename = `financial-report-${selectedPeriod}`;
      } else if (selectedReport === 'tat' && tatReport) {
        csvContent = generateTATCSV(tatReport);
        filename = `tat-performance-${selectedPeriod}`;
      } else if (selectedReport === 'sample' && sampleReport) {
        csvContent = generateSampleCSV(sampleReport);
        filename = `sample-tracking-${selectedPeriod}`;
      } else if (selectedReport === 'rider' && riderPerformanceReport) {
        csvContent = generateRiderCSV(riderPerformanceReport);
        filename = `rider-performance-${selectedPeriod}`;
      }

      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } else {
      alert('PDF export will be implemented soon');
    }
  };

  const generateTransportCSV = (data: any) => {
    const headers = ['Period', 'Total Orders', 'Successful', 'Cancelled', 'Urgent', 'Avg Distance (km)', 'Total Distance (km)', 'Total Payment (Rs)', 'Avg Delivery Time (min)'];
    const rows = data.summary?.map((row: any) => [
      row.period,
      row.total_orders,
      row.successful_deliveries,
      row.cancelled_orders,
      row.urgent_orders,
      row.avg_distance_km || 0,
      row.total_distance_km || 0,
      row.total_payment || 0,
      row.avg_delivery_time_mins || 0
    ]) || [];
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateFinancialCSV = (data: any) => {
    const headers = ['Collection Center', 'Total Orders', 'Total KM', 'Total Payment (Rs)', 'Avg Payment per KM'];
    const rows = data.by_collection_center?.map((row: any) => [
      row.center_name,
      row.total_orders,
      row.total_km || 0,
      row.total_payment || 0,
      row.avg_payment_per_km || 0
    ]) || [];
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateTATCSV = (data: any) => {
    const overview = data.overview;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Orders', overview?.total_orders || 0],
      ['Picked Up Orders', overview?.picked_up_orders || 0],
      ['Delivered Orders', overview?.delivered_orders || 0],
      ['Avg Pickup Response (min)', overview?.avg_pickup_response_mins || 0],
      ['Avg Delivery Time (min)', overview?.avg_delivery_time_mins || 0],
      ['Avg Total TAT (min)', overview?.avg_total_tat_mins || 0],
      ['SLA Compliance %', overview?.sla_compliance_percentage || 0]
    ];
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateSampleCSV = (data: any) => {
    const headers = ['Sample Type', 'Total Orders', 'Total Quantity', 'Delivered Orders', 'Delivered Quantity'];
    const rows = data.by_sample_type?.map((row: any) => [
      row.sample_type,
      row.total_orders,
      row.total_quantity,
      row.delivered_orders,
      row.delivered_quantity
    ]) || [];
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateRiderCSV = (data: any) => {
    const headers = ['Rider', 'Phone', 'Vehicle', 'Total Deliveries', 'Successful', 'Total KM', 'Avg KM', 'Total Earnings (Rs)', 'Avg Delivery Time (min)'];
    const rows = data?.map((row: any) => [
      row.rider_name,
      row.rider_phone,
      row.vehicle_type,
      row.total_deliveries,
      row.successful_deliveries,
      row.total_km || 0,
      row.avg_km_per_delivery || 0,
      row.total_earnings || 0,
      row.avg_delivery_time_mins || 0
    ]) || [];
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (!hospitalId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hospital data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive performance and financial reports for {hospitalName}</p>
        </div>
        <button
          onClick={() => handleExport('csv')}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setSelectedReport('transport')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === 'transport'
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <FileText className={`w-6 h-6 mb-2 ${selectedReport === 'transport' ? 'text-teal-600' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-sm text-gray-900">Transport Summary</h3>
            <p className="text-xs text-gray-500 mt-1">Daily/Weekly/Monthly</p>
          </button>

          <button
            onClick={() => setSelectedReport('financial')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === 'financial'
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <DollarSign className={`w-6 h-6 mb-2 ${selectedReport === 'financial' ? 'text-teal-600' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-sm text-gray-900">Financial Report</h3>
            <p className="text-xs text-gray-500 mt-1">KM & Payment Analysis</p>
          </button>

          <button
            onClick={() => setSelectedReport('tat')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === 'tat'
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <Clock className={`w-6 h-6 mb-2 ${selectedReport === 'tat' ? 'text-teal-600' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-sm text-gray-900">TAT Performance</h3>
            <p className="text-xs text-gray-500 mt-1">Turnaround Time</p>
          </button>

          <button
            onClick={() => setSelectedReport('sample')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === 'sample'
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <Package className={`w-6 h-6 mb-2 ${selectedReport === 'sample' ? 'text-teal-600' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-sm text-gray-900">Sample Tracking</h3>
            <p className="text-xs text-gray-500 mt-1">By Type & Center</p>
          </button>

          <button
            onClick={() => setSelectedReport('rider')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === 'rider'
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <Users className={`w-6 h-6 mb-2 ${selectedReport === 'rider' ? 'text-teal-600' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-sm text-gray-900">Rider Performance</h3>
            <p className="text-xs text-gray-500 mt-1">Deliveries & Efficiency</p>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-gray-200">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const newStartDate = e.target.value;
                console.log('Start Date changed to:', newStartDate);
                setStartDate(newStartDate);

                // If end date is empty, set it to today
                if (!endDate && newStartDate) {
                  const today = new Date().toISOString().split('T')[0];
                  console.log('Auto-setting End Date to today:', today);
                  setEndDate(today);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                console.log('End Date changed to:', e.target.value);
                setEndDate(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Clear Dates
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Error Loading Report</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      )}

      {/* Report Content */}
      {!loading && !error && (
        <>
          {selectedReport === 'transport' && transportReport && (
            <TransportSummaryReport data={transportReport} period={selectedPeriod} />
          )}
          {selectedReport === 'financial' && financialReport && (
            <FinancialReport data={financialReport} />
          )}
          {selectedReport === 'tat' && tatReport && (
            <TATPerformanceReport data={tatReport} />
          )}
          {selectedReport === 'sample' && sampleReport && (
            <SampleTrackingReport data={sampleReport} />
          )}
          {selectedReport === 'rider' && riderPerformanceReport && (
            <RiderPerformanceReport data={riderPerformanceReport} ratePerKm={hospitalRatePerKm} />
          )}
        </>
      )}
    </div>
  );
}

// Transport Summary Report Component
function TransportSummaryReport({ data, period }: { data: any; period: string }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900">{data.totals?.total_orders || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{data.totals?.successful_deliveries || 0} delivered</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Distance</h3>
          <p className="text-3xl font-bold text-gray-900">{data.totals?.total_distance_km || 0} km</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Cancelled Orders</h3>
          <p className="text-3xl font-bold text-red-600">{data.totals?.cancelled_orders || 0}</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{period.charAt(0).toUpperCase() + period.slice(1)} Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Successful</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Cancelled</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Urgent</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Avg Distance</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total Distance</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Avg Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.summary?.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-teal-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-center font-medium text-gray-900">
                    {new Date(row.period).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-center font-semibold text-gray-900">{row.total_orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-center">
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">{row.successful_deliveries}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-center">
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold">{row.cancelled_orders}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-center">
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">{row.urgent_orders}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-center font-medium text-gray-900">{row.avg_distance_km || 0} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-center font-medium text-gray-900">{row.total_distance_km || 0} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-center font-medium text-gray-900">{row.avg_delivery_time_mins || 0} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Financial Report Component
function FinancialReport({ data }: { data: any }) {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [newRate, setNewRate] = useState(data.rate_per_km || 50);
  const [currentRate, setCurrentRate] = useState(data.rate_per_km || 50);
  const [saving, setSaving] = useState(false);

  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;

  const handleSaveRate = async () => {
    if (!hospitalId) return;

    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals/${hospitalId}/rate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ rate_per_km: newRate })
      });

      const result = await response.json();

      if (result.success) {
        setCurrentRate(newRate);
        setIsEditingRate(false);
        alert('✅ Rate per KM updated successfully!');
      } else {
        alert('❌ Failed to update rate: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating rate:', error);
      alert('❌ Error updating rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
          <button
            onClick={() => setIsEditingRate(true)}
            className="absolute top-4 right-4 p-1 hover:bg-teal-50 rounded transition-colors"
            title="Edit rate"
          >
            <Edit2 className="w-4 h-4 text-teal-600" />
          </button>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Rate per KM</h3>
          <p className="text-3xl font-bold text-teal-600">Rs. {currentRate}</p>
          <p className="text-xs text-gray-500 mt-1">Hospital rate</p>

          {/* Edit Modal */}
          {isEditingRate && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
              onClick={() => {
                setIsEditingRate(false);
                setNewRate(currentRate);
              }}
            >
              <div
                className="bg-white rounded-lg p-6 w-96 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Rate per KM</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (Rs. per KM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRate}
                    onChange={(e) => setNewRate(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveRate}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingRate(false);
                      setNewRate(currentRate);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Payment</h3>
          <p className="text-3xl font-bold text-gray-900">
            Rs. {((parseFloat(data.summary?.total_km || 0) * currentRate).toFixed(2))}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total KM</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.total_km || 0} km</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Completed Orders</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.completed_orders || 0}</p>
        </div>
      </div>

      {/* By Collection Center */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Collection Center</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Collection Center</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total KM</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total Payment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.by_collection_center?.map((row: any, index: number) => {
                const calculatedPayment = (parseFloat(row.total_km) * currentRate).toFixed(2);
                return (
                  <tr key={index} className="hover:bg-teal-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.center_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_km} km</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">Rs. {calculatedPayment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Rider */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Rider</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Rider</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Deliveries</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total KM</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total Payment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.by_rider?.map((row: any, index: number) => {
                const calculatedPayment = (parseFloat(row.total_km) * currentRate).toFixed(2);
                return (
                  <tr key={index} className="hover:bg-teal-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.rider_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.vehicle_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_deliveries}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_km} km</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">Rs. {calculatedPayment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// TAT Performance Report Component
function TATPerformanceReport({ data }: { data: any }) {
  const summary = data?.summary || {};
  const breakdown = data?.breakdown || {};
  const extremes = data?.extremes || {};

  // Determine status based on performance
  const isOnTime = parseFloat(summary.on_time_rate || 0) >= 90;

  return (
    <div className="space-y-6">
      {/* Overall TAT Performance Box */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Overall TAT Performance
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Average TAT:</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{summary.average_tat || 0} minutes</span>
              {summary.average_tat <= summary.target_tat && (
                <span className="text-green-600 font-bold text-xl">✓</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Target TAT:</span>
            <span className="text-2xl font-bold text-gray-900">{summary.target_tat || 45} minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">On-Time Rate:</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${isOnTime ? 'text-green-600' : 'text-orange-600'}`}>
                {summary.on_time_rate || 0}%
              </span>
              {isOnTime && <span className="text-green-600 font-bold text-xl">✓</span>}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Total Deliveries:</span>
            <span className="text-2xl font-bold text-gray-900">{summary.total_deliveries || 0}</span>
          </div>
        </div>
      </div>

      {/* TAT Breakdown Box */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          TAT Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Urgent Samples:</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${breakdown.urgent?.average_tat <= breakdown.urgent?.target ? 'text-green-600' : 'text-orange-600'}`}>
                {breakdown.urgent?.average_tat || 0} min
              </span>
              {breakdown.urgent?.average_tat <= breakdown.urgent?.target && (
                <span className="text-green-600 font-bold text-xl">✓</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Standard Samples:</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${breakdown.standard?.average_tat <= breakdown.standard?.target ? 'text-green-600' : 'text-orange-600'}`}>
                {breakdown.standard?.average_tat || 0} min
              </span>
              {breakdown.standard?.average_tat <= breakdown.standard?.target && (
                <span className="text-green-600 font-bold text-xl">✓</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Delayed ({'>'}60 min):</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${parseFloat(breakdown.delayed?.percentage || 0) > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                {breakdown.delayed?.count || 0} ({breakdown.delayed?.percentage || 0}%)
              </span>
              {parseFloat(breakdown.delayed?.percentage || 0) > 5 && (
                <span className="text-red-600 font-bold text-xl">!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Extremes */}
      {(extremes.fastest || extremes.slowest) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {extremes.fastest && (
            <div className="bg-green-50 rounded-xl shadow-sm border-2 border-green-200 p-6">
              <h4 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Fastest Delivery
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Order:</span> {extremes.fastest.order_number}
                </p>
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Center:</span> {extremes.fastest.center_name}
                </p>
                <p className="text-3xl font-bold text-green-700">{extremes.fastest.tat_minutes} minutes</p>
              </div>
            </div>
          )}

          {extremes.slowest && (
            <div className="bg-orange-50 rounded-xl shadow-sm border-2 border-orange-200 p-6">
              <h4 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Slowest Delivery
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">Order:</span> {extremes.slowest.order_number}
                </p>
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">Center:</span> {extremes.slowest.center_name}
                </p>
                <p className="text-3xl font-bold text-orange-700">{extremes.slowest.tat_minutes} minutes</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Orders Table */}
      {data.orders && data.orders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed TAT Report</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-teal-800 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-teal-800 uppercase tracking-wider">Sample Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-teal-800 uppercase tracking-wider">Center</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-teal-800 uppercase tracking-wider">Rider</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Urgency</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">TAT (min)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.orders.map((order: any, index: number) => (
                  <tr key={index} className="hover:bg-teal-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.sample_type || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.center_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.rider_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.urgency === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`font-bold ${
                        order.tat_minutes <= (order.urgency === 'urgent' ? 30 : 60)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {order.tat_minutes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Sample Tracking Report Component
function SampleTrackingReport({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.total_orders || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Samples</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.total_samples || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Quantity</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.total_sample_quantity || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Delivered Quantity</h3>
          <p className="text-3xl font-bold text-green-600">{data.summary?.delivered_sample_quantity || 0}</p>
        </div>
      </div>

      {/* By Sample Type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">By Sample Type</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Sample Type</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total Quantity</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Delivered Orders</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Delivered Quantity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.by_sample_type?.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-teal-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.sample_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">{row.delivered_orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">{row.delivered_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Collection Center */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">By Collection Center</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Collection Center</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total Samples</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total Quantity</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Delivered Samples</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.by_collection_center?.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-teal-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.center_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_samples}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_sample_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">{row.delivered_samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Rider Performance Report Component
function RiderPerformanceReport({ data, ratePerKm }: { data: any; ratePerKm: number }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rider Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Rider</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Deliveries</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Successful</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Total KM</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Avg KM</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Earnings</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Avg Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.map((row: any, index: number) => {
                const totalKm = parseFloat(row.total_km) || 0;
                const calculatedEarnings = (totalKm * ratePerKm).toFixed(2);
                return (
                  <tr key={index} className="hover:bg-teal-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.rider_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.rider_phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.vehicle_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_deliveries}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">{row.successful_deliveries}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{totalKm} km</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.avg_km_per_delivery} km</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">Rs. {calculatedEarnings}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.avg_delivery_time_mins} min</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
