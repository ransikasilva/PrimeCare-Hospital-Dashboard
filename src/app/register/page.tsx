import Link from "next/link";
import { Building2, Network, CheckCircle, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/20"></div>

      {/* Elegant Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-50/50 rounded-full blur-2xl"></div>
      </div>

      <div className="relative">
        {/* Top Navigation */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 bg-white border-2 border-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="TransFleet" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TransFleet</h1>
                  <p className="text-xs text-gray-600 font-medium">Hospital Registration</p>
                </div>
              </div>
              <Link href="/login">
                <button className="px-5 py-2 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all duration-200">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Join TransFleet Network
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose your hospital registration type to get started with our comprehensive medical sample delivery platform
            </p>
          </div>

          {/* Registration Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Main Hospital Card */}
            <div className="group bg-white rounded-3xl p-10 border-2 border-gray-100 hover:border-teal-500 transition-all duration-300 shadow-xl shadow-teal-100/50 hover:shadow-2xl hover:shadow-teal-200/50 transform hover:-translate-y-1">
              <div className="flex flex-col h-full items-center text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30">
                  <Building2 className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Main Hospital
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-8">
                  Register as an independent hospital network and receive a unique Hospital Code. Manage your entire network with full administrative control.
                </p>

                {/* Benefits */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Key Benefits:
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Unique Hospital Network Code",
                      "Full network dashboard access",
                      "Manage regional hospitals",
                      "Network-wide analytics",
                      "Approve riders & centers"
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link href="/register/main-hospital" className="mt-auto">
                  <button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 group-hover:transform group-hover:-translate-y-0.5">
                    <span>Register as Main Hospital</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Regional Hospital Card */}
            <div className="group bg-white rounded-3xl p-10 border-2 border-gray-100 hover:border-cyan-500 transition-all duration-300 shadow-xl shadow-cyan-100/50 hover:shadow-2xl hover:shadow-cyan-200/50 transform hover:-translate-y-1">
              <div className="flex flex-col h-full items-center text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                  <Network className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Regional Hospital
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-8">
                  Join an existing hospital network using their Hospital Code. Get dedicated access to manage your hospital's operations within the network.
                </p>

                {/* Benefits */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Key Benefits:
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Hospital-specific dashboard",
                      "Manage riders & deliveries",
                      "Collection center approvals",
                      "Performance analytics",
                      "Network connectivity"
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link href="/register/regional-hospital" className="mt-auto">
                  <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 group-hover:transform group-hover:-translate-y-0.5">
                    <span>Register as Regional Hospital</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-center">
            <p className="text-gray-600 mb-6 font-medium text-lg">
              Already have an account?
            </p>
            <Link href="/login">
              <button className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-teal-500 text-teal-600 font-semibold rounded-2xl hover:bg-teal-50 hover:border-teal-600 transition-all duration-200 transform hover:-translate-y-0.5">
                Sign In to Dashboard
              </button>
            </Link>
          </div>

          {/* Support Text */}
          <p className="mt-12 text-center text-sm text-gray-500">
            Need help with registration? Contact us at{' '}
            <a href="mailto:transfleet@primecare.lk" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors">
              transfleet@primecare.lk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
