"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api';

interface RiderKMChartProps {
  riderId: string;
  riderName: string;
  hospitalId: string;
  startDate: string;
  endDate: string;
}

export function RiderKMChart({ riderId, riderName, hospitalId, startDate, endDate }: RiderKMChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        // Use the new bulk API endpoint for date range
        const response = await apiClient.getRiderKMRange(hospitalId, startDate, endDate, riderId);

        if (response.success && response.data.daily_data) {
          const data = response.data.daily_data.map((dayData: any) => {
            const date = new Date(dayData.date);
            return {
              date: dayData.date,
              displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              daily_km: dayData.daily_km || 0,
              deliveries: dayData.deliveries_count || 0,
              avg_time: dayData.avg_delivery_time_minutes || 0,
            };
          });
          setChartData(data);
        } else {
          console.warn('No KM data received from API');
          setChartData([]);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    if (riderId && hospitalId && startDate && endDate) {
      fetchChartData();
    }
  }, [riderId, hospitalId, startDate, endDate]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalKM = chartData.reduce((sum, day) => sum + day.daily_km, 0);
  const avgKM = totalKM / chartData.length;
  const maxKM = Math.max(...chartData.map(d => d.daily_km));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {riderName} - KM Performance
            </h3>
            <p className="text-sm text-gray-600">
              Individual rider distance tracking over time
            </p>
          </div>

          {/* Date Range Display */}
          <div className="flex space-x-2 text-sm text-gray-600">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border">
              {startDate} to {endDate}
            </span>
            <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full border">
              {(() => {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
              })()} selected
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalKM.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Total KM</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{avgKM.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Average KM/Day</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{maxKM.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Peak Day KM</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="kmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'KM', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 shadow-lg rounded-lg border">
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-blue-600">
                        <span className="font-medium">KM:</span> {data.daily_km}
                      </p>
                      <p className="text-green-600">
                        <span className="font-medium">Deliveries:</span> {data.deliveries}
                      </p>
                      {data.avg_time > 0 && (
                        <p className="text-purple-600">
                          <span className="font-medium">Avg Time:</span> {data.avg_time.toFixed(1)} min
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="daily_km"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#kmGradient)"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Insights */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <h4 className="font-semibold text-gray-900 mb-2">Performance Insights</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Most Active Day:</span>
            <span className="ml-2 font-medium text-gray-900">
              {chartData.find(d => d.daily_km === maxKM)?.displayDate || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Deliveries:</span>
            <span className="ml-2 font-medium text-gray-900">
              {chartData.reduce((sum, day) => sum + day.deliveries, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}