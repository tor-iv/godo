/**
 * Secure Storage Utility
 * Provides secure storage for sensitive data using expo-secure-store and AsyncStorage
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SecureStorageOptions {
  requireAuthentication?: boolean;
  keychainService?: string;
}

/**
 * SecureStorage class for handling both sensitive and non-sensitive data
 */
export class SecureStorage {
  private static instance: SecureStorage;
  private readonly service: string;

  private constructor() {
    this.service = 'godo-app';
  }

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Store sensitive data securely (e.g., tokens, passwords)
   */
  async setSecureItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    try {
      const secureStoreOptions: SecureStore.SecureStoreOptions = {
        requireAuthentication: options?.requireAuthentication || false,
        keychainService: options?.keychainService || this.service,
      };

      await SecureStore.setItemAsync(key, value, secureStoreOptions);
    } catch (error) {
      // Failed to store secure item - storage error
      throw new Error(`Failed to store secure data: ${error}`);
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  async getSecureItem(
    key: string,
    options?: SecureStorageOptions
  ): Promise<string | null> {
    try {
      const secureStoreOptions: SecureStore.SecureStoreOptions = {
        requireAuthentication: options?.requireAuthentication || false,
        keychainService: options?.keychainService || this.service,
      };

      const result = await SecureStore.getItemAsync(key, secureStoreOptions);
      return result;
    } catch (error) {
      // Failed to retrieve secure item
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  async removeSecureItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      // Failed to remove secure item
      throw new Error(`Failed to remove secure data: ${error}`);
    }
  }

  /**
   * Check if secure item exists
   */
  async hasSecureItem(key: string): Promise<boolean> {
    try {
      const item = await this.getSecureItem(key);
      return item !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store non-sensitive data (e.g., user preferences, cache)
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
    } catch (error) {
      // Failed to store item
      throw new Error(`Failed to store data: ${error}`);
    }
  }

  /**
   * Retrieve non-sensitive data
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const serializedValue = await AsyncStorage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      return JSON.parse(serializedValue) as T;
    } catch (error) {
      // Failed to retrieve item
      return null;
    }
  }

  /**
   * Remove non-sensitive data
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Failed to remove item
    }
  }

  /**
   * Check if non-sensitive item exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all non-sensitive data
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      // Failed to clear storage
    }
  }

  /**
   * Clear all secure data (Note: SecureStore doesn't have a clear all method)
   */
  async clearSecure(): Promise<void> {
    try {
      // Note: expo-secure-store doesn't have a clearAll method
      // You would need to track keys and delete them individually
      // For now, we'll clear the common secure keys we know about
      const secureKeys = [
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.BIOMETRIC_SETTING,
      ];

      await Promise.all(
        secureKeys.map(key => this.removeSecureItem(key).catch(() => {}))
      );
    } catch (error) {
      // Failed to clear secure storage
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalKeys: number;
    secureItemsAvailable: boolean;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return {
        totalKeys: keys.length,
        secureItemsAvailable: await SecureStore.isAvailableAsync(),
      };
    } catch (error) {
      return {
        totalKeys: 0,
        secureItemsAvailable: false,
      };
    }
  }
}

// Storage Keys Constants
export const STORAGE_KEYS = {
  // Secure keys (stored in Keychain)
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  BIOMETRIC_SETTING: 'biometric_setting',

  // Regular keys (stored in MMKV)
  USER_PROFILE: 'user_profile',
  USER_PREFERENCES: 'user_preferences',
  APP_SETTINGS: 'app_settings',
  CACHE_PREFIX: 'cache_',
  LAST_SYNC: 'last_sync',
  DEVICE_ID: 'device_id',
  SESSION_ID: 'session_id',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Cache keys
  EVENTS_CACHE: 'cache_events',
  FEATURED_EVENTS_CACHE: 'cache_featured_events',
  USER_SWIPES_CACHE: 'cache_user_swipes',
  NOTIFICATIONS_CACHE: 'cache_notifications',
} as const;

// Export default instance
export default SecureStorage.getInstance();
