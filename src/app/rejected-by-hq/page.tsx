"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, AlertCircle, Phone, Mail, ArrowLeft } from "lucide-react";

interface RejectionData {
  hospitalName?: string;
  rejectionReason?: string;
  rejectedAt?: string;
}

export default function RejectedByHQPage() {
  const router = useRouter();
  const [rejectionData, setRejectionData] = useState<RejectionData>({});

  useEffect(() => {
    // Get rejection data from sessionStorage
    const stored = sessionStorage.getItem("rejectionData");
    if (stored) {
      try {
        setRejectionData(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing rejection data:", error);
      }
    }
  }, []);

  const handleReturnToLogin = () => {
    // Clear auth token and rejection data
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("rejectionData");
    router.push("/login");
  };

  const commonRejectionReasons = [
    "Incomplete or incorrect documentation provided",
    "Unable to verify hospital network registration details",
    "Non-compliance with PrimeCare operational standards",
    "Insufficient infrastructure for medical sample handling",
    "Pending regulatory approvals or licenses",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-red-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-full">
                <XCircle className="w-16 h-16" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">
              Application Rejected by HQ
            </h1>
            <p className="text-center text-red-100 text-lg">
              {rejectionData.hospitalName || "Your hospital network"} application has been reviewed and rejected
            </p>
            {rejectionData.rejectedAt && (
              <p className="text-center text-red-100 text-sm mt-2">
                Rejected on: {new Date(rejectionData.rejectedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Rejection Reason */}
            {rejectionData.rejectionReason && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Rejection Reason:</h3>
                    <p className="text-red-800">{rejectionData.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Common Reasons */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                Common Rejection Reasons:
              </h3>
              <ul className="space-y-2">
                {commonRejectionReasons.map((reason, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <span className="text-red-500 mr-2 mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What Can You Do?</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">1.</span>
                  <span>Contact TransFleet Operations team to understand specific concerns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">2.</span>
                  <span>Address the identified issues and gather required documentation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">3.</span>
                  <span>Submit a new application with corrected information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">4.</span>
                  <span>Request a review meeting to discuss the rejection decision</span>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
              <h3 className="font-bold text-gray-800 mb-4 text-center text-lg">
                Contact TransFleet Finance Team
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3 text-gray-700">
                  <div className="bg-teal-100 p-2 rounded-full">
                    <Phone className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Support</p>
                    <a
                      href="tel:+94777884049"
                      className="font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                    >
                      +94 77 788 4049
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 text-gray-700">
                  <div className="bg-teal-100 p-2 rounded-full">
                    <Mail className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Support</p>
                    <a
                      href="mailto:transfleet.primecare@gmail.com"
                      className="font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                    >
                      transfleet.primecare@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-teal-200 text-center">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Available Hours:</span> Monday - Saturday, 8:00 AM - 8:00 PM
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Closed on Sundays and Public Holidays
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8">
              <button
                onClick={handleReturnToLogin}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need immediate assistance? Call our support hotline: <span className="font-semibold text-teal-600">+94 77 788 4049</span>
          </p>
        </div>
      </div>
    </div>
  );
}
