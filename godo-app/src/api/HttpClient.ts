/**
 * HTTP Client
 * Robust HTTP client built on Axios with comprehensive error handling,
 * retry logic, caching, and authentication
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import NetInfo from '@react-native-community/netinfo';
import {
  getApiConfig,
  HTTP_STATUS,
  getCurrentEnvironment,
} from '../config/api.config';
import { SecureStorage, STORAGE_KEYS } from '../utils/storage/SecureStorage';
import {
  ApiResponse,
  ApiErrorResponse,
  NetworkState,
  RetryConfig,
  CacheItem,
  RequestInterceptorConfig,
} from './types';

/**
 * Custom Error Classes
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'API_ERROR',
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * HTTP Client Class
 */
export class HttpClient {
  private static instance: HttpClient;
  private axiosInstance: AxiosInstance;
  private secureStorage: SecureStorage;
  private networkState: NetworkState = { isConnected: true };
  private cache: Map<string, CacheItem> = new Map();
  private requestQueue: Array<() => Promise<any>> = [];
  private isOnline: boolean = true;

  private constructor() {
    this.secureStorage = SecureStorage.getInstance();
    this.setupNetworkMonitoring();
    this.createAxiosInstance();
    this.setupInterceptors();
  }

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Create Axios instance with configuration
   */
  private createAxiosInstance(): void {
    const config = getApiConfig();

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-App-Version': '1.0.0',
        'X-Platform': 'react-native',
      },
    });
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      this.networkState = {
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
        isWifiEnabled: state.isWifiEnabled ?? false,
      };

      const wasOffline = !this.isOnline;
      this.isOnline = this.networkState.isConnected;

      // Process queued requests when coming back online
      if (wasOffline && this.isOnline && this.requestQueue.length > 0) {
        this.processQueuedRequests();
      }
    });
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Check network connectivity
        if (!this.isOnline) {
          throw new NetworkError('No internet connection');
        }

        // Add authentication token
        const token = await this.secureStorage.getSecureItem(
          STORAGE_KEYS.ACCESS_TOKEN
        );
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (config.headers) {
          config.headers['X-Request-ID'] = requestId;
        }

        // Log request in development
        const env = getCurrentEnvironment();
        // Request logging disabled in production

        return config;
      },
      (error: AxiosError) => {
        // Request interceptor error - authentication may be required
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        const env = getCurrentEnvironment();
        // Response logging disabled in production

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle token refresh for 401 errors
        if (
          error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const token = await this.secureStorage.getSecureItem(
              STORAGE_KEYS.ACCESS_TOKEN
            );
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.handleAuthenticationFailure();
            throw new ApiError(
              'Authentication failed',
              HTTP_STATUS.UNAUTHORIZED,
              'AUTH_FAILED'
            );
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Error {
    const env = getCurrentEnvironment();

    // API error handled - returning appropriate error type

    // Network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new TimeoutError('Request timeout - please try again');
      }
      return new NetworkError('Network connection failed');
    }

    // API errors
    const response = error.response.data as ApiErrorResponse;
    const statusCode = error.response.status;

    switch (statusCode) {
      case HTTP_STATUS.UNAUTHORIZED:
        return new ApiError(
          'Authentication required',
          statusCode,
          'AUTH_REQUIRED'
        );

      case HTTP_STATUS.FORBIDDEN:
        return new ApiError('Access denied', statusCode, 'ACCESS_DENIED');

      case HTTP_STATUS.NOT_FOUND:
        return new ApiError('Resource not found', statusCode, 'NOT_FOUND');

      case HTTP_STATUS.VALIDATION_ERROR:
        return new ApiError(
          response.message || 'Validation failed',
          statusCode,
          'VALIDATION_ERROR',
          response.errors
        );

      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return new ApiError(
          'Too many requests - please wait',
          statusCode,
          'RATE_LIMITED'
        );

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
      case HTTP_STATUS.GATEWAY_TIMEOUT:
        return new ApiError(
          'Server error - please try again later',
          statusCode,
          'SERVER_ERROR'
        );

      default:
        return new ApiError(
          response.message || 'An unexpected error occurred',
          statusCode,
          'UNKNOWN_ERROR'
        );
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = await this.secureStorage.getSecureItem(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${getApiConfig().baseUrl}/auth/refresh`,
        {
          refreshToken,
        }
      );

      const { accessToken, refreshToken: newRefreshToken } =
        response.data.data.tokens;

      await this.secureStorage.setSecureItem(
        STORAGE_KEYS.ACCESS_TOKEN,
        accessToken
      );
      await this.secureStorage.setSecureItem(
        STORAGE_KEYS.REFRESH_TOKEN,
        newRefreshToken
      );
    } catch (error) {
      // Clear tokens on refresh failure
      await this.secureStorage.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
      await this.secureStorage.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
      throw error;
    }
  }

  /**
   * Handle authentication failure
   */
  private async handleAuthenticationFailure(): Promise<void> {
    // Clear all auth data
    await this.secureStorage.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    await this.secureStorage.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
    await this.secureStorage.removeItem(STORAGE_KEYS.USER_PROFILE);

    // Clear cache
    this.clearCache();

    // Note: In a real app, you'd navigate to login screen here
    // This would be handled by your auth context/navigation
  }

  /**
   * Process queued requests when network comes back online
   */
  private async processQueuedRequests(): Promise<void> {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of queue) {
      try {
        await request();
      } catch (error) {
        // Queued request failed - continuing with remaining requests
      }
    }
  }

  /**
   * Generic request method with retry logic
   */
  private async makeRequest<T>(
    config: AxiosRequestConfig,
    options?: {
      retry?: RetryConfig;
      cache?: boolean;
      cacheKey?: string;
      cacheTTL?: number;
    }
  ): Promise<ApiResponse<T>> {
    const { retry, cache = false, cacheKey, cacheTTL } = options || {};

    // Check cache first
    if (cache && cacheKey) {
      const cachedData = this.getFromCache<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Queue request if offline
    if (!this.isOnline) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const result = await this.makeRequest<T>(config, options);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    const maxAttempts = retry?.attempts || getApiConfig().retryAttempts;
    const delay = retry?.delay || getApiConfig().retryDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response =
          await this.axiosInstance.request<ApiResponse<T>>(config);

        // Cache successful responses
        if (cache && cacheKey && response.data) {
          this.setCache(cacheKey, response.data, cacheTTL);
        }

        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;
        const shouldRetry = this.shouldRetry(error as AxiosError, retry);

        if (isLastAttempt || !shouldRetry) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: AxiosError, retryConfig?: RetryConfig): boolean {
    // Don't retry on authentication errors
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      return false;
    }

    // Don't retry on client errors (4xx)
    if (
      error.response?.status &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      return false;
    }

    // Check custom retry conditions
    if (retryConfig?.retryOn) {
      return retryConfig.retryOn.includes(error.response?.status || 0);
    }

    // Retry on network errors and server errors (5xx)
    return !error.response || error.response.status >= 500;
  }

  /**
   * Cache methods
   */
  private setCache<T>(key: string, data: T, ttl?: number): void {
    const config = getApiConfig();
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || config.cacheTTL,
      key,
    };
    this.cache.set(key, item);
  }

  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if cache item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  public clearCache(pattern?: string): void {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Public API methods
   */
  public async get<T>(
    url: string,
    params?: any,
    options?: RequestInterceptorConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'GET', url, params }, options);
  }

  public async post<T>(
    url: string,
    data?: any,
    options?: RequestInterceptorConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'POST', url, data }, options);
  }

  public async put<T>(
    url: string,
    data?: any,
    options?: RequestInterceptorConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'PUT', url, data }, options);
  }

  public async patch<T>(
    url: string,
    data?: any,
    options?: RequestInterceptorConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'PATCH', url, data }, options);
  }

  public async delete<T>(
    url: string,
    options?: RequestInterceptorConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'DELETE', url }, options);
  }

  /**
   * Utility methods
   */
  public getNetworkState(): NetworkState {
    return this.networkState;
  }

  public isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export default HttpClient.getInstance();
