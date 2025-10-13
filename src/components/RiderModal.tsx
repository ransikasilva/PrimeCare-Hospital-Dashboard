"use client";

import { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Car,
  Star,
  CreditCard,
  Shield,
  Clock,
  Image,
  Download,
  Eye
} from "lucide-react";
import { RiderKMChart } from "./RiderKMChart";

interface Rider {
  id: string;
  rider_name?: string;
  name?: string;
  phone: string;
  email?: string;
  vehicle_type?: string;
  vehicle?: string;
  license_number?: string;
  nic_number?: string;
  address?: string;
  city?: string;
  province?: string;
  rating?: number;
  total_deliveries?: number;
  status: string;
  created_at: string;
  updated_at?: string;
  emergency_contact?: string;
  experience_years?: number;
  vehicle_model?: string;
  insurance_number?: string;
  // Document URLs - backend uses these field names
  profile_image_url?: string;
  license_image_url?: string;
  license_image_back_url?: string;
  nic_image_url?: string;
  nic_image_back_url?: string;
  vehicle_registration?: string;
  // Legacy field names (for compatibility)
  license_photo?: string;
  nic_photo?: string;
  profile_photo?: string;
  documents?: {
    license?: string;
    nic?: string;
    vehicle_registration?: string;
    profile_photo?: string;
  };
}

interface RiderModalProps {
  rider: Rider | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (riderId: string, riderName: string) => Promise<void>;
  onReject: (riderId: string, riderName: string, reason?: string) => Promise<void>;
  isProcessing: boolean;
  hospitalId?: string;
}

export function RiderModal({
  rider,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing,
  hospitalId
}: RiderModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Date range state for KM chart
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to 7 days ago
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Default to today
  });

  if (!isOpen || !rider) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_hospital_approval':
        return {
          icon: AlertTriangle,
          color: '#f59e0b',
          bg: 'bg-yellow-100',
          text: 'Pending Approval',
          className: 'text-yellow-800'
        };
      case 'approved':
      case 'active':
        return {
          icon: CheckCircle2,
          color: '#10b981',
          bg: 'bg-green-100',
          text: 'Approved',
          className: 'text-green-800'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: '#ef4444',
          bg: 'bg-red-100',
          text: 'Rejected',
          className: 'text-red-800'
        };
      case 'offline':
        return {
          icon: Clock,
          color: '#6b7280',
          bg: 'bg-gray-100',
          text: 'Offline',
          className: 'text-gray-800'
        };
      default:
        return {
          icon: AlertTriangle,
          color: '#6b7280',
          bg: 'bg-gray-100',
          text: status,
          className: 'text-gray-800'
        };
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType?.toLowerCase()) {
      case 'motorcycle':
      case 'bike':
        return '🏍️';
      case 'car':
      case 'vehicle':
        return '🚗';
      case 'van':
        return '🚐';
      default:
        return '🏍️';
    }
  };

  const statusConfig = getStatusConfig(rider.status);
  const StatusIcon = statusConfig.icon;
  const riderName = rider.rider_name || rider.name || 'Unknown Rider';

  const handleApprove = async () => {
    await onApprove(rider.id, riderName);
    onClose();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    await onReject(rider.id, riderName, rejectionReason);
    setShowRejectForm(false);
    setRejectionReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-4xl rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="relative p-8 text-white"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-black bg-opacity-20 hover:bg-red-500 hover:bg-opacity-90 border border-white border-opacity-30 hover:border-red-400 transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-lg group"
            >
              <X className="w-6 h-6 text-white drop-shadow-lg group-hover:text-white transition-all duration-200" />
            </button>
            
            <div className="flex items-start space-x-6">
              <div
                className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-white shadow-lg"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              >
                {(rider.profile_image_url || rider.profile_photo || rider.documents?.profile_photo) ? (
                  <img
                    src={rider.profile_image_url || rider.profile_photo || rider.documents?.profile_photo}
                    alt={`${riderName} Profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to user icon if profile photo fails to load
                      const container = e.target as HTMLElement;
                      container.style.display = 'none';
                      const fallback = container.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 ${(rider.profile_image_url || rider.profile_photo || rider.documents?.profile_photo) ? 'hidden' : 'flex'} fallback-icon`}
                >
                  <User className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{riderName}</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Car className="w-5 h-5" />
                    <span className="text-white/90 capitalize">{rider.vehicle_type || rider.vehicle || 'Motorcycle'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-5 h-5" />
                    <span className="text-white/90">{rider.phone}</span>
                  </div>
                  {rider.rating && (
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5" />
                      <span className="text-white/90">{rider.rating} ⭐</span>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${statusConfig.bg}`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.className}`} />
                  <span className={`font-semibold ${statusConfig.className}`}>
                    {statusConfig.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-semibold text-gray-800">{riderName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-semibold text-gray-800">{rider.phone}</p>
                    </div>
                  </div>
                  
                  {rider.email && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-semibold text-gray-800">{rider.email}</p>
                      </div>
                    </div>
                  )}

                  {rider.emergency_contact && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="font-semibold text-gray-800">{rider.emergency_contact}</p>
                      </div>
                    </div>
                  )}

                  {rider.address && (
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-semibold text-gray-800">{rider.address}</p>
                        {rider.city && rider.province && (
                          <p className="text-sm text-gray-600">
                            {rider.city}, {rider.province}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle & Professional Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Vehicle & Professional Details</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Type</p>
                      <p className="font-semibold text-gray-800 capitalize">
                        {rider.vehicle_type || rider.vehicle || 'Motorcycle'}
                      </p>
                      {rider.vehicle_model && (
                        <p className="text-sm text-gray-600">{rider.vehicle_model}</p>
                      )}
                    </div>
                  </div>
                  
                  {rider.license_number && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">License Number</p>
                        <p className="font-semibold text-gray-800">{rider.license_number}</p>
                      </div>
                    </div>
                  )}

                  {rider.nic_number && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">NIC Number</p>
                        <p className="font-semibold text-gray-800">{rider.nic_number}</p>
                      </div>
                    </div>
                  )}

                  {rider.insurance_number && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Insurance Number</p>
                        <p className="font-semibold text-gray-800">{rider.insurance_number}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(rider.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* KM Performance Stats - Full Width */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">KM Performance Statistics</h3>
                <div className="grid grid-cols-4 gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600 mb-2">0</p>
                    <p className="text-sm text-gray-600 font-medium">Daily KM</p>
                    <p className="text-xs text-gray-500">Today's distance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 mb-2">0</p>
                    <p className="text-sm text-gray-600 font-medium">Weekly KM</p>
                    <p className="text-xs text-gray-500">Last 7 days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600 mb-2">0</p>
                    <p className="text-sm text-gray-600 font-medium">Monthly KM</p>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600 mb-2">{rider.total_deliveries || 0}</p>
                    <p className="text-sm text-gray-600 font-medium">Total Deliveries</p>
                    <p className="text-xs text-gray-500">All time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KM Performance Chart */}
            {rider.status === 'approved' && hospitalId && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">KM Performance Analysis</h3>

                  {/* Date Range Picker */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center space-x-4 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Select Date Range:
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-800 font-medium mb-1">From Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-800 font-medium mb-1">To Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="px-3 py-2 text-xs text-gray-600 bg-blue-50 rounded-lg border border-blue-200">
                          {(() => {
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            const diffTime = Math.abs(end.getTime() - start.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <RiderKMChart
                  riderId={rider.id}
                  riderName={riderName}
                  hospitalId={hospitalId}
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
            )}

            {/* Documents Section - 4 Images: License Front/Back, NIC Front/Back */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Submitted Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* License Front */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Driver's License (Front)</h4>
                      <p className="text-sm text-gray-500">Front side of license</p>
                    </div>
                  </div>

                  {(rider.license_image_url || rider.license_photo || rider.documents?.license) ? (
                    <div className="space-y-3">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={rider.license_image_url || rider.license_photo || rider.documents?.license}
                          alt="Driver's License Front"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            (e.target as HTMLElement).nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Image className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Image not available</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center space-x-1"
                          onClick={() => window.open(rider.license_image_url || rider.license_photo || rider.documents?.license, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Full</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No document uploaded</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* License Back */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Driver's License (Back)</h4>
                      <p className="text-sm text-gray-500">Back side of license</p>
                    </div>
                  </div>

                  {rider.license_image_back_url ? (
                    <div className="space-y-3">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={rider.license_image_back_url}
                          alt="Driver's License Back"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            (e.target as HTMLElement).nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Image className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Image not available</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center space-x-1"
                          onClick={() => window.open(rider.license_image_back_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Full</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No document uploaded</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* NIC Front */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">National ID (Front)</h4>
                      <p className="text-sm text-gray-500">Front side of NIC</p>
                    </div>
                  </div>

                  {(rider.nic_image_url || rider.nic_photo || rider.documents?.nic) ? (
                    <div className="space-y-3">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={rider.nic_image_url || rider.nic_photo || rider.documents?.nic}
                          alt="National ID Front"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            (e.target as HTMLElement).nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Image className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Image not available</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200 flex items-center justify-center space-x-1"
                          onClick={() => window.open(rider.nic_image_url || rider.nic_photo || rider.documents?.nic, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Full</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No document uploaded</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* NIC Back */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">National ID (Back)</h4>
                      <p className="text-sm text-gray-500">Back side of NIC</p>
                    </div>
                  </div>

                  {rider.nic_image_back_url ? (
                    <div className="space-y-3">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={rider.nic_image_back_url}
                          alt="National ID Back"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            (e.target as HTMLElement).nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Image className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Image not available</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200 flex items-center justify-center space-x-1"
                          onClick={() => window.open(rider.nic_image_back_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Full</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No document uploaded</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Document Verification Notes */}
              {(rider.status === "pending" || rider.status === "pending_hospital_approval") && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Document Verification Required</h4>
                      <p className="text-sm text-yellow-700">
                        Please carefully review all submitted documents before approving this rider. 
                        Verify that the license is valid, NIC matches the rider's identity, and all documents are clear and authentic.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(rider.status === "pending" || rider.status === "pending_hospital_approval") && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                {!showRejectForm ? (
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isProcessing}
                      className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-5 h-5" />
                        <span>Reject Rider</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{isProcessing ? 'Approving...' : 'Approve Rider'}</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a detailed reason for rejecting this rider..."
                        className="w-full p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason("");
                        }}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105"
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151'
                        }}
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={handleReject}
                        disabled={isProcessing || !rejectionReason.trim()}
                        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:opacity-50"
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5" />
                          <span>{isProcessing ? 'Rejecting...' : 'Confirm Rejection'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}