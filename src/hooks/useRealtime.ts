"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/lib/types';

export function useRealtime() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('auth_token'),
      },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribe = <T extends keyof SocketEvents>(
    event: T,
    callback: (data: SocketEvents[T]) => void
  ) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };

  const emit = <T extends keyof SocketEvents>(
    event: T,
    data: SocketEvents[T]
  ) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  return {
    socket,
    isConnected,
    subscribe,
    emit,
  };
}

// Specific hooks for different real-time features
export function useOrderUpdates() {
  const { subscribe } = useRealtime();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeOrderCreated = subscribe('order_created', (order) => {
      setOrders(prev => [order, ...prev]);
    });

    const unsubscribeOrderUpdated = subscribe('order_updated', (order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    });

    const unsubscribeStatusChanged = subscribe('order_status_changed', (data) => {
      setOrders(prev => prev.map(o => 
        o.id === data.orderId 
          ? { ...o, status: data.newStatus }
          : o
      ));
    });

    return () => {
      unsubscribeOrderCreated();
      unsubscribeOrderUpdated();
      unsubscribeStatusChanged();
    };
  }, [subscribe]);

  return { orders, setOrders };
}

export function useRiderTracking() {
  const { subscribe } = useRealtime();
  const [riderLocations, setRiderLocations] = useState<{ [riderId: string]: any }>({});

  useEffect(() => {
    const unsubscribe = subscribe('rider_location_update', (location) => {
      setRiderLocations(prev => ({
        ...prev,
        [location.riderId]: location,
      }));
    });

    return unsubscribe;
  }, [subscribe]);

  return { riderLocations };
}

export function useNotifications() {
  const { subscribe } = useRealtime();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('alert_triggered', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return unsubscribe;
  }, [subscribe]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: true }
          : n
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.isRead).length,
  };
}