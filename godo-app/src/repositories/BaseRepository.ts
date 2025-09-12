/**
 * Base Repository
 * Abstract base class for all repository implementations
 */

import { HttpClient } from '../api/HttpClient';
import { SecureStorage } from '../utils/storage/SecureStorage';
import {
  ApiResponse,
  CacheConfig,
  RequestInterceptorConfig,
} from '../api/types';
import { getCurrentEnvironment } from '../config/api.config';

export interface RepositoryConfig {
  cache?: CacheConfig;
  retry?: {
    attempts: number;
    delay: number;
  };
}

/**
 * Abstract Base Repository Class
 */
export abstract class BaseRepository<T = any> {
  protected httpClient: HttpClient;
  protected secureStorage: SecureStorage;
  protected config: RepositoryConfig;
  protected baseEndpoint: string;

  constructor(baseEndpoint: string, config: RepositoryConfig = {}) {
    this.httpClient = HttpClient.getInstance();
    this.secureStorage = SecureStorage.getInstance();
    this.baseEndpoint = baseEndpoint;
    this.config = {
      cache: {
        ttl: 5 * 60 * 1000, // 5 minutes default
        maxSize: 100,
        strategy: 'LRU',
      },
      retry: {
        attempts: 3,
        delay: 1000,
      },
      ...config,
    };
  }

  /**
   * Build request options with default configuration
   */
  protected buildRequestOptions(
    options: Partial<RequestInterceptorConfig> = {}
  ): RequestInterceptorConfig {
    return {
      cache: options.cache ?? true,
      retry: {
        attempts: options.retry?.attempts ?? this.config.retry?.attempts ?? 3,
        delay: options.retry?.delay ?? this.config.retry?.delay ?? 1000,
        ...options.retry,
      },
      ...options,
    };
  }

  /**
   * Generate cache key for requests
   */
  protected generateCacheKey(endpoint: string, params?: any): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${this.baseEndpoint}_${endpoint}_${paramsString}`.replace(
      /[^a-zA-Z0-9_]/g,
      '_'
    );
  }

  /**
   * Handle repository errors with consistent error formatting
   */
  protected handleError(error: any, operation: string): never {
    const errorMessage = error.message || `Failed to ${operation}`;
    console.error(`${this.constructor.name}: ${operation} failed:`, error);
    throw new Error(errorMessage);
  }

  /**
   * Get with caching support
   */
  protected async get<TResponse = T>(
    endpoint: string,
    params?: any,
    options: Partial<RequestInterceptorConfig> = {}
  ): Promise<ApiResponse<TResponse>> {
    try {
      const cacheKey = this.generateCacheKey(endpoint, params);
      const requestOptions = this.buildRequestOptions({
        ...options,
        cacheKey,
        cacheTTL: this.config.cache?.ttl,
      });

      return await this.httpClient.get<TResponse>(
        `${this.baseEndpoint}${endpoint}`,
        params,
        requestOptions
      );
    } catch (error) {
      this.handleError(error, `GET ${endpoint}`);
    }
  }

  /**
   * Post with error handling
   */
  protected async post<TResponse = T>(
    endpoint: string,
    data?: any,
    options: Partial<RequestInterceptorConfig> = {}
  ): Promise<ApiResponse<TResponse>> {
    try {
      const requestOptions = this.buildRequestOptions(options);

      return await this.httpClient.post<TResponse>(
        `${this.baseEndpoint}${endpoint}`,
        data,
        requestOptions
      );
    } catch (error) {
      this.handleError(error, `POST ${endpoint}`);
    }
  }

  /**
   * Put with error handling
   */
  protected async put<TResponse = T>(
    endpoint: string,
    data?: any,
    options: Partial<RequestInterceptorConfig> = {}
  ): Promise<ApiResponse<TResponse>> {
    try {
      const requestOptions = this.buildRequestOptions(options);

      return await this.httpClient.put<TResponse>(
        `${this.baseEndpoint}${endpoint}`,
        data,
        requestOptions
      );
    } catch (error) {
      this.handleError(error, `PUT ${endpoint}`);
    }
  }

  /**
   * Patch with error handling
   */
  protected async patch<TResponse = T>(
    endpoint: string,
    data?: any,
    options: Partial<RequestInterceptorConfig> = {}
  ): Promise<ApiResponse<TResponse>> {
    try {
      const requestOptions = this.buildRequestOptions(options);

      return await this.httpClient.patch<TResponse>(
        `${this.baseEndpoint}${endpoint}`,
        data,
        requestOptions
      );
    } catch (error) {
      this.handleError(error, `PATCH ${endpoint}`);
    }
  }

  /**
   * Delete with error handling
   */
  protected async delete<TResponse = T>(
    endpoint: string,
    options: Partial<RequestInterceptorConfig> = {}
  ): Promise<ApiResponse<TResponse>> {
    try {
      const requestOptions = this.buildRequestOptions({
        ...options,
        cache: false,
      });

      return await this.httpClient.delete<TResponse>(
        `${this.baseEndpoint}${endpoint}`,
        requestOptions
      );
    } catch (error) {
      this.handleError(error, `DELETE ${endpoint}`);
    }
  }

  /**
   * Check if we should use mock data
   */
  protected shouldUseMockData(): boolean {
    const env = getCurrentEnvironment();
    return env.api.enableMockMode && env.features.mockData;
  }

  /**
   * Clear cache for this repository
   */
  public clearCache(): void {
    this.httpClient.clearCache(this.baseEndpoint);
  }

  /**
   * Get repository statistics
   */
  public getStats(): {
    baseEndpoint: string;
    cacheStats: { size: number; keys: string[] };
    config: RepositoryConfig;
  } {
    return {
      baseEndpoint: this.baseEndpoint,
      cacheStats: this.httpClient.getCacheStats(),
      config: this.config,
    };
  }
}
