/**
 * @fileoverview API Integration tests for User operations
 * @author Testing Team
 * @testtype API Integration
 * @description Tests for user-related API endpoints including CRUD operations, validation, and error handling
 */

import { jest } from '@jest/globals';
import { 
  createMockUser, 
  createMockUserCreate, 
  createMockUserUpdate,
  createMockAuthToken,
  mockAPIResponses,
  invalidUserData 
} from '../../mocks/userMocks';

// Mock fetch globally
global.fetch = jest.fn();

// Mock API base URL
const API_BASE_URL = 'https://api.godo.app/v1';

// User API service
class UserAPI {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async refreshToken() {
    return this.request('/auth/refresh', { method: 'POST' });
  }

  // User profile endpoints
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateProfile(userData: any) {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deleteAccount() {
    return this.request('/users/me', { method: 'DELETE' });
  }

  async getUserProfile(userId: string) {
    return this.request(`/users/${userId}`);
  }

  // User preferences endpoints
  async getPreferences() {
    return this.request('/users/me/preferences');
  }

  async updatePreferences(preferences: any) {
    return this.request('/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Profile image endpoints
  async uploadProfileImage(imageData: FormData) {
    return this.request('/users/me/avatar', {
      method: 'POST',
      body: imageData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async deleteProfileImage() {
    return this.request('/users/me/avatar', { method: 'DELETE' });
  }

  // Password management
  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return this.request('/users/me/password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async resetPasswordRequest(email: string) {
    return this.request('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
    });
  }
}

describe('User API Integration Tests', () => {
  let userAPI: UserAPI;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    userAPI = new UserAPI(API_BASE_URL);
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/login', () => {
      it('should successfully login with valid credentials', async () => {
        const credentials = { email: 'test@example.com', password: 'password123' };
        const mockResponse = mockAPIResponses.loginSuccess;
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse.data),
        } as Response);

        const result = await userAPI.login(credentials);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/auth/login`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify(credentials),
          })
        );

        expect(result).toEqual(mockResponse.data);
      });

      it('should handle login failure with invalid credentials', async () => {
        const credentials = { email: 'wrong@example.com', password: 'wrongpass' };
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials' }),
        } as Response);

        await expect(userAPI.login(credentials)).rejects.toThrow('Invalid credentials');
      });

      it('should handle network errors during login', async () => {
        const credentials = { email: 'test@example.com', password: 'password123' };
        
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(userAPI.login(credentials)).rejects.toThrow('Network error');
      });
    });

    describe('POST /auth/register', () => {
      it('should successfully register new user', async () => {
        const userData = createMockUserCreate();
        const mockResponse = mockAPIResponses.userCreated;
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockResponse.data),
        } as Response);

        const result = await userAPI.register(userData);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/auth/register`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(userData),
          })
        );

        expect(result).toEqual(mockResponse.data);
      });

      it('should handle validation errors during registration', async () => {
        const userData = invalidUserData.invalidEmail;
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: () => Promise.resolve(mockAPIResponses.validationError),
        } as Response);

        await expect(userAPI.register(userData)).rejects.toThrow('Validation failed');
      });

      it('should handle duplicate email registration', async () => {
        const userData = createMockUserCreate({ email: 'existing@example.com' });
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: 'Email already exists' }),
        } as Response);

        await expect(userAPI.register(userData)).rejects.toThrow('Email already exists');
      });
    });

    describe('POST /auth/logout', () => {
      it('should successfully logout user', async () => {
        const authToken = 'valid-auth-token';
        userAPI.setAuthToken(authToken);
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);

        const result = await userAPI.logout();

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/auth/logout`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: `Bearer ${authToken}`,
            }),
          })
        );

        expect(result).toEqual({ success: true });
      });

      it('should handle logout with invalid token', async () => {
        userAPI.setAuthToken('invalid-token');
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid token' }),
        } as Response);

        await expect(userAPI.logout()).rejects.toThrow('Invalid token');
      });
    });

    describe('POST /auth/refresh', () => {
      it('should successfully refresh access token', async () => {
        const refreshToken = 'valid-refresh-token';
        const newToken = createMockAuthToken();
        
        userAPI.setAuthToken(refreshToken);
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newToken),
        } as Response);

        const result = await userAPI.refreshToken();

        expect(result).toEqual(newToken);
      });

      it('should handle expired refresh token', async () => {
        userAPI.setAuthToken('expired-refresh-token');
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Refresh token expired' }),
        } as Response);

        await expect(userAPI.refreshToken()).rejects.toThrow('Refresh token expired');
      });
    });
  });

  describe('User Profile Endpoints', () => {
    beforeEach(() => {
      userAPI.setAuthToken('valid-auth-token');
    });

    describe('GET /users/me', () => {
      it('should fetch current user profile', async () => {
        const mockUser = createMockUser();
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response);

        const result = await userAPI.getCurrentUser();

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me`,
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer valid-auth-token',
            }),
          })
        );

        expect(result).toEqual(mockUser);
      });

      it('should handle unauthorized access', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        } as Response);

        await expect(userAPI.getCurrentUser()).rejects.toThrow('Unauthorized');
      });
    });

    describe('PATCH /users/me', () => {
      it('should successfully update user profile', async () => {
        const updateData = createMockUserUpdate();
        const updatedUser = createMockUser(updateData);
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedUser),
        } as Response);

        const result = await userAPI.updateProfile(updateData);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updateData),
          })
        );

        expect(result).toEqual(updatedUser);
      });

      it('should handle validation errors in profile update', async () => {
        const invalidData = { age: -5 }; // Invalid age
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: () => Promise.resolve({
            error: 'Validation failed',
            details: [{ field: 'age', message: 'Age must be between 18 and 50' }],
          }),
        } as Response);

        await expect(userAPI.updateProfile(invalidData)).rejects.toThrow('Validation failed');
      });
    });

    describe('DELETE /users/me', () => {
      it('should successfully delete user account', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);

        const result = await userAPI.deleteAccount();

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );

        expect(result).toEqual({ success: true });
      });

      it('should handle account deletion failure', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: 'Cannot delete account with active events' }),
        } as Response);

        await expect(userAPI.deleteAccount()).rejects.toThrow('Cannot delete account with active events');
      });
    });

    describe('GET /users/:userId', () => {
      it('should fetch other user profile', async () => {
        const userId = 'other-user-123';
        const otherUser = createMockUser({ id: userId });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(otherUser),
        } as Response);

        const result = await userAPI.getUserProfile(userId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/${userId}`,
          expect.any(Object)
        );

        expect(result).toEqual(otherUser);
      });

      it('should handle user not found', async () => {
        const userId = 'non-existent-user';
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'User not found' }),
        } as Response);

        await expect(userAPI.getUserProfile(userId)).rejects.toThrow('User not found');
      });
    });
  });

  describe('User Preferences Endpoints', () => {
    beforeEach(() => {
      userAPI.setAuthToken('valid-auth-token');
    });

    describe('GET /users/me/preferences', () => {
      it('should fetch user preferences', async () => {
        const mockPreferences = {
          categories: ['NETWORKING', 'CULTURE'],
          neighborhoods: ['Manhattan', 'Brooklyn'],
          notifications: true,
          privacy: { showAge: false },
        };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreferences),
        } as Response);

        const result = await userAPI.getPreferences();

        expect(result).toEqual(mockPreferences);
      });
    });

    describe('PUT /users/me/preferences', () => {
      it('should update user preferences', async () => {
        const preferences = {
          categories: ['FOOD', 'NIGHTLIFE'],
          neighborhoods: ['Queens'],
          notifications: false,
        };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(preferences),
        } as Response);

        const result = await userAPI.updatePreferences(preferences);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me/preferences`,
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(preferences),
          })
        );

        expect(result).toEqual(preferences);
      });
    });
  });

  describe('Profile Image Endpoints', () => {
    beforeEach(() => {
      userAPI.setAuthToken('valid-auth-token');
    });

    describe('POST /users/me/avatar', () => {
      it('should upload profile image', async () => {
        const mockFormData = new FormData();
        mockFormData.append('avatar', 'mock-image-data');
        
        const mockResponse = {
          profile_image_url: 'https://cdn.example.com/avatars/user123.jpg',
        };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const result = await userAPI.uploadProfileImage(mockFormData);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me/avatar`,
          expect.objectContaining({
            method: 'POST',
            body: mockFormData,
          })
        );

        expect(result).toEqual(mockResponse);
      });

      it('should handle image upload failure', async () => {
        const mockFormData = new FormData();
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 413,
          json: () => Promise.resolve({ error: 'File too large' }),
        } as Response);

        await expect(userAPI.uploadProfileImage(mockFormData)).rejects.toThrow('File too large');
      });
    });

    describe('DELETE /users/me/avatar', () => {
      it('should delete profile image', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);

        const result = await userAPI.deleteProfileImage();

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me/avatar`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );

        expect(result).toEqual({ success: true });
      });
    });
  });

  describe('Password Management Endpoints', () => {
    beforeEach(() => {
      userAPI.setAuthToken('valid-auth-token');
    });

    describe('POST /users/me/password', () => {
      it('should change password successfully', async () => {
        const passwordData = {
          currentPassword: 'oldPassword123!',
          newPassword: 'newPassword456!',
        };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);

        const result = await userAPI.changePassword(passwordData);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me/password`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(passwordData),
          })
        );

        expect(result).toEqual({ success: true });
      });

      it('should handle incorrect current password', async () => {
        const passwordData = {
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword456!',
        };
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Current password is incorrect' }),
        } as Response);

        await expect(userAPI.changePassword(passwordData)).rejects.toThrow('Current password is incorrect');
      });
    });

    describe('POST /auth/password-reset', () => {
      it('should request password reset', async () => {
        const email = 'user@example.com';
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Reset email sent' }),
        } as Response);

        const result = await userAPI.resetPasswordRequest(email);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/auth/password-reset`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email }),
          })
        );

        expect(result).toEqual({ message: 'Reset email sent' });
      });
    });

    describe('POST /auth/password-reset/confirm', () => {
      it('should reset password with valid token', async () => {
        const token = 'valid-reset-token';
        const newPassword = 'newSecurePassword123!';
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);

        const result = await userAPI.resetPassword(token, newPassword);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/auth/password-reset/confirm`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ token, password: newPassword }),
          })
        );

        expect(result).toEqual({ success: true });
      });

      it('should handle expired reset token', async () => {
        const token = 'expired-token';
        const newPassword = 'newPassword123!';
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Reset token expired' }),
        } as Response);

        await expect(userAPI.resetPassword(token, newPassword)).rejects.toThrow('Reset token expired');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      userAPI.setAuthToken('valid-auth-token');
    });

    it('should handle server errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve(mockAPIResponses.serverError),
      } as Response);

      await expect(userAPI.getCurrentUser()).rejects.toThrow('Internal server error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      } as Response);

      await expect(userAPI.getCurrentUser()).rejects.toThrow('Network error');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(userAPI.getCurrentUser()).rejects.toThrow('Request timeout');
    });

    it('should handle missing authentication token', async () => {
      const apiWithoutToken = new UserAPI(API_BASE_URL);
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Authentication required' }),
      } as Response);

      await expect(apiWithoutToken.getCurrentUser()).rejects.toThrow('Authentication required');
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      } as Response);

      await expect(userAPI.getCurrentUser()).rejects.toThrow('Rate limit exceeded');
    });
  });
});