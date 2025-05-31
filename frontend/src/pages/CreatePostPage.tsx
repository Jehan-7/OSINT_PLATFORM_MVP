import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPinIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import { postsService } from '../services/postsService';
import { LocationPicker } from '../components/map/LocationPicker';
import { Button } from '../components/ui/Button';
import { ErrorDisplay } from '../components/ui/ErrorDisplay';
import type { CreatePostData } from '../types/posts';

// Form validation types
interface FormErrors {
  content?: string;
  location?: string;
  locationName?: string;
  submit?: string;
}

interface FormData {
  content: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
}

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div 
    data-testid="loading-spinner" 
    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
  />
);

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addPost } = usePosts();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    content: '',
    locationName: '',
    latitude: null,
    longitude: null,
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-focus on content field when component mounts
  useEffect(() => {
    const contentField = document.querySelector('textarea[aria-label*="intelligence report"]') as HTMLTextAreaElement;
    if (contentField) {
      contentField.focus();
    }
  }, []);

  // Authentication check
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-4">
              You must be logged in to create posts. Please sign in to continue sharing your intelligence findings.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Form validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    } else if (formData.content.trim().length > 500) {
      newErrors.content = 'Content must not exceed 500 characters';
    }

    // Location validation
    if (formData.latitude === null || formData.longitude === null) {
      newErrors.location = 'Location selection is required';
    }

    // Location name validation
    if (formData.locationName.trim().length > 100) {
      newErrors.locationName = 'Location name must not exceed 100 characters';
    }

    return newErrors;
  };

  // Handle location selection from LocationPicker
  const handleLocationSelect = useCallback((latitude: number, longitude: number) => {
    setFormData(prev => ({
      ...prev,
      latitude,
      longitude,
    }));
    
    // Clear location error if it exists
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: undefined }));
    }
  }, [errors.location]);

  // Handle location clear
  const handleLocationClear = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      latitude: null,
      longitude: null,
    }));
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error on change
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear submit error on any change
    if (submitError) {
      setSubmitError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;

    // Clear previous errors
    setErrors({});
    setSubmitError(null);

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare post data
      const createPostData: CreatePostData = {
        content: formData.content.trim(),
        latitude: formData.latitude!,
        longitude: formData.longitude!,
        location_name: formData.locationName.trim() || undefined,
      };

      // Create post via API
      const response = await postsService.createPost(createPostData);
      
      // Add post to context for immediate UI update
      addPost(response.post);

      // Show success state
      setIsSuccess(true);
      
      // Navigate to map page with new post highlighted
      setTimeout(() => {
        navigate('/map', { 
          state: { newPostId: response.post.id } 
        });
      }, 1500);

    } catch (error: any) {
      console.error('Failed to create post:', error);
      
      // Handle different error types
      if (error.message?.includes('Network')) {
        setSubmitError('Network error occurred. Please check your connection and try again.');
      } else if (error.message?.includes('Authentication')) {
        setSubmitError('Authentication failed. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setSubmitError(error.message || 'Failed to create post. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/feed');
  };

  // Retry submission after error
  const handleRetry = () => {
    setSubmitError(null);
    handleSubmit(new Event('submit') as any);
  };

  // Character count for content
  const contentLength = formData.content.length;
  const maxContentLength = 500;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Post
            </h1>
            <p className="text-lg text-gray-600">
              Share your intelligence findings with the community
            </p>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">
                  Post created successfully! Redirecting to map...
                </span>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="mb-6">
              <ErrorDisplay
                message={submitError}
                type="error"
                action={
                  submitError.includes('Network') ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isSubmitting}
                    >
                      Try Again
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}

          {/* Main Form */}
          <div className="bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit} role="form" className="p-6 space-y-6">
              {/* Content Field */}
              <div>
                <label 
                  htmlFor="content" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Intelligence Report *
                </label>
                <textarea
                  id="content"
                  aria-label="Your Intelligence Report"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Describe your intelligence findings, observations, or analysis..."
                  rows={6}
                  maxLength={maxContentLength}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.content ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                
                {/* Character Count */}
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-500">
                    {contentLength} / {maxContentLength} characters
                  </div>
                  {errors.content && (
                    <div 
                      className="text-sm text-red-600" 
                      role="alert" 
                      aria-live="polite"
                    >
                      {errors.content}
                    </div>
                  )}
                </div>
              </div>

              {/* Location Name Field */}
              <div>
                <label 
                  htmlFor="locationName" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location Name
                </label>
                <input
                  id="locationName"
                  type="text"
                  aria-label="Location Name"
                  value={formData.locationName}
                  onChange={(e) => handleInputChange('locationName', e.target.value)}
                  placeholder="Optional: Give this location a name"
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.locationName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.locationName && (
                  <div 
                    className="mt-1 text-sm text-red-600" 
                    role="alert" 
                    aria-live="polite"
                  >
                    {errors.locationName}
                  </div>
                )}
              </div>

              {/* Location Picker Section */}
              <div>
                <h3 className="block text-sm font-medium text-gray-700 mb-4">
                  Select Location on Map *
                </h3>
                
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <LocationPicker
                    initialLatitude={formData.latitude}
                    initialLongitude={formData.longitude}
                    onLocationSelect={handleLocationSelect}
                    onLocationClear={handleLocationClear}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Coordinate Display */}
                {formData.latitude !== null && formData.longitude !== null && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center text-sm">
                      <MapPinIcon className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">
                        Selected coordinates:
                      </span>
                      <span className="ml-2 text-blue-700">
                        {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Coordinate Inputs (readonly) */}
                {formData.latitude !== null && formData.longitude !== null && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={formData.latitude.toFixed(6)}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={formData.longitude.toFixed(6)}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700"
                      />
                    </div>
                  </div>
                )}

                {errors.location && (
                  <div 
                    className="mt-2 text-sm text-red-600" 
                    role="alert" 
                    aria-live="polite"
                  >
                    {errors.location}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t border-gray-200">
                <div className="flex-1">
                  {/* Additional help text */}
                  <p className="text-xs text-gray-500">
                    * Required fields. Your post will be visible to all users on the intelligence map.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || isSuccess}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">Publishing...</span>
                      </div>
                    ) : isSuccess ? (
                      'Published!'
                    ) : (
                      'Publish Post'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Tips for Quality Intelligence Posts
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Be specific and factual in your observations
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Include relevant context and timing information
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Select the most accurate location possible
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Respect privacy and security considerations
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreatePostPage; 