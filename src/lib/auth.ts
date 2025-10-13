import apiClient from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  hospitalId: string;
  hospitalName: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthManager {
  private listeners: ((state: AuthState) => void)[] = [];
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  };

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.state = {
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          };
          apiClient.setToken(token);
        } catch (error) {
          this.clearAuth();
        }
      } else {
        this.state.isLoading = false;
      }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.setState({ ...this.state, isLoading: true });
      
      const response = await apiClient.login(email, password);
      
      this.setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }

      apiClient.setToken(response.token);
      
      return { success: true };
    } catch (error) {
      this.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }
    
    this.clearAuth();
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiClient.refreshToken();
      
      this.setState({
        ...this.state,
        token: response.token,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
      }

      apiClient.setToken(response.token);
      return true;
    } catch (error) {
      this.clearAuth();
      return false;
    }
  }

  private clearAuth() {
    this.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    apiClient.clearToken();
  }

  private setState(newState: AuthState) {
    this.state = newState;
    this.listeners.forEach(listener => listener(newState));
  }

  getState(): AuthState {
    return this.state;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    if (!this.state.token) {
      return false;
    }

    if (this.isTokenExpired(this.state.token)) {
      const refreshed = await this.refreshToken();
      return refreshed;
    }

    return true;
  }
}

export const authManager = new AuthManager();
export default authManager;