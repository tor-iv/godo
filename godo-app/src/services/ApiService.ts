import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import { UserCredentials } from '../types';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  private async setAccessToken(token: string | null): Promise<void> {
    this.accessToken = token;
    if (token) {
      await AsyncStorage.setItem('access_token', token);
    } else {
      await AsyncStorage.removeItem('access_token');
    }
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;

      const headers = {
        ...API_CONFIG.HEADERS,
        ...options.headers,
      };

      // Add authorization header if we have a token
      const token = await this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || data.detail || 'Request failed',
          data: null,
        };
      }

      return { data, error: undefined };
    } catch (error: any) {
      console.error('API Request failed:', error);
      return {
        error: error.message || 'Network error',
        data: null,
      };
    }
  }

  // Authentication methods
  async signUp(credentials: UserCredentials): Promise<ApiResponse> {
    const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        full_name: credentials.name || '', // Optional for now
      }),
    });

    if (response.data?.access_token) {
      await this.setAccessToken(response.data.access_token);
    }

    return response;
  }

  async signIn(credentials: UserCredentials): Promise<ApiResponse> {
    // FastAPI OAuth2 expects form data for login
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.SIGNIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (response.data?.access_token) {
      await this.setAccessToken(response.data.access_token);
    }

    return response;
  }

  async signOut(): Promise<ApiResponse> {
    const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.SIGNOUT, {
      method: 'POST',
    });

    // Clear token regardless of response
    await this.setAccessToken(null);

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.ME);
  }

  async getUserProfile(): Promise<ApiResponse> {
    return this.makeRequest(API_CONFIG.ENDPOINTS.USERS.PROFILE);
  }

  async updateUserProfile(profile: any): Promise<ApiResponse> {
    return this.makeRequest(API_CONFIG.ENDPOINTS.USERS.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest('/health');
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    const response = await this.getCurrentUser();
    return !response.error;
  }
}

export default ApiService.getInstance();