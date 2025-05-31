// Comprehensive React-Leaflet mocking for reliable test execution
import React from 'react';
import { vi } from 'vitest';

// Mock React-Leaflet components
export const mockReactLeaflet = {
  MapContainer: ({ children, center, zoom, className, whenCreated, ...props }: any) => {
    // Simulate map creation callback
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
  ),

  Marker: ({ position, children, eventHandlers, icon }: any) => (
    <div 
      data-testid={`marker-${position[0]},${position[1]}`}
      data-lat={position[0]} 
      data-lng={position[1]}
      data-icon={icon ? 'custom' : 'default'}
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </div>
  ),

  Popup: ({ children, maxWidth, className }: any) => (
    <div 
      data-testid="popup-content"
      data-max-width={maxWidth}
      className={className}
    >
      {children}
    </div>
  ),

  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getCenter: vi.fn(() => ({ lat: 40.7128, lng: -74.0060 })),
    getZoom: vi.fn(() => 10),
    getBounds: vi.fn(() => ({
      getNorth: () => 40.8,
      getSouth: () => 40.6,
      getEast: () => -73.9,
      getWest: () => -74.1
    }))
  }),

  useMapEvents: (handlers: any) => {
    // Mock map events for testing
    const mockEvents = {
      click: (event: any) => handlers.click?.(event),
      moveend: () => handlers.moveend?.(),
      zoomend: () => handlers.zoomend?.()
    };
    
    // Return mock map reference
    return { 
      handlers: mockEvents,
      fireEvent: (eventType: string, eventData: any) => {
        mockEvents[eventType as keyof typeof mockEvents]?.(eventData);
      }
    };
  }
};

// Setup mock for React-Leaflet
vi.mock('react-leaflet', () => mockReactLeaflet);

// Mock Leaflet core library
export const mockLeaflet = {
  latLngBounds: vi.fn((corner1, corner2) => ({
    contains: vi.fn(() => true),
    extend: vi.fn(() => mockLeaflet.latLngBounds()),
    getCenter: vi.fn(() => ({ lat: 40.7128, lng: -74.0060 })),
    getNorth: vi.fn(() => 40.8),
    getSouth: vi.fn(() => 40.6),
    getEast: vi.fn(() => -73.9),
    getWest: vi.fn(() => -74.1)
  })),
  
  divIcon: vi.fn((options) => ({
    options,
    _getIconUrl: vi.fn(),
    _createIcon: vi.fn(() => document.createElement('div'))
  }))
};

vi.mock('leaflet', () => mockLeaflet); 