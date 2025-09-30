import { User, UserCredentials } from '../types';
import ApiService from './ApiService';

export class BackendAuthService {
  private static instance: BackendAuthService;
  private apiService: typeof ApiService;

  private constructor() {
    this.apiService = ApiService;
  }

  public static getInstance(): BackendAuthService {
    if (!BackendAuthService.instance) {
      BackendAuthService.instance = new BackendAuthService();
    }
    return BackendAuthService.instance;
  }

  async login(credentials: UserCredentials): Promise<any> {
    try {
      const response = await this.apiService.signIn(credentials);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (error: any) {
      console.error('BackendAuthService: Login failed:', error);
      throw new Error(
        error.message || 'Login failed. Please check your credentials.'
      );
    }
  }

  async register(credentials: UserCredentials): Promise<any> {
    try {
      const response = await this.apiService.signUp(credentials);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (error: any) {
      console.error('BackendAuthService: Registration failed:', error);
      throw new Error(
        error.message || 'Registration failed. Please try again.'
      );
    }
  }

  async logout(): Promise<void> {
    try {
      await this.apiService.signOut();
    } catch (error: any) {
      console.error('BackendAuthService: Logout failed:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.apiService.getCurrentUser();
      if (response.error || !response.data) {
        return null;
      }

      // Map backend user data to frontend User type
      return this.mapBackendUserToUser(response.data);
    } catch (error: any) {
      console.error('BackendAuthService: Get current user failed:', error);
      return null;
    }
  }

  private mapBackendUserToUser(backendUser: any): User {
    return {
      id: backendUser.id,
      name: backendUser.user_metadata?.name || backendUser.email.split('@')[0],
      email: backendUser.email,
      avatar: backendUser.user_metadata?.avatar_url || null,
      preferences: {
        categories: [], // These would be fetched from user preferences
        neighborhoods: [],
      },
    };
  }

  async isAuthenticated(): Promise<boolean> {
    return this.apiService.isAuthenticated();
  }

  async getUserProfile(): Promise<any> {
    try {
      const response = await this.apiService.getUserProfile();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (error: any) {
      console.error('BackendAuthService: Get user profile failed:', error);
      return null;
    }
  }

  async updateUserProfile(profile: any): Promise<any> {
    try {
      const response = await this.apiService.updateUserProfile(profile);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (error: any) {
      console.error('BackendAuthService: Update user profile failed:', error);
      throw error;
    }
  }

  // Health check for the backend
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiService.healthCheck();
      return !response.error;
    } catch (error) {
      return false;
    }
  }
}

export default BackendAuthService.getInstance();