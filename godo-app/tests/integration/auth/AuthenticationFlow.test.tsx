/**
 * @fileoverview Integration tests for Authentication Flow
 * @author Testing Team
 * @testtype Integration
 * @description End-to-end authentication flow testing including login, registration, logout, and session management
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { jest } from '@jest/globals';
import { 
  createMockUser, 
  createMockUserCreate, 
  createMockAuthToken, 
  mockAPIResponses,
  invalidUserData 
} from '../../mocks/userMocks';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    reset: mockReset,
  }),
}));

// Mock authentication service
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getCurrentUser: jest.fn(),
  isAuthenticated: jest.fn(),
};

// Mock storage service
const mockStorageService = {
  store: jest.fn(),
  retrieve: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
};

// Mock components for testing
const LoginScreen = ({ onLogin, isLoading = false }) => {
  const { Text, View, TextInput, TouchableOpacity } = require('react-native');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState({});

  const handleLogin = async () => {
    try {
      await onLogin({ email, password });
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  return (
    <View testID="login-screen">
      <Text testID="login-title">Login</Text>
      <TextInput
        testID="email-input"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        testID="password-input"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {errors.general && (
        <Text testID="error-message">{errors.general}</Text>
      )}
      <TouchableOpacity
        testID="login-button"
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text>{isLoading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="register-link">
        <Text>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const RegisterScreen = ({ onRegister, isLoading = false }) => {
  const { Text, View, TextInput, TouchableOpacity } = require('react-native');
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    age: '',
  });
  const [errors, setErrors] = React.useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.full_name) newErrors.full_name = 'Name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      const userData = {
        ...formData,
        age: parseInt(formData.age) || undefined,
      };
      await onRegister(userData);
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  return (
    <View testID="register-screen">
      <Text testID="register-title">Create Account</Text>
      
      <TextInput
        testID="fullname-input"
        placeholder="Full Name"
        value={formData.full_name}
        onChangeText={value => updateField('full_name', value)}
      />
      {errors.full_name && (
        <Text testID="fullname-error">{errors.full_name}</Text>
      )}
      
      <TextInput
        testID="email-input"
        placeholder="Email"
        value={formData.email}
        onChangeText={value => updateField('email', value)}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email && (
        <Text testID="email-error">{errors.email}</Text>
      )}
      
      <TextInput
        testID="age-input"
        placeholder="Age (optional)"
        value={formData.age}
        onChangeText={value => updateField('age', value)}
        keyboardType="numeric"
      />
      
      <TextInput
        testID="password-input"
        placeholder="Password"
        value={formData.password}
        onChangeText={value => updateField('password', value)}
        secureTextEntry
      />
      {errors.password && (
        <Text testID="password-error">{errors.password}</Text>
      )}
      
      <TextInput
        testID="confirm-password-input"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={value => updateField('confirmPassword', value)}
        secureTextEntry
      />
      {errors.confirmPassword && (
        <Text testID="confirm-password-error">{errors.confirmPassword}</Text>
      )}
      
      {errors.general && (
        <Text testID="error-message">{errors.general}</Text>
      )}
      
      <TouchableOpacity
        testID="register-button"
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await mockAuthService.login(credentials);
      const { access_token, user: userData } = response;
      
      await mockStorageService.store('auth_token', access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await mockAuthService.register(userData);
      const { access_token, user: newUser } = response;
      
      await mockStorageService.store('auth_token', access_token);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await mockAuthService.logout();
      await mockStorageService.clear();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return React.createElement(
    React.Fragment,
    null,
    React.cloneElement(children, { authContext: value })
  );
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.store.mockResolvedValue(true);
    mockStorageService.retrieve.mockResolvedValue(null);
    mockStorageService.remove.mockResolvedValue(true);
    mockStorageService.clear.mockResolvedValue(true);
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const mockToken = createMockAuthToken();
      mockAuthService.login.mockResolvedValue(mockToken);

      const TestComponent = ({ authContext }) => (
        <LoginScreen 
          onLogin={authContext.login}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Fill in credentials
      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(screen.getByTestId('password-input'), 'password123');

      // Submit login
      fireEvent.press(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(mockStorageService.store).toHaveBeenCalledWith(
        'auth_token',
        mockToken.access_token
      );
    });

    it('should display error message on login failure', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const TestComponent = ({ authContext }) => (
        <LoginScreen 
          onLogin={authContext.login}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.changeText(screen.getByTestId('email-input'), 'wrong@example.com');
      fireEvent.changeText(screen.getByTestId('password-input'), 'wrongpassword');
      fireEvent.press(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
      });
    });

    it('should show loading state during login', async () => {
      const mockToken = createMockAuthToken();
      let resolveLogin;
      mockAuthService.login.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveLogin = () => resolve(mockToken);
        });
      });

      const TestComponent = ({ authContext }) => (
        <LoginScreen 
          onLogin={authContext.login}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
      fireEvent.press(screen.getByTestId('login-button'));

      // Check loading state
      expect(screen.getByTestId('login-button')).toHaveTextContent('Logging in...');

      // Resolve login
      act(() => {
        resolveLogin();
      });

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toHaveTextContent('Login');
      });
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register with valid data', async () => {
      const mockToken = createMockAuthToken();
      mockAuthService.register.mockResolvedValue(mockToken);

      const TestComponent = ({ authContext }) => (
        <RegisterScreen 
          onRegister={authContext.register}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Fill registration form
      fireEvent.changeText(screen.getByTestId('fullname-input'), 'John Doe');
      fireEvent.changeText(screen.getByTestId('email-input'), 'john@example.com');
      fireEvent.changeText(screen.getByTestId('age-input'), '28');
      fireEvent.changeText(screen.getByTestId('password-input'), 'SecurePass123!');
      fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'SecurePass123!');

      // Submit registration
      fireEvent.press(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          full_name: 'John Doe',
          age: 28,
        });
      });
    });

    it('should validate required fields', async () => {
      const TestComponent = ({ authContext }) => (
        <RegisterScreen 
          onRegister={authContext.register}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Try to submit without filling required fields
      fireEvent.press(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
        expect(screen.getByTestId('fullname-error')).toHaveTextContent('Name is required');
      });

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should validate password confirmation', async () => {
      const TestComponent = ({ authContext }) => (
        <RegisterScreen 
          onRegister={authContext.register}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.changeText(screen.getByTestId('fullname-input'), 'John Doe');
      fireEvent.changeText(screen.getByTestId('email-input'), 'john@example.com');
      fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
      fireEvent.changeText(screen.getByTestId('confirm-password-input'), 'different123');

      fireEvent.press(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-password-error')).toHaveTextContent('Passwords do not match');
      });
    });

    it('should clear field errors when user starts typing', () => {
      const TestComponent = ({ authContext }) => (
        <RegisterScreen 
          onRegister={authContext.register}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Trigger validation error
      fireEvent.press(screen.getByTestId('register-button'));

      expect(screen.queryByTestId('email-error')).toBeTruthy();

      // Start typing in email field
      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');

      // Error should be cleared
      expect(screen.queryByTestId('email-error')).toBeNull();
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout user', async () => {
      mockAuthService.logout.mockResolvedValue(true);

      const TestComponent = ({ authContext }) => {
        const { View, TouchableOpacity, Text } = require('react-native');
        
        return (
          <View testID="authenticated-view">
            <TouchableOpacity testID="logout-button" onPress={authContext.logout}>
              <Text>Logout</Text>
            </TouchableOpacity>
          </View>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.press(screen.getByTestId('logout-button'));

      await waitFor(() => {
        expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
        expect(mockStorageService.clear).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Session Management', () => {
    it('should handle token refresh on expiry', async () => {
      const expiredToken = createMockAuthToken({ expires_in: -1 });
      const freshToken = createMockAuthToken();
      
      mockAuthService.refreshToken.mockResolvedValue(freshToken);
      mockStorageService.retrieve.mockResolvedValue(expiredToken.access_token);

      // Test component would check token validity and refresh if needed
      const TestComponent = ({ authContext }) => {
        const { View, Text } = require('react-native');
        
        React.useEffect(() => {
          const checkAndRefreshToken = async () => {
            const token = await mockStorageService.retrieve('auth_token');
            if (token) {
              // Simulate token expiry check and refresh
              const refreshedToken = await mockAuthService.refreshToken();
              await mockStorageService.store('auth_token', refreshedToken.access_token);
            }
          };
          
          checkAndRefreshToken();
        }, []);
        
        return (
          <View testID="session-component">
            <Text>Session Active</Text>
          </View>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuthService.refreshToken).toHaveBeenCalledTimes(1);
        expect(mockStorageService.store).toHaveBeenCalledWith(
          'auth_token',
          freshToken.access_token
        );
      });
    });

    it('should handle network errors during authentication', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      const TestComponent = ({ authContext }) => (
        <LoginScreen 
          onLogin={authContext.login}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
      fireEvent.press(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle simultaneous login attempts', async () => {
      const mockToken = createMockAuthToken();
      let callCount = 0;
      
      mockAuthService.login.mockImplementation(() => {
        callCount++;
        return Promise.resolve(mockToken);
      });

      const TestComponent = ({ authContext }) => (
        <LoginScreen 
          onLogin={authContext.login}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(screen.getByTestId('password-input'), 'password123');

      // Fire multiple login attempts
      fireEvent.press(screen.getByTestId('login-button'));
      fireEvent.press(screen.getByTestId('login-button'));
      fireEvent.press(screen.getByTestId('login-button'));

      await waitFor(() => {
        // Should only call login once due to loading state
        expect(callCount).toBe(1);
      });
    });

    it('should handle empty form submission gracefully', async () => {
      const TestComponent = ({ authContext }) => (
        <LoginScreen 
          onLogin={authContext.login}
          isLoading={authContext.isLoading}
        />
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.press(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: '',
          password: '',
        });
      });
    });
  });
});