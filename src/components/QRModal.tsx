"use client";

import { useState, useEffect } from "react";
import { X, Download, RefreshCw, QrCode, AlertCircle, CheckCircle2, Copy, Clock, MapPin, User, Truck } from "lucide-react";
import { apiClient } from "@/lib/api";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function QRModal({ isOpen, onClose, order }: QRModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [chainOfCustody, setChainOfCustody] = useState<any[]>([]);
  const [loadingChain, setLoadingChain] = useState(false);

  const generateDeliveryQR = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Map only essential delivery fields (features are optional)
      const orderData: any = {
        order_id: order.id,
        center_id: order.center_id,
        hospital_id: order.hospital_id,
        rider_id: order.rider_id || null, // Optional - may not be assigned yet
        delivery_location: 'Main Lab Reception'
      };

      // Add optional feature fields only if available
      if (order.sample_type) {
        orderData.sample_type = order.sample_type;
      }
      if (order.urgency) {
        orderData.urgency = order.urgency;
      }
      
      // Check for missing essential fields only
      if (!orderData.order_id || !orderData.center_id || !orderData.hospital_id) {
        console.error('Missing essential delivery fields:', orderData);
        setError(`Missing essential fields: ${!orderData.order_id ? 'order_id ' : ''}${!orderData.center_id ? 'center_id ' : ''}${!orderData.hospital_id ? 'hospital_id' : ''}`);
        setLoading(false);
        return;
      }

      const response = await apiClient.generateDeliveryQR(orderData);

      if (response.success) {
        setQrCodeData(response.data);
        setSuccess("Delivery QR code generated successfully!");
      } else {
        setError("Failed to generate QR code");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const fetchChainOfCustody = async () => {
    if (!order?.id) {
      console.log('No order ID found, cannot fetch chain of custody');
      return;
    }
    
    setLoadingChain(true);
    try {
      // First get all QR codes for this order
      const qrResponse = await apiClient.getOrderQRCodes(order.id);
      console.log('QR codes for order:', qrResponse);
      
      if (qrResponse.success && qrResponse.data) {
        const qrCodes = (qrResponse.data as any)?.qr_codes || [];
        console.log('Found QR codes:', qrCodes);
        
        if (qrCodes.length === 0) {
          console.log('No QR codes found for this order');
          setChainOfCustody([]);
          return;
        }
        
        let allChainEvents: any[] = [];
        
        // Fetch chain of custody for each QR code
        for (const qr of qrCodes) {
          try {
            const chainResponse = await apiClient.getChainOfCustody(qr.qr_id);
            if (chainResponse.success && chainResponse.data) {
              const chainData = (chainResponse.data as any)?.chain_of_custody || 
                               (chainResponse.data as any)?.data?.chain_of_custody || 
                               [];
              // Add QR info to each event
              const eventsWithQR = chainData.map((event: any) => ({
                ...event,
                qr_type: qr.qr_type,
                qr_id: qr.qr_id
              }));
              allChainEvents = [...allChainEvents, ...eventsWithQR];
            }
          } catch (err) {
            console.error(`Failed to fetch chain for QR ${qr.qr_id}:`, err);
          }
        }
        
        // Sort all events by timestamp
        allChainEvents.sort((a, b) => new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime());
        console.log('All chain events:', allChainEvents);
        // Debug: Log each event's scanner data
        allChainEvents.forEach((event, index) => {
          console.log(`Event ${index}:`, {
            scanner_name: event.scanner_name,
            scanner_phone: event.scanner_phone,
            scanner_user_type: event.scanner_user_type
          });
        });
        setChainOfCustody(allChainEvents);
      }
    } catch (err) {
      console.error('Failed to fetch chain of custody:', err);
    } finally {
      setLoadingChain(false);
    }
  };

  const downloadQR = () => {
    if (qrCodeData?.qr_image) {
      const link = document.createElement('a');
      link.href = qrCodeData.qr_image;
      link.download = `delivery-qr-${order.order_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyQRData = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(JSON.stringify(qrCodeData, null, 2));
      setSuccess("QR data copied to clipboard!");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setQrCodeData(null);
    setError("");
    setSuccess("");
    setChainOfCustody([]);
    onClose();
  };

  // Fetch chain of custody when modal opens
  useEffect(() => {
    if (isOpen && order) {
      fetchChainOfCustody();
    }
  }, [isOpen, order]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Blurred background */}
      <div className="absolute inset-0 backdrop-blur-md"></div>
      
      {/* Modal content - wider and better sized */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Delivery QR Code & Chain of Custody</h3>
            <p className="text-sm text-gray-600 mt-1">
              Order #{order.order_number} • {order.sample_type} • {order.center_name}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Two column layout */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - QR Generation */}
            <div className="space-y-6">
              {/* Order Details */}
              <div className="bg-teal-50 rounded-xl p-4">
                <h4 className="font-semibold text-teal-900 mb-3">Order Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-teal-600 font-medium">Priority:</span>
                    <div className={`inline-block ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      order.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                      order.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
                      'bg-teal-100 text-teal-800'
                    }`}>
                      {order.urgency || 'routine'}
                    </div>
                  </div>
                  <div>
                    <span className="text-teal-600 font-medium">Status:</span>
                    <p className="text-teal-900 text-xs mt-1">{order.status}</p>
                  </div>
                  <div>
                    <span className="text-teal-600 font-medium">Rider:</span>
                    <p className="text-teal-900 text-xs mt-1">{order.rider_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="text-teal-600 font-medium">Sample:</span>
                    <p className="text-teal-900 text-xs mt-1">{order.sample_type}</p>
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              {/* QR Code Display */}
              {qrCodeData ? (
                <div className="space-y-4">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
                    <img 
                      src={qrCodeData.qr_image} 
                      alt="Delivery QR Code"
                      className="mx-auto mb-4 w-56 h-56 border border-gray-200 rounded-lg"
                    />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        QR ID: {qrCodeData.qr_id}
                      </p>
                      <p className="text-xs text-gray-600">
                        Expires: {new Date(qrCodeData.expires_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        Type: {qrCodeData.qr_type}
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h5 className="font-semibold text-amber-900 mb-2">Instructions:</h5>
                    <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                      <li>Show this QR code to the rider when they arrive</li>
                      <li>The rider will scan this code to confirm delivery</li>
                      <li>The order status will automatically update to "Delivered"</li>
                      <li>QR code expires in 24 hours for security</li>
                    </ol>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={downloadQR}
                      className="flex items-center justify-center space-x-2 bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={copyQRData}
                      className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Data</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Generate Delivery QR Code</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Generate a QR code for the rider to scan when delivering samples to your hospital.
                    </p>
                    <button
                      onClick={generateDeliveryQR}
                      disabled={loading}
                      className="inline-flex items-center space-x-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <QrCode className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Generating...' : 'Generate QR Code'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Chain of Custody */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-600" />
                  Chain of Custody
                </h4>

                {loadingChain ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                  </div>
                ) : chainOfCustody.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No custody events recorded yet</p>
                    <p className="text-sm text-gray-400 mt-1">Events will appear here as the order progresses</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {chainOfCustody.map((event, index) => (
                      <div key={event.scan_id || index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            event.scan_successful ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <h5 className="font-semibold text-gray-900 text-sm">
                                  {event.scan_type === 'pickup_confirm' ? 'Pickup Confirmed' :
                                   event.scan_type === 'delivery_confirm' ? 'Delivery Confirmed' :
                                   event.scan_type === 'handover_confirm' ? 'Handover Confirmed' :
                                   event.scan_type}
                                </h5>
                                {event.qr_type && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    event.qr_type === 'pickup' ? 'bg-teal-100 text-teal-800' :
                                    event.qr_type === 'delivery' ? 'bg-green-100 text-green-800' :
                                    event.qr_type === 'handover' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {event.qr_type} QR
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(event.scanned_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                <span>
                                  {event.scanner_name || event.scanner_user_type || 'Scanner'}
                                  {event.scanner_phone && ` (${event.scanner_phone})`}
                                </span>
                              </div>
                              {event.scan_location && (
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>{event.scan_location}</span>
                                </div>
                              )}
                              {event.scan_notes && (
                                <p className="text-xs text-gray-500 italic">{event.scan_notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Timeline */}
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Order Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Created:</span>
                    <span className="text-green-900">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  {order.assigned_at && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Assigned:</span>
                      <span className="text-green-900">{new Date(order.assigned_at).toLocaleString()}</span>
                    </div>
                  )}
                  {order.picked_up_at && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Picked Up:</span>
                      <span className="text-green-900">{new Date(order.picked_up_at).toLocaleString()}</span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Delivered:</span>
                      <span className="text-green-900">{new Date(order.delivered_at).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-green-700">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'picked_up' ? 'bg-teal-100 text-teal-800' :
                      order.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          {qrCodeData && (
            <button
              onClick={() => {
                setQrCodeData(null);
                setError("");
                setSuccess("");
              }}
              className="px-4 py-2 text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200 transition-colors"
            >
              Generate New
            </button>
          )}
        </div>
      </div>
    </div>
  );
}