"use client";

import { useState, useEffect } from 'react';
import { apiClient, handleApiError } from '@/lib/api';

interface User {
  id: string;
  email?: string;
  phone?: string;
  user_type: 'hospital' | 'operations' | 'collection_center' | 'rider';
  status: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const isValidToken = (token: string): boolean => {
    try {
      // Check if token has proper JWT format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Decode the payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      // Validate token format and expiration before making API call
      if (!isValidToken(token)) {
        console.warn('Invalid or expired token found, clearing auth state');
        localStorage.removeItem('auth_token');
        apiClient.clearToken();
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      // Set token in API client before making the request
      apiClient.setToken(token);
      
      const response = await apiClient.getProfile();
      if (response.success && response.data && typeof response.data === 'object' && response.data !== null && 'user' in response.data) {
        setAuthState({
          user: (response.data as any).user as User,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        localStorage.removeItem('auth_token');
        apiClient.clearToken();
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      apiClient.clearToken();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('useAuth: Starting login process');
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await apiClient.login(email, password);
      console.log('useAuth: API response:', response);
      
      if (response.success && response.data) {
        const { access_token, user } = response.data;
        console.log('useAuth: Setting token and updating auth state');
        apiClient.setToken(access_token);
        setAuthState({
          user: user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return response;
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('useAuth: Login error:', error);
      const errorMessage = handleApiError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    user_type: string;
    name: string;
    organization: string;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await apiClient.register(userData);
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Registration failed');
      }
      
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await apiClient.verifyEmail(email, otp);
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Email verification failed');
      }
      
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      apiClient.clearToken();
    }
  };

  const refreshToken = async () => {
    try {
      const response = await apiClient.refreshToken();
      if (response.success && response.data?.access_token) {
        apiClient.setToken(response.data.access_token);
        return response;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    register,
    verifyEmail,
    refreshToken,
    checkAuthStatus: checkAuth,
    clearError,
  };
}