// API Service Base Client
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { ApiConfig, ApiError, RequestConfig } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor() {
    this.config = {
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    this.client = axios.create(this.config);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(
          import.meta.env.VITE_JWT_STORAGE_KEY || 'osint_auth_token'
        );
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(this.handleError(error))
    );

    // Response interceptor to handle errors consistently
    this.client.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.handleError(error))
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as any;
      return {
        message: responseData?.message || error.message,
        status: error.response.status,
        code: responseData?.error || error.code,
        details: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        message: 'Network error: No response from server',
        code: 'NETWORK_ERROR',
        details: error.request,
      };
    } else {
      // Error in request setup
      return {
        message: error.message || 'Unknown error occurred',
        code: 'REQUEST_ERROR',
        details: error,
      };
    }
  }

  // Generic request method
  async request<T>(config: RequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client({
        method: config.method,
        url: config.url,
        data: config.data,
        headers: config.headers,
      });
      
      return response.data;
    } catch (error) {
      throw error; // Re-throw the already handled error
    }
  }

  // Convenience methods
  async get<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config,
    });
  }

  async post<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  async put<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  // Update configuration
  setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
    this.client.defaults.timeout = timeout;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient; 