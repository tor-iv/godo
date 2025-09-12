/**
 * HttpClient Tests
 * Comprehensive tests for the HTTP client implementation
 */

import { HttpClient } from '../../godo-app/src/api/HttpClient';
import { SecureStorage } from '../../godo-app/src/utils/storage/SecureStorage';
import { ApiError, NetworkError, TimeoutError } from '../../godo-app/src/api/HttpClient';

// Mock dependencies
jest.mock('axios');
jest.mock('@react-native-community/netinfo');
jest.mock('../../godo-app/src/utils/storage/SecureStorage');

// Mock axios
const mockAxios = {
  create: jest.fn(() => ({
    request: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  post: jest.fn(),
};

// Mock NetInfo
const mockNetInfo = {
  addEventListener: jest.fn(),
};

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockSecureStorage: jest.Mocked<SecureStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (HttpClient as any).instance = undefined;
    
    // Mock SecureStorage
    mockSecureStorage = {
      getSecureItem: jest.fn(),
      setSecureItem: jest.fn(),
      removeSecureItem: jest.fn(),
      getInstance: jest.fn(() => mockSecureStorage),
    } as any;

    (SecureStorage.getInstance as jest.Mock).mockReturnValue(mockSecureStorage);
    
    // Mock axios create
    (mockAxios.create as jest.Mock).mockReturnValue({
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    });

    // Mock NetInfo
    (mockNetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
      });
      return jest.fn(); // unsubscribe function
    });

    httpClient = HttpClient.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = HttpClient.getInstance();
      const instance2 = HttpClient.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    it('should create ApiError for 400 status', () => {
      const error = new Error('Bad Request');
      (error as any).response = {
        status: 400,
        data: { message: 'Invalid request' },
      };

      const apiError = (httpClient as any).handleError(error);
      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.statusCode).toBe(400);
    });

    it('should create NetworkError for network failures', () => {
      const error = new Error('Network Error');
      const networkError = (httpClient as any).handleError(error);
      expect(networkError).toBeInstanceOf(NetworkError);
    });

    it('should create TimeoutError for timeout', () => {
      const error = new Error('timeout of 5000ms exceeded');
      (error as any).code = 'ECONNABORTED';
      const timeoutError = (httpClient as any).handleError(error);
      expect(timeoutError).toBeInstanceOf(TimeoutError);
    });

    it('should handle validation errors (422)', () => {
      const error = new Error('Validation failed');
      (error as any).response = {
        status: 422,
        data: { 
          message: 'Validation failed',
          errors: { email: ['Email is required'] },
        },
      };

      const apiError = (httpClient as any).handleError(error);
      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.statusCode).toBe(422);
      expect(apiError.errors).toEqual({ email: ['Email is required'] });
    });
  });

  describe('Authentication Token Handling', () => {
    it('should add auth token to requests', async () => {
      const mockToken = 'test-token';
      mockSecureStorage.getSecureItem.mockResolvedValue(mockToken);

      const mockAxiosInstance = {
        request: jest.fn().mockResolvedValue({
          data: { success: true, data: {} },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      (mockAxios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      // Simulate request interceptor
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };
      await requestInterceptor(config);

      expect(config.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should refresh token on 401 error', async () => {
      const mockAxiosInstance = {
        request: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      // Mock refresh token response
      mockAxios.post.mockResolvedValue({
        data: {
          data: {
            tokens: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
            },
          },
        },
      });

      mockSecureStorage.getSecureItem.mockResolvedValue('refresh-token');
      mockSecureStorage.setSecureItem.mockResolvedValue(undefined);

      (mockAxios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      // Simulate 401 error and retry
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const error = {
        response: { status: 401 },
        config: { _retry: false, headers: {} },
      };

      // Should attempt token refresh
      await expect(responseInterceptor(error)).resolves.toBeUndefined();
      expect(mockSecureStorage.setSecureItem).toHaveBeenCalledWith(
        expect.any(String),
        'new-access-token'
      );
    });
  });

  describe('Caching', () => {
    it('should cache successful responses', () => {
      const testData = { id: 1, name: 'Test' };
      httpClient['setCache']('test-key', testData, 60000);

      const cachedData = httpClient['getFromCache']('test-key');
      expect(cachedData).toEqual(testData);
    });

    it('should return null for expired cache', () => {
      const testData = { id: 1, name: 'Test' };
      httpClient['setCache']('test-key', testData, -1000); // Expired

      const cachedData = httpClient['getFromCache']('test-key');
      expect(cachedData).toBeNull();
    });

    it('should clear cache by pattern', () => {
      httpClient['setCache']('events_1', {}, 60000);
      httpClient['setCache']('events_2', {}, 60000);
      httpClient['setCache']('users_1', {}, 60000);

      httpClient.clearCache('events');

      expect(httpClient['getFromCache']('events_1')).toBeNull();
      expect(httpClient['getFromCache']('events_2')).toBeNull();
      expect(httpClient['getFromCache']('users_1')).not.toBeNull();
    });
  });

  describe('Network State Management', () => {
    it('should queue requests when offline', async () => {
      // Set offline state
      httpClient['isOnline'] = false;

      const promise = httpClient.get('/test');
      
      // Verify request is queued
      expect(httpClient['requestQueue']).toHaveLength(1);

      // Set online and process queue
      httpClient['isOnline'] = true;
      await httpClient['processQueuedRequests']();

      // Queue should be empty after processing
      expect(httpClient['requestQueue']).toHaveLength(0);
    });

    it('should throw NetworkError when offline and not queuing', async () => {
      httpClient['isOnline'] = false;

      // Mock makeRequest to throw NetworkError immediately
      jest.spyOn(httpClient as any, 'makeRequest').mockRejectedValue(
        new NetworkError('No internet connection')
      );

      await expect(httpClient.get('/test')).rejects.toThrow(NetworkError);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      const mockAxiosInstance = {
        request: jest.fn()
          .mockRejectedValueOnce(new Error('Server Error'))
          .mockResolvedValueOnce({ data: { success: true, data: {} } }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      (mockAxios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      const result = await httpClient.get('/test', undefined, {
        retry: { attempts: 2, delay: 100 },
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('should not retry on 401 errors', () => {
      const error = new Error('Unauthorized');
      (error as any).response = { status: 401 };

      const shouldRetry = httpClient['shouldRetry'](error as any);
      expect(shouldRetry).toBe(false);
    });

    it('should retry on 500 errors', () => {
      const error = new Error('Server Error');
      (error as any).response = { status: 500 };

      const shouldRetry = httpClient['shouldRetry'](error as any);
      expect(shouldRetry).toBe(true);
    });
  });

  describe('HTTP Methods', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        request: jest.fn().mockResolvedValue({
          data: { success: true, data: {} },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      (mockAxios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
      httpClient['axiosInstance'] = mockAxiosInstance;
    });

    it('should make GET request', async () => {
      await httpClient.get('/test', { param1: 'value1' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          params: { param1: 'value1' },
        })
      );
    });

    it('should make POST request', async () => {
      const data = { name: 'test' };
      await httpClient.post('/test', data);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/test',
          data,
        })
      );
    });

    it('should make PUT request', async () => {
      const data = { id: 1, name: 'updated' };
      await httpClient.put('/test/1', data);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          url: '/test/1',
          data,
        })
      );
    });

    it('should make DELETE request', async () => {
      await httpClient.delete('/test/1');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: '/test/1',
        })
      );
    });
  });

  describe('Utility Methods', () => {
    it('should return network state', () => {
      const networkState = httpClient.getNetworkState();
      expect(networkState).toHaveProperty('isConnected');
    });

    it('should return network availability', () => {
      const isAvailable = httpClient.isNetworkAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should return cache stats', () => {
      httpClient['setCache']('test-key', {}, 60000);
      const stats = httpClient.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(stats.keys).toContain('test-key');
    });
  });
});