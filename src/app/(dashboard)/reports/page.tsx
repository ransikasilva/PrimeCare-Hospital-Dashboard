"use client";

import { useState, useEffect } from "react";
import { useMyHospitals } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import { Download, FileText, BarChart3, TrendingUp, DollarSign, Clock, Package, Users, AlertCircle, Calendar } from "lucide-react";

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
            <RiderPerformanceReport data={riderPerformanceReport} />
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
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Payment</h3>
          <p className="text-3xl font-bold text-gray-900">Rs. {data.summary?.total_actual_payment || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total KM</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.total_km || 0} km</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Payment/KM</h3>
          <p className="text-3xl font-bold text-gray-900">Rs. {data.summary?.overall_payment_per_km || 0}</p>
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
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Avg Payment/KM</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.by_collection_center?.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-teal-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.center_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_km} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">Rs. {row.total_payment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">Rs. {row.avg_payment_per_km}</td>
                </tr>
              ))}
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
                <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Avg Payment/KM</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.by_rider?.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-teal-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.rider_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.vehicle_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_deliveries}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_km} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">Rs. {row.total_payment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">Rs. {row.avg_payment_per_km}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// TAT Performance Report Component
function TATPerformanceReport({ data }: { data: any }) {
  const overview = data.overview || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Pickup Response</h3>
          <p className="text-3xl font-bold text-gray-900">{overview.avg_pickup_response_mins || 0} min</p>
          <p className="text-sm text-gray-500 mt-1">Assigned → Picked Up</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Delivery Time</h3>
          <p className="text-3xl font-bold text-gray-900">{overview.avg_delivery_time_mins || 0} min</p>
          <p className="text-sm text-gray-500 mt-1">Picked Up → Delivered</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Total TAT</h3>
          <p className="text-3xl font-bold text-gray-900">{overview.avg_total_tat_mins || 0} min</p>
          <p className="text-sm text-gray-500 mt-1">Created → Delivered</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">SLA Compliance</h3>
          <p className="text-3xl font-bold text-green-600">{overview.sla_compliance_percentage || 0}%</p>
          <p className="text-sm text-gray-500 mt-1">{overview.sla_compliant_orders || 0} / {overview.delivered_orders || 0} orders</p>
        </div>
      </div>

      {/* Handovers */}
      {data.handovers && data.handovers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Handover Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
                <tr>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-teal-800 uppercase tracking-wider">Avg Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.handovers.map((row: any, index: number) => (
                  <tr key={index} className="hover:bg-teal-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.handover_reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.handover_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.completed_handovers}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.avg_handover_time_mins || 0} min</td>
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
function RiderPerformanceReport({ data }: { data: any }) {
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
              {data?.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-teal-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.rider_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.rider_phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.vehicle_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_deliveries}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">{row.successful_deliveries}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.total_km} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.avg_km_per_delivery} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">Rs. {row.total_earnings}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.avg_delivery_time_mins} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
