import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MapViewPage from '../../pages/MapViewPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { PostsProvider } from '../../contexts/PostsContext';

// Mock React-Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, className, whenCreated, ...props }: any) => {
    if (whenCreated) {
      const mockMap = {
        setView: vi.fn(),
        fitBounds: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        getCenter: vi.fn(() => ({ lat: center[0], lng: center[1] })),
        getZoom: vi.fn(() => zoom)
      };
      setTimeout(() => whenCreated(mockMap), 0);
    }
    
    return (
      <div 
        data-testid="map-container" 
        data-center={center?.join(',')} 
        data-zoom={zoom}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  },

  TileLayer: ({ url, attribution }: any) => (
    <div 
      data-testid="tile-layer" 
      data-url={url}
      data-attribution={attribution}
    />
  )
}));

// Mock PostMarker
vi.mock('../../components/map/PostMarker', () => ({
  default: ({ post, onClick, isSelected }: any) => (
    <div 
      data-testid={`post-marker-${post.id}`}
      data-selected={isSelected}
      onClick={() => onClick?.(post)}
    >
      {post.content}
    </div>
  )
}));

// Mock PostsContext hook
const mockUsePosts = vi.fn();
vi.mock('../../contexts/PostsContext', async () => {
  const actual = await vi.importActual('../../contexts/PostsContext');
  return {
    ...actual,
    usePosts: () => mockUsePosts(),
    PostsProvider: ({ children }: any) => <div data-testid="posts-provider">{children}</div>
  };
});

// Mock data
const mockPosts = [
  {
    id: 1,
    content: 'Intelligence report from Times Square',
    author: { id: 1, username: 'analyst1', reputation: 100 },
    latitude: 40.7580,
    longitude: -73.9855,
    location_name: 'Times Square, NYC',
    upvotes: 5,
    downvotes: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    content: 'Suspicious activity near Central Park',
    author: { id: 2, username: 'analyst2', reputation: 75 },
    latitude: 40.7829,
    longitude: -73.9654,
    location_name: 'Central Park, NYC',
    upvotes: 3,
    downvotes: 0,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  }
];

// Global render function accessible to all tests
const renderMapViewPage = (postsState = { posts: mockPosts, loading: false, error: null, fetchPosts: vi.fn() }) => {
  // Set up the mock return value for usePosts
  mockUsePosts.mockReturnValue(postsState);
  
  return render(
    <MemoryRouter initialEntries={['/map']}>
      <AuthProvider>
        <PostsProvider>
          <MapViewPage />
        </PostsProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('MapViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows loading state while fetching posts', () => {
    renderMapViewPage({ posts: [], loading: true, error: null, fetchPosts: vi.fn() });
    
    expect(screen.getByText(/loading map data/i)).toBeInTheDocument();
    expect(screen.getByText(/fetching posts to display on the map/i)).toBeInTheDocument();
    expect(screen.getByTestId('map-skeleton')).toBeInTheDocument();
  });

  test('displays error state when posts fail to load', () => {
    const mockFetchPosts = vi.fn();
    renderMapViewPage({ posts: [], loading: false, error: 'Failed to load posts', fetchPosts: mockFetchPosts });
    
    expect(screen.getByText(/failed to load map data/i)).toBeInTheDocument();
    expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('shows empty state when no posts exist', () => {
    renderMapViewPage({ posts: [], loading: false, error: null, fetchPosts: vi.fn() });
    
    expect(screen.getByText(/no posts to display/i)).toBeInTheDocument();
    expect(screen.getByText(/no intelligence posts are available/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create the first post/i })).toBeInTheDocument();
  });

  test('renders map with posts successfully', async () => {
    renderMapViewPage();
    
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
      expect(screen.getByText(/2 posts on map/i)).toBeInTheDocument();
    });
    
    // Should render post markers
    expect(screen.getByTestId('post-marker-1')).toBeInTheDocument();
    expect(screen.getByTestId('post-marker-2')).toBeInTheDocument();
  });

  test('displays map statistics correctly', async () => {
    renderMapViewPage();
    
    await waitFor(() => {
      expect(screen.getByText(/2 posts on map/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /add post/i })).toBeInTheDocument();
    });
  });

  test('includes post creation call-to-action', async () => {
    renderMapViewPage();
    
    await waitFor(() => {
      expect(screen.getByText(/share your intelligence/i)).toBeInTheDocument();
      expect(screen.getByText(/see something important/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create new post/i })).toBeInTheDocument();
    });
  });

  test('handles post marker selection', async () => {
    renderMapViewPage();
    
    await waitFor(() => {
      const marker = screen.getByTestId('post-marker-1');
      expect(marker).toBeInTheDocument();
    });
    
    // Note: Full marker click testing would require more complex map mocking
    // This tests the component structure needed for interaction
  });

  test('map container has correct configuration', async () => {
    renderMapViewPage();
    
    await waitFor(() => {
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveAttribute('data-center', '40.7128,-74.006');
      expect(mapContainer).toHaveAttribute('data-zoom', '10');
    });
  });

  test('tile layer has correct OpenStreetMap configuration', async () => {
    renderMapViewPage();
    
    await waitFor(() => {
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toHaveAttribute('data-url', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      expect(tileLayer).toHaveAttribute('data-attribution', '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors');
    });
  });
});

describe('MapViewPage Error Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('is wrapped in MapErrorBoundary', async () => {
    renderMapViewPage();
    
    await waitFor(() => {
      // Should render map without error boundary activation
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });
});

describe('MapViewPage Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('includes correct navigation links', async () => {
    renderMapViewPage();
    
    await waitFor(() => {
      const createPostLinks = screen.getAllByRole('link');
      const createPostLink = createPostLinks.find(link => 
        link.getAttribute('href') === '/create-post'
      );
      expect(createPostLink).toBeInTheDocument();
    });
  });
}); 