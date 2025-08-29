/**
 * @fileoverview Unit tests for User Service
 * @author Testing Team  
 * @testtype Unit
 * @description Tests for user service business logic including validation, data transformation, and caching
 */

import { jest } from '@jest/globals';
import { 
  createMockUser, 
  createMockUserUpdate, 
  createMockUserPreferences,
  mockAPIResponses,
  invalidUserData 
} from '../../mocks/userMocks';

// Mock dependencies
const mockStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockAPI = {
  getCurrentUser: jest.fn(),
  updateProfile: jest.fn(),
  getPreferences: jest.fn(),
  updatePreferences: jest.fn(),
  uploadProfileImage: jest.fn(),
  changePassword: jest.fn(),
};

// User Service implementation
class UserService {
  private api: any;
  private storage: any;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(api: any, storage: any) {
    this.api = api;
    this.storage = storage;
  }

  // User profile methods
  async getCurrentUser(useCache = true): Promise<any> {
    const cacheKey = 'current_user';
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const user = await this.api.getCurrentUser();
    
    // Cache the user data
    this.cache.set(cacheKey, {
      data: user,
      timestamp: Date.now(),
    });

    // Persist to local storage
    await this.storage.setItem('current_user', JSON.stringify(user));

    return user;
  }

  async updateProfile(userData: any): Promise<any> {
    // Validate user data
    const validationErrors = this.validateUserUpdate(userData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Sanitize data
    const sanitizedData = this.sanitizeUserData(userData);

    // Update via API
    const updatedUser = await this.api.updateProfile(sanitizedData);

    // Update cache
    this.cache.set('current_user', {
      data: updatedUser,
      timestamp: Date.now(),
    });

    // Update local storage
    await this.storage.setItem('current_user', JSON.stringify(updatedUser));

    return updatedUser;
  }

  async uploadProfileImage(imageFile: File): Promise<string> {
    // Validate image
    this.validateImageFile(imageFile);

    // Create FormData
    const formData = new FormData();
    formData.append('avatar', imageFile);

    // Upload via API
    const response = await this.api.uploadProfileImage(formData);

    // Update cached user with new image URL
    const cachedUser = this.cache.get('current_user');
    if (cachedUser) {
      cachedUser.data.profile_image_url = response.profile_image_url;
      await this.storage.setItem('current_user', JSON.stringify(cachedUser.data));
    }

    return response.profile_image_url;
  }

  // Preferences methods
  async getPreferences(): Promise<any> {
    const cacheKey = 'user_preferences';
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const preferences = await this.api.getPreferences();
    
    this.cache.set(cacheKey, {
      data: preferences,
      timestamp: Date.now(),
    });

    return preferences;
  }

  async updatePreferences(preferences: any): Promise<any> {
    // Validate preferences
    this.validatePreferences(preferences);

    // Update via API
    const updatedPreferences = await this.api.updatePreferences(preferences);

    // Update cache
    this.cache.set('user_preferences', {
      data: updatedPreferences,
      timestamp: Date.now(),
    });

    return updatedPreferences;
  }

  // Password methods
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    // Validate passwords
    this.validatePassword(newPassword);

    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    await this.api.changePassword({
      currentPassword,
      newPassword,
    });

    return true;
  }

  // Utility methods
  private validateUserUpdate(userData: any): string[] {
    const errors: string[] = [];

    if (userData.age !== undefined) {
      if (typeof userData.age !== 'number' || userData.age < 18 || userData.age > 50) {
        errors.push('Age must be between 18 and 50');
      }
    }

    if (userData.full_name !== undefined) {
      if (typeof userData.full_name !== 'string' || userData.full_name.length > 255) {
        errors.push('Name must be a string with maximum 255 characters');
      }
    }

    if (userData.location_neighborhood !== undefined) {
      if (typeof userData.location_neighborhood !== 'string' || userData.location_neighborhood.length > 100) {
        errors.push('Neighborhood must be a string with maximum 100 characters');
      }
    }

    if (userData.privacy_level !== undefined) {
      const validLevels = ['PRIVATE', 'FRIENDS_ONLY', 'PUBLIC'];
      if (!validLevels.includes(userData.privacy_level)) {
        errors.push('Privacy level must be PRIVATE, FRIENDS_ONLY, or PUBLIC');
      }
    }

    return errors;
  }

  private sanitizeUserData(userData: any): any {
    const sanitized: any = {};

    // Sanitize string fields
    if (userData.full_name !== undefined) {
      sanitized.full_name = userData.full_name.trim().substring(0, 255);
    }

    if (userData.location_neighborhood !== undefined) {
      sanitized.location_neighborhood = userData.location_neighborhood.trim().substring(0, 100);
    }

    // Copy other fields as-is
    ['age', 'privacy_level', 'preferences', 'profile_image_url'].forEach(field => {
      if (userData[field] !== undefined) {
        sanitized[field] = userData[field];
      }
    });

    return sanitized;
  }

  private validateImageFile(file: File): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      throw new Error('Image file must be less than 5MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Image must be JPEG, PNG, GIF, or WebP');
    }
  }

  private validatePreferences(preferences: any): void {
    if (preferences.categories && Array.isArray(preferences.categories)) {
      const validCategories = [
        'NETWORKING', 'CULTURE', 'FITNESS', 'FOOD', 
        'NIGHTLIFE', 'OUTDOOR', 'PROFESSIONAL'
      ];
      
      const invalidCategories = preferences.categories.filter(
        (cat: string) => !validCategories.includes(cat)
      );
      
      if (invalidCategories.length > 0) {
        throw new Error(`Invalid categories: ${invalidCategories.join(', ')}`);
      }
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one digit');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): any {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService(mockAPI, mockStorage);
  });

  describe('getCurrentUser', () => {
    it('should fetch user from API and cache result', async () => {
      const mockUser = createMockUser();
      mockAPI.getCurrentUser.mockResolvedValue(mockUser);
      mockStorage.setItem.mockResolvedValue(true);

      const result = await userService.getCurrentUser();

      expect(mockAPI.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'current_user',
        JSON.stringify(mockUser)
      );
      expect(result).toEqual(mockUser);
    });

    it('should return cached user when cache is valid', async () => {
      const mockUser = createMockUser();
      mockAPI.getCurrentUser.mockResolvedValue(mockUser);

      // First call - should fetch from API
      await userService.getCurrentUser();
      expect(mockAPI.getCurrentUser).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await userService.getCurrentUser();
      expect(mockAPI.getCurrentUser).toHaveBeenCalledTimes(1); // Still 1
      expect(result).toEqual(mockUser);
    });

    it('should fetch fresh data when cache is disabled', async () => {
      const mockUser = createMockUser();
      mockAPI.getCurrentUser.mockResolvedValue(mockUser);

      await userService.getCurrentUser();
      const result = await userService.getCurrentUser(false); // Disable cache

      expect(mockAPI.getCurrentUser).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUser);
    });

    it('should handle API errors gracefully', async () => {
      mockAPI.getCurrentUser.mockRejectedValue(new Error('API Error'));

      await expect(userService.getCurrentUser()).rejects.toThrow('API Error');
    });
  });

  describe('updateProfile', () => {
    it('should validate and update user profile', async () => {
      const updateData = createMockUserUpdate();
      const updatedUser = createMockUser(updateData);
      
      mockAPI.updateProfile.mockResolvedValue(updatedUser);
      mockStorage.setItem.mockResolvedValue(true);

      const result = await userService.updateProfile(updateData);

      expect(mockAPI.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining(updateData)
      );
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'current_user',
        JSON.stringify(updatedUser)
      );
      expect(result).toEqual(updatedUser);
    });

    it('should sanitize user input data', async () => {
      const dirtyData = {
        full_name: '  John Doe  ',
        location_neighborhood: '  Manhattan  ',
        age: 28,
      };
      
      const cleanData = {
        full_name: 'John Doe',
        location_neighborhood: 'Manhattan',
        age: 28,
      };
      
      const updatedUser = createMockUser(cleanData);
      mockAPI.updateProfile.mockResolvedValue(updatedUser);

      await userService.updateProfile(dirtyData);

      expect(mockAPI.updateProfile).toHaveBeenCalledWith(cleanData);
    });

    it('should validate age constraints', async () => {
      const invalidData = { age: 17 }; // Too young

      await expect(userService.updateProfile(invalidData))
        .rejects.toThrow('Age must be between 18 and 50');

      expect(mockAPI.updateProfile).not.toHaveBeenCalled();
    });

    it('should validate name length constraints', async () => {
      const invalidData = { full_name: 'A'.repeat(300) }; // Too long

      await expect(userService.updateProfile(invalidData))
        .rejects.toThrow('Name must be a string with maximum 255 characters');
    });

    it('should validate privacy level values', async () => {
      const invalidData = { privacy_level: 'INVALID' };

      await expect(userService.updateProfile(invalidData))
        .rejects.toThrow('Privacy level must be PRIVATE, FRIENDS_ONLY, or PUBLIC');
    });

    it('should handle multiple validation errors', async () => {
      const invalidData = {
        age: 60, // Too old
        full_name: 'A'.repeat(300), // Too long
        privacy_level: 'INVALID', // Invalid enum
      };

      await expect(userService.updateProfile(invalidData))
        .rejects.toThrow('Validation failed: Age must be between 18 and 50, Name must be a string with maximum 255 characters, Privacy level must be PRIVATE, FRIENDS_ONLY, or PUBLIC');
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload valid image file', async () => {
      const mockFile = new File(['image data'], 'avatar.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const mockResponse = { profile_image_url: 'https://cdn.example.com/avatar.jpg' };
      mockAPI.uploadProfileImage.mockResolvedValue(mockResponse);

      const result = await userService.uploadProfileImage(mockFile);

      expect(mockAPI.uploadProfileImage).toHaveBeenCalledWith(
        expect.any(FormData)
      );
      expect(result).toBe(mockResponse.profile_image_url);
    });

    it('should reject files that are too large', async () => {
      const mockFile = new File(['image data'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      await expect(userService.uploadProfileImage(mockFile))
        .rejects.toThrow('Image file must be less than 5MB');

      expect(mockAPI.uploadProfileImage).not.toHaveBeenCalled();
    });

    it('should reject unsupported file types', async () => {
      const mockFile = new File(['image data'], 'avatar.bmp', { type: 'image/bmp' });
      Object.defineProperty(mockFile, 'size', { value: 1024 }); // 1KB

      await expect(userService.uploadProfileImage(mockFile))
        .rejects.toThrow('Image must be JPEG, PNG, GIF, or WebP');
    });

    it('should update cached user with new image URL', async () => {
      const mockFile = new File(['image data'], 'avatar.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 });
      
      const mockUser = createMockUser();
      const imageUrl = 'https://cdn.example.com/new-avatar.jpg';
      
      // Set up cache with existing user
      mockAPI.getCurrentUser.mockResolvedValue(mockUser);
      await userService.getCurrentUser();
      
      // Mock image upload
      mockAPI.uploadProfileImage.mockResolvedValue({ profile_image_url: imageUrl });

      await userService.uploadProfileImage(mockFile);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'current_user',
        expect.stringContaining(imageUrl)
      );
    });
  });

  describe('getPreferences', () => {
    it('should fetch and cache user preferences', async () => {
      const mockPreferences = createMockUserPreferences();
      mockAPI.getPreferences.mockResolvedValue(mockPreferences);

      const result = await userService.getPreferences();

      expect(mockAPI.getPreferences).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPreferences);
    });

    it('should return cached preferences when available', async () => {
      const mockPreferences = createMockUserPreferences();
      mockAPI.getPreferences.mockResolvedValue(mockPreferences);

      // First call
      await userService.getPreferences();
      // Second call should use cache
      const result = await userService.getPreferences();

      expect(mockAPI.getPreferences).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('updatePreferences', () => {
    it('should validate and update user preferences', async () => {
      const preferences = {
        categories: ['NETWORKING', 'CULTURE'],
        neighborhoods: ['Manhattan'],
        notifications: true,
      };
      
      mockAPI.updatePreferences.mockResolvedValue(preferences);

      const result = await userService.updatePreferences(preferences);

      expect(mockAPI.updatePreferences).toHaveBeenCalledWith(preferences);
      expect(result).toEqual(preferences);
    });

    it('should validate category preferences', async () => {
      const invalidPreferences = {
        categories: ['NETWORKING', 'INVALID_CATEGORY'],
      };

      await expect(userService.updatePreferences(invalidPreferences))
        .rejects.toThrow('Invalid categories: INVALID_CATEGORY');
    });

    it('should handle empty categories array', async () => {
      const preferences = { categories: [] };
      mockAPI.updatePreferences.mockResolvedValue(preferences);

      const result = await userService.updatePreferences(preferences);

      expect(result).toEqual(preferences);
    });
  });

  describe('changePassword', () => {
    it('should validate and change password', async () => {
      const currentPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';
      
      mockAPI.changePassword.mockResolvedValue(true);

      const result = await userService.changePassword(currentPassword, newPassword);

      expect(mockAPI.changePassword).toHaveBeenCalledWith({
        currentPassword,
        newPassword,
      });
      expect(result).toBe(true);
    });

    it('should validate new password strength', async () => {
      const currentPassword = 'OldPassword123!';
      const weakPassword = '123'; // Too weak

      await expect(userService.changePassword(currentPassword, weakPassword))
        .rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should require uppercase letter in password', async () => {
      const currentPassword = 'OldPassword123!';
      const noUppercase = 'newpassword123!';

      await expect(userService.changePassword(currentPassword, noUppercase))
        .rejects.toThrow('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter in password', async () => {
      const currentPassword = 'OldPassword123!';
      const noLowercase = 'NEWPASSWORD123!';

      await expect(userService.changePassword(currentPassword, noLowercase))
        .rejects.toThrow('Password must contain at least one lowercase letter');
    });

    it('should require digit in password', async () => {
      const currentPassword = 'OldPassword123!';
      const noDigit = 'NewPassword!';

      await expect(userService.changePassword(currentPassword, noDigit))
        .rejects.toThrow('Password must contain at least one digit');
    });

    it('should require special character in password', async () => {
      const currentPassword = 'OldPassword123!';
      const noSpecial = 'NewPassword123';

      await expect(userService.changePassword(currentPassword, noSpecial))
        .rejects.toThrow('Password must contain at least one special character');
    });

    it('should reject same password', async () => {
      const samePassword = 'SamePassword123!';

      await expect(userService.changePassword(samePassword, samePassword))
        .rejects.toThrow('New password must be different from current password');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', () => {
      userService.clearCache();
      
      const stats = userService.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });

    it('should provide cache statistics', async () => {
      const mockUser = createMockUser();
      mockAPI.getCurrentUser.mockResolvedValue(mockUser);
      
      await userService.getCurrentUser();
      
      const stats = userService.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toContain('current_user');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const mockUser = createMockUser();
      mockAPI.getCurrentUser.mockResolvedValue(mockUser);
      mockStorage.setItem.mockRejectedValue(new Error('Storage error'));

      // Should still return user data even if storage fails
      const result = await userService.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should handle API timeouts', async () => {
      mockAPI.getCurrentUser.mockRejectedValue(new Error('Request timeout'));

      await expect(userService.getCurrentUser()).rejects.toThrow('Request timeout');
    });

    it('should handle network errors', async () => {
      mockAPI.updateProfile.mockRejectedValue(new Error('Network error'));

      await expect(userService.updateProfile({ age: 25 }))
        .rejects.toThrow('Network error');
    });
  });
});