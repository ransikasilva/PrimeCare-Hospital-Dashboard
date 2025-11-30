"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Users, Package } from 'lucide-react';

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

        // Search collection centers
        const centersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection-centers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (centersRes.ok) {
          const centersData = await centersRes.json();
          if (centersData?.data?.centers) {
            centersData.data.centers.forEach((center: any) => {
              if (center.center_name?.toLowerCase().includes(query)) {
                results.push({
                  type: 'center',
                  id: center.id,
                  title: center.center_name,
                  subtitle: center.address || 'Collection Center',
                  icon: Building2
                });
              }
            });
          }
        }

        // Search riders
        const ridersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/riders`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (ridersRes.ok) {
          const ridersData = await ridersRes.json();
          if (ridersData?.data?.riders) {
            ridersData.data.riders.forEach((rider: any) => {
              if (rider.rider_name?.toLowerCase().includes(query) || rider.rider_id?.toLowerCase().includes(query)) {
                results.push({
                  type: 'rider',
                  id: rider.id,
                  title: rider.rider_name,
                  subtitle: `${rider.availability_status || 'Unknown'} • ${rider.vehicle_type || 'Vehicle'}`,
                  icon: Users
                });
              }
            });
          }
        }

        // Search orders
        const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?limit=50`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData?.data?.orders) {
            ordersData.data.orders.forEach((order: any) => {
              if (order.order_number?.toLowerCase().includes(query)) {
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
        }

        setSearchResults(results.slice(0, 10));
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
