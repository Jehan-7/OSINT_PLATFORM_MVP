// General API Types

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API Configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// API Error structure
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

// Generic API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

// Request configuration
export interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: unknown;
  headers?: Record<string, string>;
  withAuth?: boolean;
}

// Environment variables type
export interface EnvironmentConfig {
  VITE_API_URL: string;
  VITE_APP_NAME: string;
  VITE_JWT_STORAGE_KEY: string;
  VITE_USER_STORAGE_KEY: string;
} 