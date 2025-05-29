import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { AuthState, AuthContextValue, User, AuthSuccessResponse } from '../types';
import { authService } from '../services/authService';

// Auth action types
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AUTH'; payload: { user: User; token: string } }
  | { type: 'CLEAR_AUTH' }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_AUTH':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'CLEAR_AUTH':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state from localStorage
  const initializeAuth = () => {
    const { token, user } = authService.getStoredAuth();
    
    if (token && user) {
      dispatch({
        type: 'SET_AUTH',
        payload: { user, token },
      });
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response: AuthSuccessResponse = await authService.login({ email, password });
      
      // Store authentication data
      authService.storeAuth(response);
      
      // Update context state
      dispatch({
        type: 'SET_AUTH',
        payload: { user: response.user, token: response.token },
      });
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message || 'Login failed. Please try again.',
      });
      throw error; // Re-throw for component error handling
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response: AuthSuccessResponse = await authService.register({ username, email, password });
      
      // Store authentication data
      authService.storeAuth(response);
      
      // Update context state
      dispatch({
        type: 'SET_AUTH',
        payload: { user: response.user, token: response.token },
      });
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message || 'Registration failed. Please try again.',
      });
      throw error; // Re-throw for component error handling
    }
  };

  // Logout function
  const logout = (): void => {
    // Clear localStorage
    authService.clearAuth();
    
    // Clear context state
    dispatch({ type: 'CLEAR_AUTH' });
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Context value
  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    clearError,
    initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext; 