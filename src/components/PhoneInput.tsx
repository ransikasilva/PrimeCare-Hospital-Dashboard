"use client";

import { useState } from 'react';

interface PhoneInputProps {
  name: string;
  value: string;
  onChange: (name: string, value: string, formattedValue: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function PhoneInput({
  name,
  value,
  onChange,
  required = false,
  placeholder = "771234567",
  className = "",
  style = {}
}: PhoneInputProps) {
  // Extract the local number (remove +94 if present)
  const getLocalNumber = (phone: string) => {
    if (phone.startsWith('+94')) {
      return phone.substring(3);
    }
    if (phone.startsWith('94')) {
      return phone.substring(2);
    }
    if (phone.startsWith('0')) {
      return phone.substring(1);
    }
    return phone;
  };

  const localNumber = getLocalNumber(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove non-digit characters
    const digitsOnly = inputValue.replace(/[^0-9]/g, '');

    // Limit to 9 digits (Sri Lankan mobile format without leading 0)
    const limitedDigits = digitsOnly.substring(0, 9);

    // Format for display (add spaces for readability)
    const displayValue = limitedDigits.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');

    // Create the full international format for backend
    const fullNumber = limitedDigits ? `+94${limitedDigits}` : '';

    // Call the onChange with both display and full values
    onChange(name, displayValue, fullNumber);
  };

  return (
    <div className="relative">
      <div className="flex">
        {/* Country Code Display */}
        <div
          className="flex items-center px-4 py-4 rounded-l-xl border-2 border-r-0"
          style={{
            borderColor: '#E5E7EB',
            backgroundColor: '#F9FAFB',
            color: '#6B7280',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          +94
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          name={name}
          value={localNumber.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3').trim()}
          onChange={handleInputChange}
          required={required}
          className={`flex-1 px-6 py-4 rounded-r-xl border-2 transition-all duration-200 focus:outline-none focus:border-teal-500 ${className}`}
          style={{
            borderColor: '#E5E7EB',
            backgroundColor: '#FFFFFF',
            color: '#2C3E50',
            fontSize: '16px',
            ...style
          }}
          placeholder={placeholder}
          maxLength={11} // Account for spaces: "77 123 4567"
        />
      </div>

      {/* Helper text */}
      <p className="text-sm mt-1 text-gray-500">
        Enter your 9-digit mobile number (e.g., 771234567)
      </p>
    </div>
  );
}