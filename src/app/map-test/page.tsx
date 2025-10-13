"use client";

import { LiveMap } from "@/components/LiveMap";

export default function MapTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Map Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Google Maps Integration Test</h2>
            <p className="text-gray-600">Testing the LiveMap component with mock data</p>
          </div>
          
          <div className="p-4">
            <LiveMap />
          </div>
        </div>
        
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Expected Features:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Google Maps should load with Sri Lanka (Colombo) as center</li>
            <li>3 rider markers: Priya Silva (Available), Kamal Fernando (Busy), Sandun Perera (Offline)</li>
            <li>2 collection center markers: HealthGuard Labs, MediCare Diagnostics</li>
            <li>Hover over markers should show info windows</li>
            <li>Legend showing rider status counts and collection center counts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}