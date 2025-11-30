"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import PhoneInput from "@/components/PhoneInput";

export default function MainHospitalRegistrationPage() {
  const [formData, setFormData] = useState({
    // Basic Details
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobilePhone: "",
    mobilePhoneFull: "", // Backend format: +94771234567

    // Hospital Information
    contactPersonName: "",
    contactPersonMobile: "",
    contactPersonMobileFull: "", // Backend format: +94771234567
    address: "",
    city: "",
    province: "",
    latitude: "",
    longitude: "",
    landlineNumber: "",
    place_id: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (name: string, displayValue: string, fullValue: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: displayValue,
      [name + 'Full']: fullValue
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

      if (!formData.name || !formData.address || !formData.latitude || !formData.longitude) {
        alert('Please select a hospital name from the search dropdown to complete all required fields');
        return;
      }

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

      // Step 2: Register hospital entity
      const hospitalData = {
        hospital_name: formData.name,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        contact_phone: formData.contactPersonMobileFull || formData.contactPersonMobile, // Use formatted phone number
        admin_phone: formData.mobilePhoneFull || formData.mobilePhone, // Use formatted phone number
        admin_email: formData.email,
        admin_name: formData.contactPersonName,
        network_name: `${formData.name} Network`, // Generate network name
        emergency_contact: formData.landlineNumber,
        coordinates_lat: parseFloat(formData.latitude),
        coordinates_lng: parseFloat(formData.longitude)
      };

      const hospitalResponse = await apiClient.registerMainHospital(hospitalData);

      console.log('Hospital API Response:', hospitalResponse);

      if (hospitalResponse.success) {
        console.log('Redirecting to verification page...');
        // Redirect to email verification page
        const verificationUrl = `/verify-email?email=${encodeURIComponent(formData.email)}&type=hospital`;
        window.location.href = verificationUrl;
      } else {
        console.error('Hospital registration failed:', hospitalResponse);
        throw new Error(hospitalResponse.error?.message || 'Hospital registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error.message || 'Please try again.'}`);
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
                style={{ boxShadow: '0 4px 16px rgba(78, 205, 196, 0.3)' }}
              >
                <img src="/logo.png" alt="TransFleet Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: '#2C3E50' }}>
                  TransFleet Registration
                </h1>
                <p className="text-sm" style={{ color: '#4A5568' }}>
                  Main Hospital Registration
                </p>
              </div>
            </div>
            <Link href="/register" className="inline-flex items-center px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-gray-50" style={{ borderColor: '#E5E7EB', color: '#4A5568' }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Options
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="bg-white rounded-xl p-10" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              {/* Header */}
              <div className="text-center mb-12">
                <h1 
                  className="font-semibold mb-4"
                  style={{ 
                    fontSize: '36px',
                    fontWeight: '600',
                    color: '#2C3E50'
                  }}
                >
                  Main Hospital Registration
                </h1>
                <p 
                  style={{ 
                    color: '#4A5568',
                    fontSize: '18px',
                    lineHeight: '1.7'
                  }}
                >
                  Register as an independent hospital to receive your unique Hospital Code and manage your network
                </p>
              </div>


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
                    <div>
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                        style={{
                          borderColor: '#E5E7EB',
                          backgroundColor: '#FFFFFF',
                          color: '#2C3E50',
                          fontSize: '16px'
                        }}
                        placeholder="admin@hospital.com"
                      />
                    </div>
                    <div>
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                        style={{
                          borderColor: '#E5E7EB',
                          backgroundColor: '#FFFFFF',
                          color: '#2C3E50',
                          fontSize: '16px'
                        }}
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    <div>
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                        style={{
                          borderColor: '#E5E7EB',
                          backgroundColor: '#FFFFFF',
                          color: '#2C3E50',
                          fontSize: '16px'
                        }}
                        placeholder="Re-enter your password"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Mobile Phone Number *
                      </label>
                      <PhoneInput
                        name="mobilePhone"
                        value={formData.mobilePhone}
                        onChange={handlePhoneChange}
                        required
                        placeholder="771234567"
                      />
                    </div>
                  </div>
                </div>

                {/* Hospital Information Section */}
                <div>
                  <h2 
                    className="font-semibold mb-8"
                    style={{ 
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#2C3E50'
                    }}
                  >
                    Hospital Information
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <label 
                        className="block font-semibold mb-3"
                        style={{ 
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        name="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                        style={{ 
                          borderColor: '#E5E7EB',
                          backgroundColor: '#FFFFFF',
                          color: '#2C3E50',
                          fontSize: '16px'
                        }}
                        placeholder="Dr. John Doe"
                      />
                    </div>
                    <div>
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Contact Person Mobile *
                      </label>
                      <PhoneInput
                        name="contactPersonMobile"
                        value={formData.contactPersonMobile}
                        onChange={handlePhoneChange}
                        required
                        placeholder="771234567"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Hospital Address *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        readOnly
                        rows={3}
                        className="w-full px-6 py-4 rounded-xl border-2 resize-none"
                        style={{
                          borderColor: '#E5E7EB',
                          backgroundColor: '#F9FAFB',
                          color: '#2C3E50',
                          fontSize: '16px'
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
                    <div className="lg:col-span-2">
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Location (GPS Coordinates) *
                      </label>
                      <div className="flex space-x-4">
                        <input
                          type="text"
                          name="latitude"
                          value={formData.latitude}
                          readOnly
                          className="flex-1 px-6 py-4 rounded-xl border-2"
                          style={{
                            borderColor: '#E5E7EB',
                            backgroundColor: '#F9FAFB',
                            color: '#2C3E50',
                            fontSize: '16px'
                          }}
                          placeholder="Auto-filled latitude"
                        />
                        <input
                          type="text"
                          name="longitude"
                          value={formData.longitude}
                          readOnly
                          className="flex-1 px-6 py-4 rounded-xl border-2"
                          style={{
                            borderColor: '#E5E7EB',
                            backgroundColor: '#F9FAFB',
                            color: '#2C3E50',
                            fontSize: '16px'
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
                    <div>
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                        style={{
                          borderColor: '#E5E7EB',
                          backgroundColor: '#F9FAFB',
                          color: '#2C3E50',
                          fontSize: '16px'
                        }}
                        placeholder="Auto-filled from address"
                        readOnly
                      />
                    </div>
                    <div>
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Province
                      </label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                        style={{
                          borderColor: '#E5E7EB',
                          backgroundColor: '#F9FAFB',
                          color: '#2C3E50',
                          fontSize: '16px'
                        }}
                        placeholder="Auto-filled from address"
                        readOnly
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label
                        className="block font-semibold mb-3"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2C3E50'
                        }}
                      >
                        Landline Number
                      </label>
                      <input
                        type="tel"
                        name="landlineNumber"
                        value={formData.landlineNumber}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500"
                        style={{ 
                          borderColor: '#E5E7EB',
                          backgroundColor: '#FFFFFF',
                          color: '#2C3E50',
                          fontSize: '16px'
                        }}
                        placeholder="+94 11 234 5678"
                      />
                    </div>
                  </div>
                </div>

                {/* System Generated Section */}
                <div>
                  <h2 
                    className="font-semibold mb-8"
                    style={{ 
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#2C3E50'
                    }}
                  >
                    System Generated
                  </h2>
                  <div 
                    className="p-8 rounded-xl"
                    style={{ backgroundColor: '#EFF6FF', border: '2px solid #DBEAFE' }}
                  >
                    <p 
                      className="font-semibold mb-4"
                      style={{ 
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#3B82F6'
                      }}
                    >
                      Hospital Code
                    </p>
                    <p 
                      style={{ 
                        fontSize: '16px',
                        color: '#4A5568',
                        lineHeight: '1.6'
                      }}
                    >
                      Your unique Hospital Code (e.g., HC-001) will be automatically generated after approval. 
                      This code will be used by Regional Hospitals to register under your network.
                    </p>
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
                    disabled={isSubmitting}
                    className="px-12 py-4 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 shadow-lg"
                    style={{
                      backgroundColor: '#4ECDC4',
                      color: '#FFFFFF',
                      fontSize: '16px'
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Register as Main Hospital'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}