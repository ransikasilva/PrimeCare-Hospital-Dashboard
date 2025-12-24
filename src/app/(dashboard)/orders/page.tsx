"use client";

import { OrdersTable } from "@/components/OrdersTable";
import { useState } from "react";

export default function OrdersPage() {
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [statusFilter, setStatusFilter] = useState("All Status");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 
            className="font-semibold"
            style={{ 
              fontSize: '32px',
              fontWeight: '600',
              color: '#2C3E50'
            }}
          >
            Live Orders
          </h1>
          <p 
            style={{ 
              color: '#7B8794',
              fontSize: '14px',
              marginTop: '8px'
            }}
          >
            Real-time order management and tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            className="px-3 py-2 border rounded-lg transition-all duration-200 focus:border-teal-500 focus:outline-none"
            style={{
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#2C3E50'
            }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option>All Priorities</option>
            <option>Urgent</option>
            <option>Routine</option>
          </select>
          <select
            className="px-3 py-2 border rounded-lg transition-all duration-200 focus:border-teal-500 focus:outline-none"
            style={{
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#2C3E50'
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending_rider_assignment">Pending Assignment</option>
            <option value="assigned">Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: '#4ECDC4',
              color: '#FFFFFF'
            }}
            onClick={() => {
              // Refresh orders or show create modal
              console.log('Refresh orders');
            }}
          >
            Refresh Orders
          </button>
        </div>
      </div>

      <OrdersTable priorityFilter={priorityFilter} statusFilter={statusFilter} />
    </div>
  );
}