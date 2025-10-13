'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SLAChartProps {
  data?: Array<{
    time: string;
    sla_percentage: number;
    target: number;
  }>;
}

export function SLAChart({ data }: SLAChartProps) {
  // Default 24-hour data showing consistent performance around 95-100%
  const defaultData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i.toString().padStart(2, '0')}:00`,
    sla_percentage: Math.random() * 5 + 95, // 95-100% range
    target: 95
  }));

  // Ensure data is an array
  const chartData = Array.isArray(data) ? data : defaultData;

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            domain={[90, 100]}
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`, 
              name === 'sla_percentage' ? 'SLA Performance' : 'Target'
            ]}
            labelFormatter={(label) => `Time: ${label}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="sla_percentage" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="#ef4444" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">SLA Performance</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span className="text-sm text-gray-600">Target (95%)</span>
        </div>
      </div>
    </div>
  );
}