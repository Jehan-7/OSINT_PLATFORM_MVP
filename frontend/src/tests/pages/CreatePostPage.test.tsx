import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CreatePostPage } from '../../pages/CreatePostPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { PostsProvider } from '../../contexts/PostsContext';
import * as postsService from '../../services/postsService';

// Mock React-Leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(({ children, ...props }) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  )),
  TileLayer: vi.fn(() => <div data-testid="tile-layer" />),
  Marker: vi.fn(({ children, position, eventHandlers }) => (
    <div 
      data-testid={`marker-${position[0]},${position[1]}`}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  )),
  Popup: vi.fn(({ children }) => <div data-testid="popup">{children}</div>),
  useMapEvents: vi.fn((handlers) => {
    React.useEffect(() => {
      // Simulate a map click event during testing
      const mapClickEvent = new CustomEvent('test-map-click', {
        detail: { latlng: { lat: 40.7128, lng: -74.0060 } }
      });
      
      window.addEventListener('test-map-click', () => {
        handlers.click?.({ latlng: { lat: 40.7128, lng: -74.0060 } });
      });
      
      return () => window.removeEventListener('test-map-click', handlers.click);
    }, [handlers]);
    
    return null;
  })
}));

// Mock posts service
vi.mock('../../services/postsService', () => ({
  createPost: vi.fn(),
}));

// Mock navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

const mockCreatePostResponse = {
  id: 1,
  content: 'Test post content',
  author: mockUser,
  latitude: 40.7128,
  longitude: -74.0060,
  location_name: 'New York City',
  upvotes: 0,
  downvotes: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Helper function to render component with providers
const renderCreatePostPage = (authState = { isAuthenticated: true, user: mockUser }) => {
  return render(
    <MemoryRouter initialEntries={['/create-post']}>
      <AuthProvider initialAuth={authState}>
        <PostsProvider>
          <Routes>
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/map" element={<div>Map Page</div>} />
          </Routes>
        </PostsProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('CreatePostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Component Rendering', () => {
    it('renders create post form with all elements', () => {
      renderCreatePostPage();

      expect(screen.getByText(/create new post/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your intelligence report/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      expect(screen.getByText(/select location on map/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /publish post/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders location picker component', () => {
      renderCreatePostPage();

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByText(/click on the map to select coordinates/i)).toBeInTheDocument();
    });

    it('shows authentication required message for unauthenticated users', () => {
      renderCreatePostPage({ isAuthenticated: false, user: null });

      expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      expect(screen.getByText(/you must be logged in to create posts/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });

    it('displays proper page title and breadcrumbs', () => {
      renderCreatePostPage();

      expect(screen.getByRole('heading', { name: /create new post/i })).toBeInTheDocument();
      expect(screen.getByText(/share your intelligence findings/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for empty content', async () => {
      renderCreatePostPage();

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for missing location', async () => {
      renderCreatePostPage();

      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Test content' } });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/location selection is required/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for content too short', async () => {
      renderCreatePostPage();

      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Short' } });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/content must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for content too long', async () => {
      renderCreatePostPage();

      const longContent = 'a'.repeat(501); // Exceeding 500 character limit
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: longContent } });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/content must not exceed 500 characters/i)).toBeInTheDocument();
      });
    });

    it('validates location name length', async () => {
      renderCreatePostPage();

      const locationInput = screen.getByLabelText(/location name/i);
      const longLocationName = 'a'.repeat(101); // Exceeding 100 character limit
      fireEvent.change(locationInput, { target: { value: longLocationName } });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/location name must not exceed 100 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Location Selection', () => {
    it('handles location selection from map click', async () => {
      renderCreatePostPage();

      // Simulate map click through custom event
      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
        expect(screen.getByDisplayValue('-74.0060')).toBeInTheDocument();
      });
    });

    it('displays selected coordinates in readonly inputs', async () => {
      renderCreatePostPage();

      // Simulate location selection
      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        const latInput = screen.getByDisplayValue('40.7128');
        const lngInput = screen.getByDisplayValue('-74.0060');
        
        expect(latInput).toHaveAttribute('readonly');
        expect(lngInput).toHaveAttribute('readonly');
      });
    });

    it('shows clear location button when coordinates are selected', async () => {
      renderCreatePostPage();

      // Simulate location selection
      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear location/i })).toBeInTheDocument();
      });
    });

    it('clears location when clear button is clicked', async () => {
      renderCreatePostPage();

      // First select a location
      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      // Then clear it
      const clearButton = screen.getByRole('button', { name: /clear location/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('40.7128')).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue('-74.0060')).not.toBeInTheDocument();
      });
    });

    it('updates location instructions based on selection state', async () => {
      renderCreatePostPage();

      // Initially shows selection instruction
      expect(screen.getByText(/click on the map to select coordinates/i)).toBeInTheDocument();

      // After selection, shows selected coordinates
      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByText(/selected coordinates:/i)).toBeInTheDocument();
        expect(screen.getByText(/40.7128, -74.0060/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits valid form data successfully', async () => {
      const createPostSpy = vi.mocked(postsService.createPost);
      createPostSpy.mockResolvedValue(mockCreatePostResponse);

      renderCreatePostPage();

      // Fill form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Valid test content for post' } });

      const locationInput = screen.getByLabelText(/location name/i);
      fireEvent.change(locationInput, { target: { value: 'Test Location' } });

      // Select location
      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      // Submit form
      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(createPostSpy).toHaveBeenCalledWith({
          content: 'Valid test content for post',
          latitude: 40.7128,
          longitude: -74.0060,
          location_name: 'Test Location',
        });
      });
    });

    it('shows loading state during submission', async () => {
      const createPostSpy = vi.mocked(postsService.createPost);
      createPostSpy.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderCreatePostPage();

      // Fill valid form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Valid test content for post' } });

      // Select location
      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      // Submit form
      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      // Check loading state
      expect(screen.getByRole('button', { name: /publishing.../i })).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('navigates to map page after successful submission', async () => {
      const createPostSpy = vi.mocked(postsService.createPost);
      createPostSpy.mockResolvedValue(mockCreatePostResponse);

      renderCreatePostPage();

      // Fill and submit valid form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Valid test content for post' } });

      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/map', { 
          state: { newPostId: mockCreatePostResponse.id } 
        });
      });
    });

    it('shows success message after submission', async () => {
      const createPostSpy = vi.mocked(postsService.createPost);
      createPostSpy.mockResolvedValue(mockCreatePostResponse);

      renderCreatePostPage();

      // Fill and submit form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Valid test content for post' } });

      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/post created successfully/i)).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      const createPostSpy = vi.mocked(postsService.createPost);
      createPostSpy.mockRejectedValue(new Error('Failed to create post'));

      renderCreatePostPage();

      // Fill and submit form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Valid test content for post' } });

      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create post/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again/i)).toBeInTheDocument();
      });
    });

    it('handles network errors with retry option', async () => {
      const createPostSpy = vi.mocked(postsService.createPost);
      createPostSpy.mockRejectedValue(new Error('Network error'));

      renderCreatePostPage();

      // Fill and submit form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Valid test content for post' } });

      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('handles cancel button click', () => {
      renderCreatePostPage();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/feed');
    });

    it('resets form when reset button is clicked', async () => {
      renderCreatePostPage();

      // Fill form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Test content' } });

      const locationInput = screen.getByLabelText(/location name/i);
      fireEvent.change(locationInput, { target: { value: 'Test Location' } });

      // Select location
      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      // Reset form (if reset button exists)
      const resetButton = screen.queryByRole('button', { name: /reset/i });
      if (resetButton) {
        fireEvent.click(resetButton);

        await waitFor(() => {
          expect(contentTextarea).toHaveValue('');
          expect(locationInput).toHaveValue('');
          expect(screen.queryByDisplayValue('40.7128')).not.toBeInTheDocument();
        });
      }
    });

    it('shows character count for content field', () => {
      renderCreatePostPage();

      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Test content' } });

      expect(screen.getByText(/12 \/ 500 characters/i)).toBeInTheDocument();
    });

    it('prevents form submission when disabled', async () => {
      const createPostSpy = vi.mocked(postsService.createPost);
      createPostSpy.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderCreatePostPage();

      // Fill and submit form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Valid test content for post' } });

      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      // Try to click again while loading
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /publishing.../i });
        expect(loadingButton).toBeDisabled();
        fireEvent.click(loadingButton);
      });

      // Should only be called once
      expect(createPostSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderCreatePostPage();

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/your intelligence report/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
    });

    it('announces form validation errors to screen readers', async () => {
      renderCreatePostPage();

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/content is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('supports keyboard navigation', () => {
      renderCreatePostPage();

      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      const locationInput = screen.getByLabelText(/location name/i);
      const publishButton = screen.getByRole('button', { name: /publish post/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Tab through form elements
      contentTextarea.focus();
      expect(document.activeElement).toBe(contentTextarea);

      fireEvent.keyDown(contentTextarea, { key: 'Tab' });
      expect(document.activeElement).toBe(locationInput);

      fireEvent.keyDown(locationInput, { key: 'Tab' });
      // Focus should move to map or next focusable element

      // Check that buttons are keyboard accessible
      expect(publishButton).toHaveAttribute('type', 'submit');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });

    it('provides proper focus management', async () => {
      renderCreatePostPage();

      // Focus should be on content field initially
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByLabelText(/your intelligence report/i));
      });
    });
  });

  describe('Integration with PostsContext', () => {
    it('adds new post to context after successful creation', async () => {
      const createPostSpy = vi.mocked(postsService.createPost);
      createPostSpy.mockResolvedValue(mockCreatePostResponse);

      const TestWrapper = () => {
        const { posts } = React.useContext(PostsProvider.context);
        return (
          <div>
            <div data-testid="posts-count">{posts.length}</div>
            <CreatePostPage />
          </div>
        );
      };

      render(
        <MemoryRouter>
          <AuthProvider initialAuth={{ isAuthenticated: true, user: mockUser }}>
            <PostsProvider>
              <TestWrapper />
            </PostsProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      // Initial state
      expect(screen.getByTestId('posts-count')).toHaveTextContent('0');

      // Fill and submit form
      const contentTextarea = screen.getByLabelText(/your intelligence report/i);
      fireEvent.change(contentTextarea, { target: { value: 'Valid test content for post' } });

      const mapClickEvent = new CustomEvent('test-map-click');
      window.dispatchEvent(mapClickEvent);

      await waitFor(() => {
        expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      });

      const publishButton = screen.getByRole('button', { name: /publish post/i });
      fireEvent.click(publishButton);

      // Check that post was added to context
      await waitFor(() => {
        expect(screen.getByTestId('posts-count')).toHaveTextContent('1');
      });
    });
  });
}); 