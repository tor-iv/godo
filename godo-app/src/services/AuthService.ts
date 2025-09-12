/**
 * Authentication Service
 * Handles authentication API calls and token management
 */

import { HttpClient } from '../api/HttpClient';
import { API_ENDPOINTS } from '../config/api.config';
import { SecureStorage, STORAGE_KEYS } from '../utils/storage/SecureStorage';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthTokens,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  ApiResponse,
} from '../api/types';
import { User } from '../types';

/**
 * AuthService class
 * Singleton service for handling authentication operations
 */
export class AuthService {
  private static instance: AuthService;
  private httpClient: HttpClient;
  private secureStorage: SecureStorage;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
    this.secureStorage = SecureStorage.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Add device information to login request
      const deviceId = await this.getOrCreateDeviceId();
      const enhancedCredentials = {
        ...credentials,
        deviceId,
        deviceName: 'React Native Device', // Could be made more specific
      };

      const response = await this.httpClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        enhancedCredentials
      );

      if (response.success && response.data) {
        // Store authentication data
        await this.storeAuthData(response.data.tokens, response.data.user);
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('AuthService: Login failed:', error);
      throw new Error(
        error.message || 'Login failed. Please check your credentials.'
      );
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await this.httpClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );

      if (response.success && response.data) {
        // Store authentication data
        await this.storeAuthData(response.data.tokens, response.data.user);
        return response.data;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('AuthService: Registration failed:', error);
      throw new Error(
        error.message || 'Registration failed. Please try again.'
      );
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout API to invalidate tokens
      await this.httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('AuthService: Logout API call failed:', error);
    } finally {
      // Always clear local storage
      await this.clearAuthData();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    try {
      const refreshToken = await this.secureStorage.getSecureItem(
        STORAGE_KEYS.REFRESH_TOKEN
      );

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const request: RefreshTokenRequest = { refreshToken };
      const response = await this.httpClient.post<{ tokens: AuthTokens }>(
        API_ENDPOINTS.AUTH.REFRESH,
        request
      );

      if (response.success && response.data) {
        // Store new tokens
        await Promise.all([
          this.secureStorage.setSecureItem(
            STORAGE_KEYS.ACCESS_TOKEN,
            response.data.tokens.accessToken
          ),
          this.secureStorage.setSecureItem(
            STORAGE_KEYS.REFRESH_TOKEN,
            response.data.tokens.refreshToken
          ),
        ]);

        return response.data.tokens;
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error: any) {
      console.error('AuthService: Token refresh failed:', error);

      // Clear auth data on refresh failure
      await this.clearAuthData();

      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.httpClient.get<User>(
        API_ENDPOINTS.USER.PROFILE,
        undefined,
        { cache: true, cacheKey: 'current_user', cacheTTL: 5 * 60 * 1000 } // 5 minutes cache
      );

      if (response.success && response.data) {
        // Update stored user profile
        await this.secureStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          response.data
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get user profile');
      }
    } catch (error: any) {
      console.error('AuthService: Get current user failed:', error);
      throw new Error('Failed to load user profile');
    }
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    try {
      const response = await this.httpClient.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        request
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      console.error('AuthService: Forgot password failed:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    try {
      // Validate passwords match
      if (request.password !== request.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await this.httpClient.post(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        request
      );

      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error: any) {
      console.error('AuthService: Reset password failed:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await this.httpClient.post(
        API_ENDPOINTS.AUTH.VERIFY_EMAIL,
        { token }
      );

      if (!response.success) {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error: any) {
      console.error('AuthService: Email verification failed:', error);
      throw new Error(error.message || 'Failed to verify email');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.secureStorage.getSecureItem(
        STORAGE_KEYS.ACCESS_TOKEN
      );

      if (!accessToken) {
        return false;
      }

      // Check if token is expired
      if (this.isTokenExpired(accessToken)) {
        // Try to refresh token
        try {
          await this.refreshToken();
          return true;
        } catch (error) {
          await this.clearAuthData();
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await this.secureStorage.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('AuthService: Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;

      // Add 5 minute buffer to refresh before actual expiry
      return payload.exp < now + 300;
    } catch (error) {
      // If we can't parse the token, consider it expired
      return true;
    }
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(tokens: AuthTokens, user: User): Promise<void> {
    try {
      await Promise.all([
        this.secureStorage.setSecureItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          tokens.accessToken
        ),
        this.secureStorage.setSecureItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          tokens.refreshToken
        ),
        this.secureStorage.setItem(STORAGE_KEYS.USER_PROFILE, user),
      ]);
    } catch (error) {
      console.error('AuthService: Failed to store auth data:', error);
      throw new Error('Failed to save authentication data');
    }
  }

  /**
   * Clear all authentication data
   */
  private async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        this.secureStorage.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
        this.secureStorage.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
        this.secureStorage.removeItem(STORAGE_KEYS.USER_PROFILE),
        this.secureStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES),
      ]);

      // Clear HTTP client cache
      this.httpClient.clearCache();
    } catch (error) {
      console.error('AuthService: Failed to clear auth data:', error);
    }
  }

  /**
   * Get or create device ID for login tracking
   */
  private async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await this.secureStorage.getItem<string>(
        STORAGE_KEYS.DEVICE_ID
      );

      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.secureStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
      }

      return deviceId;
    } catch (error) {
      // Fallback device ID if storage fails
      return `temp_device_${Date.now()}`;
    }
  }

  /**
   * Get authentication status info
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    tokenExpiry: Date | null;
  }> {
    try {
      const [accessToken, user] = await Promise.all([
        this.secureStorage.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
        this.secureStorage.getItem<User>(STORAGE_KEYS.USER_PROFILE),
      ]);

      let tokenExpiry: Date | null = null;
      let isAuthenticated = false;

      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          tokenExpiry = new Date(payload.exp * 1000);
          isAuthenticated = !this.isTokenExpired(accessToken);
        } catch (error) {
          isAuthenticated = false;
        }
      }

      return {
        isAuthenticated,
        user,
        tokenExpiry,
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        user: null,
        tokenExpiry: null,
      };
    }
  }
}
