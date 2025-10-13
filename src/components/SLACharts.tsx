interface SLAChartsProps {
  period?: string;
}

export function SLACharts({ period = "Today" }: SLAChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Performance</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">Performance chart will appear here</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Distribution</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <p className="text-gray-500">Distribution chart will appear here</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly KM Reports</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total KM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deliveries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg KM/Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Kamal Silva
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  456 km
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  89
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  5.1 km
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Rs. 22,800
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Priya Fernando
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  387 km
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  76
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  5.1 km
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Rs. 19,350
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Nimal Perera
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  289 km
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  67
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  4.3 km
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Rs. 14,450
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}