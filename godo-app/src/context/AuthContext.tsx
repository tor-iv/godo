/**
 * Authentication Context
 * Provides authentication state management and methods
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { User } from '../types';
import { AuthService } from '../services/AuthService';
import { SecureStorage, STORAGE_KEYS } from '../utils/storage/SecureStorage';
import {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../api/types';

/**
 * Authentication State
 */
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

/**
 * Authentication Actions
 */
export type AuthAction =
  | { type: 'AUTH_INIT_START' }
  | { type: 'AUTH_INIT_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_INIT_FAILURE' }
  | { type: 'AUTH_LOGIN_START' }
  | { type: 'AUTH_LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_LOGIN_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_REGISTER_START' }
  | {
      type: 'AUTH_REGISTER_SUCCESS';
      payload: { user: User; tokens: AuthTokens };
    }
  | { type: 'AUTH_REGISTER_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_UPDATE_USER'; payload: { user: User } }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_TOKEN_REFRESH_SUCCESS'; payload: { tokens: AuthTokens } };

/**
 * Authentication Context Interface
 */
export interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (request: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (request: ResetPasswordRequest) => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  refreshTokens: () => Promise<void>;
  isTokenExpired: () => boolean;
}

/**
 * Initial State
 */
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

/**
 * Authentication Reducer
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_INIT_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_INIT_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      };

    case 'AUTH_INIT_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
      };

    case 'AUTH_LOGIN_START':
    case 'AUTH_REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_LOGIN_SUCCESS':
    case 'AUTH_REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_LOGIN_FAILURE':
    case 'AUTH_REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isInitialized: true,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_TOKEN_REFRESH_SUCCESS':
      return {
        ...state,
        tokens: action.payload.tokens,
      };

    default:
      return state;
  }
};

/**
 * Create Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = AuthService.getInstance();
  const secureStorage = SecureStorage.getInstance();

  /**
   * Initialize authentication state on app start
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication from stored tokens
   */
  const initializeAuth = async (): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_INIT_START' });

      const [accessToken, refreshToken, userProfile] = await Promise.all([
        secureStorage.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
        secureStorage.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
        secureStorage.getItem<User>(STORAGE_KEYS.USER_PROFILE),
      ]);

      if (accessToken && refreshToken && userProfile) {
        const tokens: AuthTokens = {
          accessToken,
          refreshToken,
          expiresIn: 0, // Will be set by token validation
          tokenType: 'Bearer',
        };

        // Validate token and get fresh user data
        try {
          const user = await authService.getCurrentUser();
          dispatch({
            type: 'AUTH_INIT_SUCCESS',
            payload: { user, tokens },
          });
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            const refreshedTokens = await authService.refreshToken();
            const user = await authService.getCurrentUser();
            dispatch({
              type: 'AUTH_INIT_SUCCESS',
              payload: { user, tokens: refreshedTokens },
            });
          } catch (refreshError) {
            // Refresh failed, clear stored data
            await clearStoredAuthData();
            dispatch({ type: 'AUTH_INIT_FAILURE' });
          }
        }
      } else {
        dispatch({ type: 'AUTH_INIT_FAILURE' });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await clearStoredAuthData();
      dispatch({ type: 'AUTH_INIT_FAILURE' });
    }
  };

  /**
   * Login user
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOGIN_START' });

      const response = await authService.login(credentials);
      const { user, tokens } = response;

      // Store tokens and user data
      await Promise.all([
        secureStorage.setSecureItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          tokens.accessToken
        ),
        secureStorage.setSecureItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          tokens.refreshToken
        ),
        secureStorage.setItem(STORAGE_KEYS.USER_PROFILE, user),
      ]);

      dispatch({
        type: 'AUTH_LOGIN_SUCCESS',
        payload: { user, tokens },
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch({
        type: 'AUTH_LOGIN_FAILURE',
        payload: { error: errorMessage },
      });
      throw error;
    }
  };

  /**
   * Register user
   */
  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_REGISTER_START' });

      const response = await authService.register(userData);
      const { user, tokens } = response;

      // Store tokens and user data
      await Promise.all([
        secureStorage.setSecureItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          tokens.accessToken
        ),
        secureStorage.setSecureItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          tokens.refreshToken
        ),
        secureStorage.setItem(STORAGE_KEYS.USER_PROFILE, user),
      ]);

      dispatch({
        type: 'AUTH_REGISTER_SUCCESS',
        payload: { user, tokens },
      });
    } catch (error: any) {
      const errorMessage =
        error.message || 'Registration failed. Please try again.';
      dispatch({
        type: 'AUTH_REGISTER_FAILURE',
        payload: { error: errorMessage },
      });
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      // Call logout API if user is authenticated
      if (state.isAuthenticated && state.tokens) {
        try {
          await authService.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error);
        }
      }
    } finally {
      // Always clear local data
      await clearStoredAuthData();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  /**
   * Forgot password
   */
  const forgotPassword = async (
    request: ForgotPasswordRequest
  ): Promise<void> => {
    try {
      await authService.forgotPassword(request);
    } catch (error: any) {
      throw new Error(
        error.message || 'Failed to send reset email. Please try again.'
      );
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (
    request: ResetPasswordRequest
  ): Promise<void> => {
    try {
      await authService.resetPassword(request);
    } catch (error: any) {
      throw new Error(
        error.message || 'Failed to reset password. Please try again.'
      );
    }
  };

  /**
   * Update user profile
   */
  const updateUser = (user: User): void => {
    secureStorage.setItem(STORAGE_KEYS.USER_PROFILE, user);
    dispatch({ type: 'AUTH_UPDATE_USER', payload: { user } });
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  /**
   * Refresh authentication tokens
   */
  const refreshTokens = async (): Promise<void> => {
    try {
      const newTokens = await authService.refreshToken();

      // Store new tokens
      await Promise.all([
        secureStorage.setSecureItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          newTokens.accessToken
        ),
        secureStorage.setSecureItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          newTokens.refreshToken
        ),
      ]);

      dispatch({
        type: 'AUTH_TOKEN_REFRESH_SUCCESS',
        payload: { tokens: newTokens },
      });
    } catch (error) {
      // Refresh failed, logout user
      await logout();
      throw error;
    }
  };

  /**
   * Check if token is expired
   */
  const isTokenExpired = (): boolean => {
    if (!state.tokens) return true;

    try {
      // Basic JWT token expiration check
      const payload = JSON.parse(atob(state.tokens.accessToken.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch (error) {
      return true;
    }
  };

  /**
   * Clear stored authentication data
   */
  const clearStoredAuthData = async (): Promise<void> => {
    await Promise.all([
      secureStorage.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
      secureStorage.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
      secureStorage.removeItem(STORAGE_KEYS.USER_PROFILE),
    ]);
  };

  const contextValue: AuthContextType = {
    state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
    clearError,
    refreshTokens,
    isTokenExpired,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
