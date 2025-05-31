import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CreatePostPage } from '../../pages/CreatePostPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { PostsProvider } from '../../contexts/PostsContext';

// Mock React-Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMapEvents: () => null,
}));

describe('CreatePostPage - Simple Test', () => {
  it('should render without crashing', () => {
    const TestWrapper = () => (
      <MemoryRouter>
        <AuthProvider initialAuth={{ isAuthenticated: true, user: { id: 1, username: 'test' } }}>
          <PostsProvider>
            <CreatePostPage />
          </PostsProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(() => render(<TestWrapper />)).not.toThrow();
  });
}); 