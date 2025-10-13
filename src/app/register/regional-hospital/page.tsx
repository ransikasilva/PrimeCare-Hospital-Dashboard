"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, CheckCircle } from "lucide-react";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import PhoneInput from "@/components/PhoneInput";

export default function RegionalHospitalRegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Basic Details
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobilePhone: "",
    mobilePhoneFull: "",

    // Hospital Information
    contactPersonName: "",
    contactPersonMobile: "",
    contactPersonMobileFull: "",
    address: "",
    city: "",
    province: "",
    latitude: "",
    longitude: "",
    landlineNumber: "",
    place_id: "",

    // Main Hospital Affiliation
    hospitalCode: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [mainHospitalInfo, setMainHospitalInfo] = useState<{name: string; location: string; network_name: string} | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset verification when hospital code changes
    if (name === 'hospitalCode') {
      setCodeVerified(false);
    }
  };

  const handlePhoneChange = (name: string, displayValue: string, fullValue: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: displayValue,
      [`${name}Full`]: fullValue
    }));
  };

  const handleHospitalNameSelect = (place: any) => {
    setFormData(prev => ({
      ...prev,
      name: place.name,
      address: place.address,
      city: place.city,
      province: place.province,
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
      place_id: place.place_id
    }));
  };


  const verifyHospitalCode = async () => {
    if (formData.hospitalCode.length < 6) {
      alert("Please enter a valid Hospital Code (e.g., HC-001)");
      return;
    }

    setVerifyingCode(true);

    try {
      // Import and use the API client
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.verifyHospitalCode(formData.hospitalCode);

      if (response.success && response.data) {
        const hospital = (response.data as any).hospital; // Backend wraps data in { hospital: {...} }
        setCodeVerified(true);
        setMainHospitalInfo({
          name: hospital.name,
          location: hospital.address || `${hospital.city || ''}, Sri Lanka`,
          network_name: hospital.network_name
        });
      } else {
        throw new Error(response.error?.message || 'Invalid hospital code');
      }
    } catch (error: any) {
      console.error('Hospital code verification failed:', error);
      alert(`Hospital code verification failed: ${error.message}`);
      setCodeVerified(false);
      setMainHospitalInfo(null);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codeVerified) {
      alert("Please verify your Hospital Code first.");
      return;
    }

    // Validate required fields
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      alert('Please fill in all required fields including email and password');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    // Validate required phone numbers are formatted
    if (!formData.mobilePhoneFull || !formData.mobilePhoneFull.startsWith('+94')) {
      alert('Please enter a valid mobile phone number');
      return;
    }

    if (!formData.contactPersonMobileFull || !formData.contactPersonMobileFull.startsWith('+94')) {
      alert('Please enter a valid contact person mobile number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Register user account with email and password
      const userRegistrationData = {
        email: formData.email,
        password: formData.password,
        phone: formData.mobilePhoneFull,
        user_type: 'hospital'
      };

      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/dashboard/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userRegistrationData),
      });

      const authResult = await authResponse.json();

      if (!authResponse.ok || !authResult.success) {
        throw new Error(authResult.error?.message || 'User account creation failed');
      }

      // Validate that required fields are filled before sending
      if (!formData.name || !formData.address || !formData.city) {
        throw new Error('Please select a hospital name from the search dropdown to auto-fill address and city');
      }

      if (!formData.contactPersonName) {
        throw new Error('Contact person name is required');
      }

      // Step 2: Register regional hospital entity
      const hospitalData = {
        hospital_code: formData.hospitalCode,
        network_name: mainHospitalInfo?.network_name || '',
        admin_name: formData.contactPersonName,
        admin_email: formData.email,
        admin_phone: formData.mobilePhoneFull || formData.mobilePhone,
        hospital_name: formData.name,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        contact_phone: formData.contactPersonMobileFull || formData.contactPersonMobile,
        coordinates_lat: formData.latitude ? parseFloat(formData.latitude) : undefined,
        coordinates_lng: formData.longitude ? parseFloat(formData.longitude) : undefined,
        landline: formData.landlineNumber
      };

      console.log('Submitting regional hospital registration:', hospitalData);
      console.log('Required fields check:', {
        hospital_code: !!hospitalData.hospital_code,
        network_name: !!hospitalData.network_name,
        admin_name: !!hospitalData.admin_name,
        admin_email: !!hospitalData.admin_email,
        admin_phone: !!hospitalData.admin_phone,
        hospital_name: !!hospitalData.hospital_name,
        address: !!hospitalData.address,
        city: !!hospitalData.city,
        contact_phone: !!hospitalData.contact_phone
      });

      // Import and use the API client
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.registerRegionalHospital(hospitalData);

      console.log('Regional hospital API response:', response);

      if (response.success) {
        // Redirect to email verification page
        console.log('Registration successful, redirecting to email verification...');
        const verificationUrl = `/verify-email?email=${encodeURIComponent(formData.email)}&type=hospital`;
        console.log('Redirect URL:', verificationUrl);
        router.push(verificationUrl);
      } else {
        console.error('Registration failed with response:', response);
        console.error('Error details:', response.error);
        const missingFields = response.error?.details || [];
        const errorDetails = missingFields.length > 0 ? `\n\nMissing fields: ${missingFields.join(', ')}` : '';
        alert(`Hospital registration failed: ${response.error?.message}${errorDetails}\n\nPlease check all required fields are filled.`);
        throw new Error(response.error?.message + errorDetails || 'Hospital registration failed');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      console.error('Full error object:', error);
      alert(`Registration failed: ${error.message}`);

      // Don't reset codeVerified here - keep the form filled
      // Only reset if user explicitly changes the hospital code
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  Regional Hospital Registration
                </p>
              </div>
            </div>
            <Link href="/register" className="inline-flex items-center px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-gray-50" style={{ borderColor: '#E5E7EB', color: '#4A5568' }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Options
            </Link>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white border-b px-6 py-4" style={{ borderColor: '#E5E7EB' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center space-x-2 ${!codeVerified ? 'text-teal-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${!codeVerified ? 'bg-teal-100 text-teal-600' : 'bg-green-100 text-green-600'}`}>
                  {!codeVerified ? '1' : '✓'}
                </div>
                <span className="font-medium">Verify Hospital Code</span>
              </div>
              <div className={`w-16 h-0.5 ${codeVerified ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center space-x-2 ${codeVerified ? 'text-teal-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${codeVerified ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`}>
                  2
                </div>
                <span className="font-medium">Hospital Information</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-12">
            {!codeVerified ? (
              // Step 1: Hospital Code Verification
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl p-12 text-center" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
                    style={{ backgroundColor: '#85C1E9' }}
                  >
                    <Info className="w-12 h-12 text-white" />
                  </div>
                  
                  <h2 
                    className="font-semibold mb-4"
                    style={{ 
                      fontSize: '32px',
                      fontWeight: '600',
                      color: '#2C3E50'
                    }}
                  >
                    Verify Hospital Code
                  </h2>
                  
                  <p 
                    className="mb-12"
                    style={{ 
                      color: '#4A5568',
                      fontSize: '18px',
                      lineHeight: '1.7',
                      maxWidth: '500px',
                      margin: '0 auto 3rem auto'
                    }}
                  >
                    Enter the Hospital Code provided by your Main Hospital to proceed with registration and join their network.
                  </p>

                  <div className="max-w-lg mx-auto mb-8">
                    <label 
                      className="block font-semibold mb-4 text-left"
                      style={{ 
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#2C3E50'
                      }}
                    >
                      Hospital Code
                    </label>
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        name="hospitalCode"
                        value={formData.hospitalCode}
                        onChange={handleInputChange}
                        required
                        className="flex-1 px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500 text-center text-xl font-semibold tracking-wider"
                        style={{ 
                          borderColor: '#E5E7EB',
                          backgroundColor: '#FFFFFF',
                          color: '#2C3E50'
                        }}
                        placeholder="HC-001"
                        maxLength={10}
                      />
                      <button
                        type="button"
                        onClick={verifyHospitalCode}
                        disabled={!formData.hospitalCode || verifyingCode}
                        className="px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 shadow-lg"
                        style={{
                          backgroundColor: '#5DADE2',
                          color: '#FFFFFF',
                          fontSize: '16px'
                        }}
                      >
                        {verifyingCode ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-start p-6 rounded-xl text-left"
                    style={{ backgroundColor: '#EFF6FF', border: '2px solid #DBEAFE' }}
                  >
                    <Info className="w-6 h-6 mr-4 mt-1" style={{ color: '#3B82F6' }} />
                    <div>
                      <p 
                        className="font-semibold mb-2"
                        style={{ 
                          fontSize: '16px',
                          color: '#1E40AF'
                        }}
                      >
                        Need a Hospital Code?
                      </p>
                      <p 
                        style={{ 
                          fontSize: '15px',
                          color: '#4A5568',
                          lineHeight: '1.6'
                        }}
                      >
                        Contact your Main Hospital administrator to get the Hospital Code. 
                        This unique code links your regional hospital to their network and enables access to the TransFleet system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          ) : (
            // Step 2: Full Registration Form (after code verification)
            <div>
              {/* Success Message */}
              <div className="max-w-4xl mx-auto mb-8">
                <div 
                  className="flex items-center p-6 rounded-xl"
                  style={{ backgroundColor: '#F0FDF4', border: '2px solid #BBF7D0' }}
                >
                  <CheckCircle className="w-8 h-8 mr-4" style={{ color: '#16A34A' }} />
                  <div>
                    <p 
                      className="font-semibold mb-1"
                      style={{ 
                        fontSize: '18px',
                        color: '#15803D'
                      }}
                    >
                      Hospital Code Verified Successfully!
                    </p>
                    <p 
                      style={{ 
                        fontSize: '16px',
                        color: '#4A5568'
                      }}
                    >
                      Main Hospital: {mainHospitalInfo?.name} - {mainHospitalInfo?.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl p-10" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Basic Details Section */}
                    <div>
                      <h2 
                        className="font-semibold mb-8"
                        style={{ 
                          fontSize: '24px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Basic Details
                      </h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                        <div>
                          <label 
                            className="block font-semibold mb-3"
                            style={{ 
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#2C3E50'
                            }}
                          >
                            Hospital Name *
                          </label>
                          <GooglePlacesAutocomplete
                            placeholder="Search for your hospital name..."
                            onPlaceSelect={handleHospitalNameSelect}
                            defaultValue={formData.name}
                            type="hospital"
                            className="px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500 text-base text-gray-900 bg-white"
                          />
                        </div>
                </div>
                <div>
                  <label 
                    className="block font-medium mb-2"
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:border-teal-500"
                    style={{ 
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3E50'
                    }}
                    placeholder="admin@hospital.com"
                  />
                </div>
                <div>
                  <label
                    className="block font-medium mb-2"
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    PASSWORD *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:border-teal-500"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3E50'
                    }}
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label
                    className="block font-medium mb-2"
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    CONFIRM PASSWORD *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:border-teal-500"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3E50'
                    }}
                    placeholder="Re-enter your password"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block font-medium mb-2"
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    MOBILE PHONE NUMBER *
                  </label>
                  <PhoneInput
                    name="mobilePhone"
                    value={formData.mobilePhoneFull}
                    onChange={handlePhoneChange}
                    required
                    placeholder="771234567"
                    className="w-full transition-all duration-200 focus:outline-none focus:border-teal-500"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3E50'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Hospital Information Section */}
            <div>
              <h2 
                className="font-medium mb-4"
                style={{ 
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#2C3E50'
                }}
              >
                Hospital Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block font-medium mb-2"
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    CONTACT PERSON NAME *
                  </label>
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:border-teal-500"
                    style={{ 
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3E50'
                    }}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <label
                    className="block font-medium mb-2"
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    CONTACT PERSON MOBILE *
                  </label>
                  <PhoneInput
                    name="contactPersonMobile"
                    value={formData.contactPersonMobileFull}
                    onChange={handlePhoneChange}
                    required
                    placeholder="771234567"
                    className="w-full transition-all duration-200 focus:outline-none focus:border-teal-500"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3E50'
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label 
                    className="block font-medium mb-2"
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    HOSPITAL ADDRESS *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    readOnly
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border resize-none"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#F9FAFB',
                      color: '#2C3E50'
                    }}
                    placeholder="Address will be auto-filled when you select a hospital name"
                  />
                  <p
                    className="text-sm mt-2"
                    style={{ color: '#6B7280' }}
                  >
                    Address is automatically filled when you select a hospital from the name field above
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label 
                    className="block font-medium mb-2"
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    LOCATION (GPS COORDINATES) *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-lg border"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#F9FAFB',
                        color: '#2C3E50'
                      }}
                      placeholder="Auto-filled latitude"
                    />
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-lg border"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#F9FAFB',
                        color: '#2C3E50'
                      }}
                      placeholder="Auto-filled longitude"
                    />
                  </div>
                  <p
                    className="text-sm mt-2"
                    style={{ color: '#6B7280' }}
                  >
                    Coordinates are automatically filled when you select a hospital from the name field above
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label 
                    className="block font-medium mb-2"
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    LANDLINE NUMBER
                  </label>
                  <input
                    type="tel"
                    name="landlineNumber"
                    value={formData.landlineNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:border-teal-500"
                    style={{ 
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3E50'
                    }}
                    placeholder="+94 11 234 5678"
                  />
                </div>
              </div>
            </div>

            {/* Main Hospital Affiliation Section */}
            <div>
              <h2 
                className="font-medium mb-4"
                style={{ 
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#2C3E50'
                }}
              >
                Main Hospital Affiliation
              </h2>
              <div>
                <label 
                  className="block font-medium mb-2"
                  style={{ 
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#7B8794'
                  }}
                >
                  HOSPITAL CODE *
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    name="hospitalCode"
                    value={formData.hospitalCode}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:border-teal-500"
                    style={{ 
                      borderColor: codeVerified ? '#58D68D' : '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3E50'
                    }}
                    placeholder="HC-001"
                  />
                  <button
                    type="button"
                    onClick={verifyHospitalCode}
                    disabled={!formData.hospitalCode || codeVerified}
                    className="px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: codeVerified ? '#58D68D' : '#5DADE2',
                      color: '#FFFFFF'
                    }}
                  >
                    {codeVerified ? 'Verified' : 'Verify'}
                  </button>
                </div>
                <div 
                  className="flex items-start p-3 rounded-lg"
                  style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}
                >
                  <Info className="w-4 h-4 mr-2 mt-0.5" style={{ color: '#3B82F6' }} />
                  <p 
                    style={{ 
                      fontSize: '14px',
                      color: '#6B7280',
                      lineHeight: '1.5'
                    }}
                  >
                    Enter the Hospital Code provided by your Main Hospital. This code links your regional hospital to their network and enables you to access the TransFleet system.
                  </p>
                </div>
              </div>
            </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-6 pt-8 border-t border-gray-200">
                      <Link href="/register">
                        <button 
                          type="button"
                          className="px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50"
                          style={{
                            backgroundColor: 'transparent',
                            border: '2px solid #E5E7EB',
                            color: '#4A5568',
                            fontSize: '16px'
                          }}
                        >
                          Cancel
                        </button>
                      </Link>
                      <button 
                        type="submit"
                        disabled={isSubmitting || !codeVerified}
                        className="px-12 py-4 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 shadow-lg"
                        style={{
                          backgroundColor: '#5DADE2',
                          color: '#FFFFFF',
                          fontSize: '16px'
                        }}
                      >
                        {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                      </button>
                    </div>
          </form>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}