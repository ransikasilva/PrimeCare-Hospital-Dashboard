"use client";

import { useState } from "react";
import { useChainOfCustody } from "@/hooks/useApi";

export function AuditViewer() {
  const [selectedQrId, setSelectedQrId] = useState<string>("");
  const { data: auditResponse, loading, error } = useChainOfCustody(selectedQrId);
  
  // Extract chain of custody data
  const auditLogs = auditResponse?.data?.chain_of_custody || [];
  
  // Demo data fallback when no QR ID is selected or API fails
  const demoLogs = [
    {
      scan_id: "AUD-001",
      scan_type: "pickup_confirm",
      scanned_at: "2024-01-26 10:30:45",
      scanner_phone: "+94771234567",
      scanner_user_type: "rider",
      scan_location: "HealthGuard Labs",
      scan_successful: true,
      scan_notes: "Pickup QR scanned successfully",
    },
    {
      scan_id: "AUD-002", 
      scan_type: "delivery_confirm",
      scanned_at: "2024-01-26 11:15:22",
      scanner_phone: "+94112345678",
      scanner_user_type: "hospital",
      scan_location: "General Hospital Colombo",
      scan_successful: true,
      scan_notes: "Delivery QR verified and samples received",
    },
    {
      scan_id: "AUD-003",
      scan_type: "pickup_confirm", 
      scanned_at: "2024-01-26 09:45:10",
      scanner_phone: "+94777654321",
      scanner_user_type: "rider",
      scan_location: "MediCare Diagnostics",
      scan_successful: false,
      scan_notes: "Invalid QR code - security hash mismatch",
    },
    {
      scan_id: "AUD-004",
      scan_type: "handover_confirm",
      scanned_at: "2024-01-26 12:20:33", 
      scanner_phone: "+94771111111",
      scanner_user_type: "rider",
      scan_location: "En Route",
      scan_successful: true,
      scan_notes: "Order handed over to another rider",
    },
  ];

  const displayLogs = auditLogs.length > 0 ? auditLogs : demoLogs;

  const getStatusColor = (successful: boolean) => {
    return successful 
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getActionIcon = (scanType: string) => {
    if (scanType.includes("pickup")) return "📦";
    if (scanType.includes("delivery")) return "🏥";
    if (scanType.includes("handover")) return "🔄";
    return "📋";
  };

  const formatScanType = (scanType: string) => {
    switch (scanType) {
      case "pickup_confirm": return "QR Pickup Scan";
      case "delivery_confirm": return "QR Delivery Scan";
      case "handover_confirm": return "QR Handover Scan";
      case "multi_delivery_confirm": return "QR Multi-Delivery Scan";
      default: return scanType;
    }
  };

  const formatUserType = (userType: string) => {
    switch (userType) {
      case "rider": return "Rider";
      case "hospital": return "Hospital Staff";
      case "collection_center": return "Collection Center";
      case "operations": return "Operations";
      default: return userType;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Chain of Custody Audit Trail</h3>
        <p className="text-sm text-gray-600">Complete QR code scan history and compliance logs</p>
        {error && (
          <p className="text-sm text-red-600 mt-1">Unable to load audit data. Using demo data.</p>
        )}
        
        {/* QR ID Input */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Enter QR ID to view chain of custody..."
            value={selectedQrId}
            onChange={(e) => setSelectedQrId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scan ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No audit logs found
                </td>
              </tr>
            ) : (
              displayLogs.map((log: any) => (
                <tr key={log.scan_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.scan_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">{getActionIcon(log.scan_type)}</span>
                      <span className="text-sm text-gray-900">{formatScanType(log.scan_type)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.scanned_at}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.scanner_phone} ({formatUserType(log.scanner_user_type)})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.scan_location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.scan_successful)}`}>
                      {log.scan_successful ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.scan_notes}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}