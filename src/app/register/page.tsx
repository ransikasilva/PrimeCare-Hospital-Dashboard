import Link from "next/link";
import { Building2, Network } from "lucide-react";

export default function RegisterPage() {
  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: '#F8F9FA' }}
    >
      <div className="w-full">
        {/* Top Navigation Bar */}
        <div 
          className="bg-white border-b px-6 py-4"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white"
                style={{ boxShadow: '0 4px 16px rgba(93, 173, 226, 0.3)' }}
              >
                <img src="/logo.png" alt="TransFleet Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: '#2C3E50' }}>
                  TransFleet Registration
                </h1>
                <p className="text-sm" style={{ color: '#4A5568' }}>
                  Choose your registration type
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-16">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 
                className="font-semibold mb-6"
                style={{ 
                  fontSize: '48px',
                  fontWeight: '700',
                  color: '#2C3E50'
                }}
              >
                Join TransFleet Network
              </h1>
              <p 
                className="mx-auto"
                style={{ 
                  color: '#4A5568',
                  fontSize: '20px',
                  lineHeight: '1.6',
                  maxWidth: '800px'
                }}
              >
                Choose your hospital registration type to get started with TransFleet's comprehensive sample delivery system
              </p>
            </div>

            {/* Registration Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
              {/* Main Hospital Registration */}
              <div 
                className="bg-white rounded-2xl p-12 text-center border-2 border-transparent hover:border-teal-200 transition-all duration-300 transform hover:scale-105"
                style={{ 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div 
                  className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8"
                  style={{ backgroundColor: '#5DADE2' }}
                >
                  <Building2 className="w-14 h-14 text-white" />
                </div>
                <h2 
                  className="font-semibold mb-6"
                  style={{ 
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#2C3E50'
                  }}
                >
                  Main Hospital
                </h2>
                <p 
                  className="mb-8"
                  style={{ 
                    color: '#4A5568',
                    fontSize: '18px',
                    lineHeight: '1.7'
                  }}
                >
                  Register as an independent hospital and receive a unique Hospital Code. 
                  You'll have full network access and can manage regional hospitals under your code.
                </p>
            
                <div className="mb-10">
                  <h3 
                    className="font-semibold mb-6"
                    style={{ 
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#2C3E50'
                    }}
                  >
                    What you get:
                  </h3>
                  <ul 
                    className="text-left space-y-4"
                    style={{ 
                      color: '#4A5568',
                      fontSize: '16px'
                    }}
                  >
                    <li>• Unique Hospital Code (e.g., HC-001)</li>
                    <li>• Full network dashboard access</li>
                    <li>• Manage regional hospitals</li>
                    <li>• Network-wide reporting</li>
                    <li>• Approve riders & collection centers</li>
                  </ul>
                </div>

                <Link href="/register/main-hospital" className="w-full block">
                  <button 
                    className="w-full py-4 px-8 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 shadow-lg"
                    style={{
                      backgroundColor: '#5DADE2',
                      color: '#FFFFFF',
                      fontSize: '18px'
                    }}
                  >
                    Register as Main Hospital
                  </button>
                </Link>
              </div>

              {/* Regional Hospital Registration */}
              <div 
                className="bg-white rounded-2xl p-12 text-center border-2 border-transparent hover:border-teal-200 transition-all duration-300 transform hover:scale-105"
                style={{ 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div 
                  className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8"
                  style={{ backgroundColor: '#85C1E9' }}
                >
                  <Network className="w-14 h-14 text-white" />
                </div>
                <h2 
                  className="font-semibold mb-6"
                  style={{ 
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#2C3E50'
                  }}
                >
                  Regional Hospital
                </h2>
                <p 
                  className="mb-8"
                  style={{ 
                    color: '#4A5568',
                    fontSize: '18px',
                    lineHeight: '1.7'
                  }}
                >
                  Register under an existing Main Hospital using their Hospital Code. 
                  You'll have access to your hospital's data and operations within the network.
                </p>
            
                <div className="mb-10">
                  <h3 
                    className="font-semibold mb-6"
                    style={{ 
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#2C3E50'
                    }}
                  >
                    What you get:
                  </h3>
                  <ul 
                    className="text-left space-y-4"
                    style={{ 
                      color: '#4A5568',
                      fontSize: '16px'
                    }}
                  >
                    <li>• Hospital-specific dashboard</li>
                    <li>• Manage your riders & orders</li>
                    <li>• Collection center approvals</li>
                    <li>• Performance analytics</li>
                    <li>• Part of Main Hospital network</li>
                  </ul>
                </div>

                <Link href="/register/regional-hospital" className="w-full block">
                  <button 
                    className="w-full py-4 px-8 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 shadow-lg"
                    style={{
                      backgroundColor: '#85C1E9',
                      color: '#FFFFFF',
                      fontSize: '18px'
                    }}
                  >
                    Register as Regional Hospital
                  </button>
                </Link>
              </div>
            </div>

            {/* Additional Links */}
            <div className="text-center">
              <p 
                className="mb-6"
                style={{ 
                  color: '#4A5568',
                  fontSize: '18px'
                }}
              >
                Already have an account?
              </p>
              <Link href="/login">
                <button 
                  className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50"
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid #5DADE2',
                    color: '#5DADE2',
                    fontSize: '16px'
                  }}
                >
                  Sign In to Dashboard
                </button>
              </Link>
            </div>

            {/* Other Registration Options */}
            <div className="mt-20 pt-12 border-t border-gray-200">
              <h3 
                className="text-center font-semibold mb-10"
                style={{ 
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#2C3E50'
                }}
              >
                Other Registration Options
              </h3>
              <div className="flex justify-center space-x-8">
                <Link href="/register/collection-center">
                  <button 
                    className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50"
                    style={{
                      backgroundColor: 'transparent',
                      border: '2px solid #E5E7EB',
                      color: '#2C3E50',
                      fontSize: '16px'
                    }}
                  >
                    Register Collection Center
                  </button>
                </Link>
                <Link href="/register/rider">
                  <button 
                    className="px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50"
                    style={{
                      backgroundColor: 'transparent',
                      border: '2px solid #E5E7EB',
                      color: '#2C3E50',
                      fontSize: '16px'
                    }}
                  >
                    Register as Rider
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}