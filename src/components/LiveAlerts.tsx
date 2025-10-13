'use client';

interface Alert {
  id: string;
  order_id?: string;
  type: 'Critical' | 'Warning' | 'Info';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface LiveAlertsProps {
  data?: Alert[];
  filter: 'All' | 'Critical' | 'Warning' | 'Info';
}

export function LiveAlerts({ data, filter }: LiveAlertsProps) {
  const defaultAlerts: Alert[] = [
    {
      id: '1',
      order_id: 'ORD-2024-001',
      type: 'Critical',
      title: 'Delayed delivery',
      message: 'Sample pickup delayed by 15 minutes',
      timestamp: '10:45 AM',
      priority: 'high'
    },
    {
      id: '2',
      order_id: 'ORD-2024-002',
      type: 'Warning',
      title: 'Near-miss delivery time',
      message: 'Delivery approaching deadline',
      timestamp: '10:30 AM',
      priority: 'medium'
    },
    {
      id: '3',
      order_id: 'ORD-2024-003',
      type: 'Info',
      title: 'New order received',
      message: 'Emergency sample collection required',
      timestamp: '10:15 AM',
      priority: 'low'
    }
  ];

  // Ensure data is an array
  const alerts = Array.isArray(data) ? data : defaultAlerts;
  const filteredAlerts = filter === 'All' ? alerts : alerts.filter(alert => alert.type === filter);

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'Critical':
        return {
          container: 'border-l-4 border-red-500 bg-red-50',
          icon: 'text-red-500',
          badge: 'bg-red-100 text-red-800'
        };
      case 'Warning':
        return {
          container: 'border-l-4 border-orange-500 bg-orange-50',
          icon: 'text-orange-500',
          badge: 'bg-orange-100 text-orange-800'
        };
      case 'Info':
        return {
          container: 'border-l-4 border-blue-500 bg-blue-50',
          icon: 'text-blue-500',
          badge: 'bg-blue-100 text-blue-800'
        };
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'Critical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'Warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No {filter === 'All' ? '' : filter.toLowerCase()} alerts at this time</p>
        </div>
      ) : (
        filteredAlerts.map((alert) => {
          const styles = getAlertStyles(alert.type);
          return (
            <div key={alert.id} className={`p-4 rounded-lg ${styles.container}`}>
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.badge}`}>
                        {alert.type}
                      </span>
                      <span className="text-xs text-gray-500">{alert.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                  {alert.order_id && (
                    <p className="text-xs text-gray-600">Order: {alert.order_id}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      
      {filteredAlerts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Showing {filteredAlerts.length} {filter === 'All' ? '' : filter.toLowerCase()} alert{filteredAlerts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}