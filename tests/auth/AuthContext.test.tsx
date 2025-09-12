/**
 * AuthContext Tests
 * Tests for authentication context and provider
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../godo-app/src/context/AuthContext';
import { AuthService } from '../../godo-app/src/services/AuthService';
import { SecureStorage } from '../../godo-app/src/utils/storage/SecureStorage';
import { Text, TouchableOpacity } from 'react-native';

// Mock dependencies
jest.mock('../../godo-app/src/services/AuthService');
jest.mock('../../godo-app/src/utils/storage/SecureStorage');

// Test component that uses auth context
const TestComponent: React.FC = () => {
  const {
    state,
    login,
    register,
    logout,
    clearError,
    updateUser,
  } = useAuth();

  return (
    <>
      <Text testID="auth-state">
        {JSON.stringify({
          isAuthenticated: state.isAuthenticated,
          isLoading: state.isLoading,
          error: state.error,
          isInitialized: state.isInitialized,
          userName: state.user?.name,
        })}
      </Text>
      <TouchableOpacity
        testID="login-button"
        onPress={() => login({ email: 'test@example.com', password: 'password' })}
      >
        <Text>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="register-button"
        onPress={() => register({
          email: 'test@example.com',
          password: 'password',
          confirmPassword: 'password',
          name: 'Test User',
        })}
      >
        <Text>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="logout-button" onPress={() => logout()}>
        <Text>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="clear-error-button" onPress={() => clearError()}>
        <Text>Clear Error</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="update-user-button"
        onPress={() => updateUser({
          id: '1',
          name: 'Updated User',
          email: 'test@example.com',
          preferences: { categories: [], neighborhoods: [] },
        })}
      >
        <Text>Update User</Text>
      </TouchableOpacity>
    </>
  );
};

describe('AuthContext', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockSecureStorage: jest.Mocked<SecureStorage>;

  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    preferences: { categories: [], neighborhoods: [] },
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer' as const,
  };

  const mockAuthResponse = {
    user: mockUser,
    tokens: mockTokens,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AuthService
    mockAuthService = {
      getInstance: jest.fn(() => mockAuthService),
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
      refreshToken: jest.fn(),
    } as any;

    (AuthService.getInstance as jest.Mock).mockReturnValue(mockAuthService);

    // Mock SecureStorage
    mockSecureStorage = {
      getInstance: jest.fn(() => mockSecureStorage),
      getSecureItem: jest.fn(),
      setSecureItem: jest.fn(),
      removeSecureItem: jest.fn(),
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    } as any;

    (SecureStorage.getInstance as jest.Mock).mockReturnValue(mockSecureStorage);
  });

  describe('Initialization', () => {
    it('should initialize with default state', async () => {
      mockSecureStorage.getSecureItem.mockResolvedValue(null);
      mockSecureStorage.getItem.mockReturnValue(null);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.isInitialized).toBe(true);
        expect(authState.isLoading).toBe(false);
      });
    });

    it('should initialize with existing user session', async () => {
      mockSecureStorage.getSecureItem
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      
      mockSecureStorage.getItem.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.isInitialized).toBe(true);
        expect(authState.userName).toBe('Test User');
      });
    });

    it('should refresh token if current user fetch fails', async () => {
      mockSecureStorage.getSecureItem
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      
      mockSecureStorage.getItem.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser
        .mockRejectedValueOnce(new Error('Token expired'))
        .mockResolvedValueOnce(mockUser);
      
      mockAuthService.refreshToken.mockResolvedValue(mockTokens);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.isInitialized).toBe(true);
      });

      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);
      mockSecureStorage.setSecureItem.mockResolvedValue(undefined);
      mockSecureStorage.setItem.mockReturnValue(undefined);

      const { getByTestId, findByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isInitialized).toBe(true);
      });

      // Trigger login
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.userName).toBe('Test User');
        expect(authState.isLoading).toBe(false);
        expect(authState.error).toBe(null);
      });

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });

      expect(mockSecureStorage.setSecureItem).toHaveBeenCalledWith(
        expect.any(String),
        'access-token'
      );
    });

    it('should handle login error', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isInitialized).toBe(true);
      });

      // Trigger login
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.error).toBe('Invalid credentials');
        expect(authState.isLoading).toBe(false);
      });
    });
  });

  describe('Register', () => {
    it('should register successfully', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);
      mockSecureStorage.setSecureItem.mockResolvedValue(undefined);
      mockSecureStorage.setItem.mockReturnValue(undefined);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isInitialized).toBe(true);
      });

      // Trigger register
      await act(async () => {
        getByTestId('register-button').props.onPress();
      });

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.userName).toBe('Test User');
      });

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
        name: 'Test User',
      });
    });

    it('should handle register error', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Email already exists'));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isInitialized).toBe(true);
      });

      // Trigger register
      await act(async () => {
        getByTestId('register-button').props.onPress();
      });

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.error).toBe('Email already exists');
      });
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // Setup authenticated state
      mockSecureStorage.getSecureItem
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      
      mockSecureStorage.getItem.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.logout.mockResolvedValue(undefined);
      mockSecureStorage.removeSecureItem.mockResolvedValue(undefined);
      mockSecureStorage.removeItem.mockReturnValue(undefined);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for authenticated state
      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(true);
      });

      // Trigger logout
      await act(async () => {
        getByTestId('logout-button').props.onPress();
      });

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.userName).toBe(undefined);
        expect(authState.isInitialized).toBe(true);
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockSecureStorage.removeSecureItem).toHaveBeenCalled();
    });
  });

  describe('User Update', () => {
    it('should update user successfully', async () => {
      // Setup authenticated state
      mockSecureStorage.getSecureItem
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      
      mockSecureStorage.getItem.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockSecureStorage.setItem.mockReturnValue(undefined);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for authenticated state
      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isAuthenticated).toBe(true);
      });

      // Trigger user update
      await act(async () => {
        getByTestId('update-user-button').props.onPress();
      });

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.userName).toBe('Updated User');
      });

      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'Updated User' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should clear error state', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Test error'));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.isInitialized).toBe(true);
      });

      // Trigger login error
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.error).toBe('Test error');
      });

      // Clear error
      await act(async () => {
        getByTestId('clear-error-button').props.onPress();
      });

      await waitFor(() => {
        const authState = JSON.parse(getByTestId('auth-state').props.children);
        expect(authState.error).toBe(null);
      });
    });
  });

  describe('Error Cases', () => {
    it('should throw error when used outside provider', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});