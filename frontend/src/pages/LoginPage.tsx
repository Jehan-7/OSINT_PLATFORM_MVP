import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { LoginFormData } from '../types';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Client-side validation for login
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return undefined;
        
      case 'password':
        if (!value) return 'Password is required';
        return undefined;
        
      default:
        return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear previous errors when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
    
    if (error) {
      clearError();
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    const fieldError = validateField(name, value);
    if (fieldError) {
      setFormErrors(prev => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        errors[key as keyof FormErrors] = error;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form with current data
    const errors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      const value = formData[key as keyof typeof formData];
      const error = validateField(key, value);
      if (error) {
        errors[key as keyof FormErrors] = error;
      }
    });

    // Set all state at once to ensure consistency
    setTouched({
      email: true,
      password: true,
    });
    setFormErrors(errors);
    
    // If there are validation errors, don't proceed
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Login successful - redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      // Error handling is managed by AuthContext
      // The backend returns generic "Invalid email or password" for security
      console.log('Login error:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to the OSINT Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Input
              id="email"
              label="Email address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={touched.email ? formErrors.email : undefined}
              placeholder="Enter your email"
            />

            <Input
              id="password"
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={touched.password ? formErrors.password : undefined}
              placeholder="Enter your password"
            />

            {/* Display authentication errors */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  {error}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create a new account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 