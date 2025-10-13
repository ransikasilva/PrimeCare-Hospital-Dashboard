'use client';

interface SLAMetricsProps {
  data?: {
    overall_sla: number;
    sla_target: number;
    critical_alerts: number;
    alerts_change: number;
    average_time: number;
    time_target: number;
    current_delays: number;
    delays_change: number;
    delays_since: string;
  };
  loading?: boolean;
}

export function SLAMetrics({ data, loading }: SLAMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = data || {
    overall_sla: 95.8,
    sla_target: 95,
    critical_alerts: 12,
    alerts_change: 4,
    average_time: 42,
    time_target: 45,
    current_delays: 7,
    delays_change: 2,
    delays_since: '1 hour ago'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Overall SLA */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <p className={`text-2xl font-bold ${metrics.overall_sla >= metrics.sla_target ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.overall_sla}%
              </p>
              <span className="text-sm text-gray-500">
                (Target: {metrics.sla_target}%)
              </span>
            </div>
            <p className="text-gray-600">Overall SLA</p>
          </div>
          <div className={`p-2 rounded-full ${metrics.overall_sla >= metrics.sla_target ? 'bg-green-100' : 'bg-red-100'}`}>
            <svg className={`w-6 h-6 ${metrics.overall_sla >= metrics.sla_target ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-red-600">{metrics.critical_alerts}</p>
              <span className={`text-sm px-2 py-1 rounded-full ${metrics.alerts_change > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {metrics.alerts_change > 0 ? '+' : ''}{metrics.alerts_change} from yesterday
              </span>
            </div>
            <p className="text-gray-600">Critical Alerts</p>
          </div>
          <div className="p-2 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Average Time */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <p className={`text-2xl font-bold ${metrics.average_time <= metrics.time_target ? 'text-green-600' : 'text-orange-600'}`}>
                {metrics.average_time}m
              </p>
              <span className="text-sm text-gray-500">
                (Target: {metrics.time_target}m)
              </span>
            </div>
            <p className="text-gray-600">Average Time</p>
          </div>
          <div className={`p-2 rounded-full ${metrics.average_time <= metrics.time_target ? 'bg-green-100' : 'bg-orange-100'}`}>
            <svg className={`w-6 h-6 ${metrics.average_time <= metrics.time_target ? 'text-green-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Current Delays */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-orange-600">{metrics.current_delays}</p>
              <span className={`text-sm px-2 py-1 rounded-full ${metrics.delays_change > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                {metrics.delays_change > 0 ? '+' : ''}{metrics.delays_change} from {metrics.delays_since}
              </span>
            </div>
            <p className="text-gray-600">Current Delays</p>
          </div>
          <div className="p-2 bg-orange-100 rounded-full">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}