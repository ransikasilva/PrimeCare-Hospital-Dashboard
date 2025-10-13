"use client";

import { useState } from "react";
import { useQRScanner } from "@/hooks/useApi";
import { QrCode, CheckCircle, XCircle, Camera, AlertCircle } from "lucide-react";

export function QRScanner() {
  const [qrData, setQrData] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const { scanQR, loading, error } = useQRScanner();

  const handleScan = async () => {
    if (!qrData.trim()) {
      alert("Please enter QR code data");
      return;
    }

    try {
      const result = await scanQR(qrData, 'delivery_confirm', 'Hospital Reception');
      
      if (result.success) {
        setScanResult({
          success: true,
          message: "Delivery confirmed successfully!",
          data: result.data
        });
        setQrData(""); // Clear input after successful scan
      } else {
        setScanResult({
          success: false,
          message: result.error || "Scan failed",
          data: null
        });
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || "Failed to scan QR code",
        data: null
      });
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQrData(e.target.value);
    // Clear previous results when typing
    if (scanResult) {
      setScanResult(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <QrCode className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">QR Scanner</h3>
            <p className="text-sm text-gray-600">Scan delivery QR codes to confirm sample receipt</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* QR Data Input */}
        <div className="mb-6">
          <label htmlFor="qr-data" className="block text-sm font-medium text-gray-700 mb-2">
            QR Code Data
          </label>
          <textarea
            id="qr-data"
            value={qrData}
            onChange={handleManualInput}
            placeholder="Paste QR code data here or scan with camera..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Scan Actions */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={handleScan}
            disabled={loading || !qrData.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Delivery</span>
              </>
            )}
          </button>

          <button
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
            onClick={() => {
              // In a real app, this would open camera scanner
              alert("Camera scanner would open here. For now, paste QR data manually.");
            }}
          >
            <Camera className="w-4 h-4" />
            <span>Use Camera</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">Scan Failed</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className={`p-4 border rounded-md ${
            scanResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {scanResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`font-medium ${
                scanResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {scanResult.success ? 'Delivery Confirmed' : 'Scan Failed'}
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              scanResult.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {scanResult.message}
            </p>
            
            {scanResult.success && scanResult.data && (
              <div className="mt-3 p-3 bg-white rounded border">
                <h4 className="font-medium text-gray-900 mb-2">Scan Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Scan ID:</span> {scanResult.data.scan_id}</p>
                  <p><span className="font-medium">QR Type:</span> {scanResult.data.qr_type}</p>
                  <p><span className="font-medium">Scanned At:</span> {scanResult.data.scanned_at}</p>
                  {scanResult.data.order_info && (
                    <>
                      <p><span className="font-medium">Order ID:</span> {scanResult.data.order_info.order_id}</p>
                      <p><span className="font-medium">Sample Type:</span> {scanResult.data.order_info.sample_type}</p>
                      <p><span className="font-medium">Urgency:</span> {scanResult.data.order_info.urgency}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Ask the rider to show their delivery QR code</li>
            <li>• Copy and paste the QR code data into the text area above</li>
            <li>• Click "Confirm Delivery" to complete the handover</li>
            <li>• The system will log this scan for audit purposes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}