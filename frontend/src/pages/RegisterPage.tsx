import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { RegistrationFormData } from '../types';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  general?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    username: '',
    email: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Client-side validation matching backend rules
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters long';
        if (value.length > 50) return 'Username must be less than 50 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return undefined;
        
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return undefined;
        
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        if (!/(?=.*[!@#$%^&*])/.test(value)) return 'Password must contain at least one special character (!@#$%^&*)';
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
    
    // Reset submitted state when user starts typing
    if (isSubmitted) {
      setIsSubmitted(false);
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
    setIsSubmitted(true);
    setTouched({
      username: true,
      email: true,
      password: true,
    });
    setFormErrors(errors);
    
    // If there are validation errors, don't proceed
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await register(formData.username, formData.email, formData.password);
      // Registration successful - redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      // Error handling is managed by AuthContext
      // Additional client-side error parsing if needed
      const errorMessage = error.message || 'Registration failed';
      
      if (errorMessage.includes('Username already exists')) {
        setFormErrors(prev => ({ ...prev, username: 'Username already exists' }));
      } else if (errorMessage.includes('Email already exists')) {
        setFormErrors(prev => ({ ...prev, email: 'Email already exists' }));
      } else if (errorMessage.includes('Validation failed')) {
        setFormErrors(prev => ({ ...prev, general: errorMessage }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the OSINT Platform community
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Input
              id="username"
              label="Username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={(touched.username || isSubmitted) ? formErrors.username : undefined}
              placeholder="Enter your username"
            />

            <Input
              id="email-address"
              label="Email address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={(touched.email || isSubmitted) ? formErrors.email : undefined}
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
              error={(touched.password || isSubmitted) ? formErrors.password : undefined}
              placeholder="Create a strong password"
            />

            {/* Display general errors (non-field specific) */}
            {(error && !error.includes('Username already exists') && !error.includes('Email already exists')) && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  {error}
                </div>
              </div>
            )}

            {formErrors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  {formErrors.general}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 