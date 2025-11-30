"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Phone, Mail, MessageCircle, Clock, XCircle } from "lucide-react";

export default function ServiceSuspendedPage() {
  const router = useRouter();
  const [networkName, setNetworkName] = useState<string>("");

  useEffect(() => {
    // Get network name from session storage or URL params
    const suspensionData = sessionStorage.getItem('suspension_data');
    if (suspensionData) {
      try {
        const data = JSON.parse(suspensionData);
        setNetworkName(data.network_name || "");
      } catch (e) {
        console.error('Error parsing suspension data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear all session data
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)' }}>
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          {/* Header - Red Alert */}
          <div
            className="p-8 text-center"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
            }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Service Suspended</h1>
            <p className="text-white/90 text-lg">Immediate Action Required</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Main Message */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '2px solid #fecaca'
              }}
            >
              <div className="flex items-start gap-4">
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-red-900 mb-2">
                    {networkName ? `${networkName}'s Services Have Been Suspended` : 'Your Services Have Been Suspended'}
                  </h2>
                  <p className="text-red-800 text-base leading-relaxed">
                    Your TransFleet/PrimeCare services have been temporarily suspended due to non-payment or administrative reasons.
                    All hospital dashboard features are currently unavailable.
                  </p>
                </div>
              </div>
            </div>

            {/* Suspended Services */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid #fde68a'
              }}
            >
              <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Suspended Services
              </h3>
              <ul className="space-y-2 text-yellow-800">
                <li className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  Sample pickup orders - Cannot create new orders
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  Rider management - Cannot assign or manage riders
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  QR Code scanning - Chain of custody features disabled
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  GPS tracking - Real-time location tracking unavailable
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  Collection center access - Centers cannot place orders
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  Dashboard features - All management features restricted
                </li>
              </ul>
            </div>

            {/* How to Restore */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0'
              }}
            >
              <h3 className="text-lg font-bold text-green-900 mb-3">How to Restore Services</h3>
              <ol className="space-y-3 text-green-800 list-decimal list-inside">
                <li className="font-semibold">Contact PrimeCare Billing Team immediately (details below)</li>
                <li>Make the outstanding subscription payment</li>
                <li>Provide payment confirmation (receipt/reference number)</li>
                <li>Services will be reactivated within 2-4 hours after payment verification</li>
              </ol>
            </div>

            {/* Contact Information */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #bfdbfe'
              }}
            >
              <h3 className="text-lg font-bold text-teal-900 mb-4">📞 Contact Finance Team</h3>
              <div className="space-y-3">
                <a
                  href="tel:+94777884049"
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-teal-50 transition-colors"
                  style={{ border: '1px solid #bfdbfe' }}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm text-teal-600 font-medium">Phone</div>
                    <div className="text-teal-900 font-bold">+94 77 788 4049</div>
                  </div>
                </a>

                <a
                  href="mailto:transfleet.primecare@gmail.com"
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-teal-50 transition-colors"
                  style={{ border: '1px solid #bfdbfe' }}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm text-teal-600 font-medium">Email</div>
                    <div className="text-teal-900 font-bold">transfleet.primecare@gmail.com</div>
                  </div>
                </a>

                <a
                  href="https://wa.me/94777884049"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-teal-50 transition-colors"
                  style={{ border: '1px solid #bfdbfe' }}
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-green-600 font-medium">WhatsApp</div>
                    <div className="text-teal-900 font-bold">+94 77 788 4049</div>
                  </div>
                </a>

                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ border: '1px solid #bfdbfe', background: 'rgba(239, 246, 255, 0.5)' }}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm text-teal-600 font-medium">Available</div>
                    <div className="text-teal-900 font-bold">Monday - Saturday, 8:00 AM - 8:00 PM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Urgent Notice */}
            <div
              className="p-6 rounded-2xl text-center"
              style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '2px solid #fca5a5'
              }}
            >
              <p className="text-red-900 font-bold text-lg mb-2">⏰ Urgent Action Required</p>
              <p className="text-red-700">
                Please contact us immediately to avoid service termination.
              </p>
            </div>

            {/* Logout Button */}
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(107, 114, 128, 0.3)'
                }}
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          This is a critical notification from PrimeCare Finance Team<br />
          <strong className="text-red-600">DO NOT IGNORE THIS MESSAGE</strong>
        </p>
      </div>
    </div>
  );
}
