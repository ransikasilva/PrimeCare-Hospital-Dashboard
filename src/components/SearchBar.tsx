"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Users, Package } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface SearchResult {
  type: 'center' | 'rider' | 'order';
  id: string;
  title: string;
  subtitle: string;
  icon: any;
}

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const query = searchQuery.toLowerCase();
        const results: SearchResult[] = [];

        // Get hospital-specific data using existing endpoints
        const [ridersResponse, ordersResponse] = await Promise.all([
          apiClient.getMyHospitalRiders(),
          apiClient.getHospitalOrders({ limit: 100 })
        ]);

        console.log('Riders response:', ridersResponse);
        console.log('Orders response:', ordersResponse);

        // Search riders
        if (ridersResponse.success && ridersResponse.data) {
          const riders = ridersResponse.data.riders || ridersResponse.data || [];
          console.log('Total riders:', riders.length);

          riders.forEach((rider: any) => {
            const nameMatch = rider.rider_name?.toLowerCase().includes(query);
            const phoneMatch = rider.phone?.includes(query);

            if (nameMatch || phoneMatch) {
              results.push({
                type: 'rider',
                id: rider.id,
                title: rider.rider_name,
                subtitle: `${rider.availability_status || rider.rider_status || 'Rider'} • ${rider.vehicle_type || 'Vehicle'}`,
                icon: Users
              });
            }
          });
        }

        // Search orders and extract collection centers
        if (ordersResponse.success && ordersResponse.data) {
          const orders = ordersResponse.data.orders || ordersResponse.data || [];
          console.log('Total orders:', orders.length);

          // Extract unique collection centers FIRST
          const centersMap = new Map();
          orders.forEach((order: any) => {
            if (order.center_id && order.center_name) {
              if (!centersMap.has(order.center_id)) {
                centersMap.set(order.center_id, {
                  id: order.center_id,
                  name: order.center_name,
                  address: order.collection_center_address || order.center_address || ''
                });
              }
            }
          });

          console.log('Total centers:', centersMap.size);

          // Search collection centers
          centersMap.forEach((center) => {
            if (center.name?.toLowerCase().includes(query) ||
                center.address?.toLowerCase().includes(query)) {
              results.push({
                type: 'center',
                id: center.id,
                title: center.name,
                subtitle: center.address || 'Collection Center',
                icon: Building2
              });
            }
          });

          // Search orders
          orders.forEach((order: any) => {
            const orderMatch = order.order_number?.toLowerCase().includes(query);
            const centerMatch = order.center_name?.toLowerCase().includes(query);

            if (orderMatch || centerMatch) {
              results.push({
                type: 'order',
                id: order.id,
                title: order.order_number,
                subtitle: `${order.center_name || 'Unknown'} • ${order.status || 'Pending'}`,
                icon: Package
              });
            }
          });
        }

        // Sort results: centers first, then riders, then orders
        const sortedResults = [
          ...results.filter(r => r.type === 'center'),
          ...results.filter(r => r.type === 'rider'),
          ...results.filter(r => r.type === 'order')
        ];

        console.log('Search results:', sortedResults);
        setSearchResults(sortedResults.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'center') router.push(`/centers?id=${result.id}`);
    else if (result.type === 'rider') router.push(`/riders?id=${result.id}`);
    else if (result.type === 'order') router.push(`/orders?id=${result.id}`);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search centers, riders, orders..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-2xl border-0 text-gray-800 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)'
        }}
      />
      {searchQuery && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl border-0 overflow-hidden z-50 max-h-96 overflow-y-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="p-2">
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
            </div>
            <div className="space-y-1">
              {isSearching ? (
                <div className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No results found
                </div>
              ) : (
                searchResults.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <div
                      key={index}
                      onClick={() => handleResultClick(result)}
                      className="px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors duration-200 flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{result.title}</div>
                        <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
