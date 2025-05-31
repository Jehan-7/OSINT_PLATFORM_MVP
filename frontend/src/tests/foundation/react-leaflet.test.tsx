import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MAP_CONFIG } from '../../config/mapConfig';
import { validateCoordinates, formatCoordinates } from '../../utils/mapUtils';

// Mock React-Leaflet at the top level
vi.mock('react-leaflet', () => ({
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
}));

// Import after mocking
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

describe('React-Leaflet Foundation', () => {
  beforeEach(() => {
    // Reset any mocks before each test
  });

  test('MapContainer renders with correct center and zoom', () => {
    render(
      <MapContainer center={[40.7128, -74.0060]} zoom={10}>
        <TileLayer url={MAP_CONFIG.TILE_URL} attribution={MAP_CONFIG.ATTRIBUTION} />
      </MapContainer>
    );
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toHaveAttribute('data-center', '40.7128,-74.006');
    expect(screen.getByTestId('map-container')).toHaveAttribute('data-zoom', '10');
  });

  test('TileLayer renders with correct URL and attribution', () => {
    render(
      <MapContainer center={[40, -74]} zoom={10}>
        <TileLayer url={MAP_CONFIG.TILE_URL} attribution={MAP_CONFIG.ATTRIBUTION} />
      </MapContainer>
    );
    
    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toBeInTheDocument();
    expect(tileLayer).toHaveAttribute('data-url', MAP_CONFIG.TILE_URL);
    expect(tileLayer).toHaveAttribute('data-attribution', MAP_CONFIG.ATTRIBUTION);
  });

  test('Marker renders at correct position', () => {
    const position: [number, number] = [40.7580, -73.9855];
    
    render(
      <MapContainer center={[40, -74]} zoom={10}>
        <Marker position={position}>
          <Popup>Test popup content</Popup>
        </Marker>
      </MapContainer>
    );
    
    const marker = screen.getByTestId('marker-40.758,-73.9855');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('data-lat', '40.758');
    expect(marker).toHaveAttribute('data-lng', '-73.9855');
  });

  test('Popup renders with content', () => {
    render(
      <MapContainer center={[40, -74]} zoom={10}>
        <Marker position={[40.7580, -73.9855]}>
          <Popup>Test popup content</Popup>
        </Marker>
      </MapContainer>
    );
    
    expect(screen.getByTestId('popup-content')).toBeInTheDocument();
    expect(screen.getByText('Test popup content')).toBeInTheDocument();
  });
});

describe('Map Configuration', () => {
  test('MAP_CONFIG has correct default values', () => {
    expect(MAP_CONFIG.DEFAULT_CENTER).toEqual([40.7128, -74.0060]);
    expect(MAP_CONFIG.DEFAULT_ZOOM).toBe(10);
    expect(MAP_CONFIG.MIN_ZOOM).toBe(2);
    expect(MAP_CONFIG.MAX_ZOOM).toBe(18);
    expect(MAP_CONFIG.TILE_URL).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(MAP_CONFIG.ATTRIBUTION).toContain('OpenStreetMap');
  });
});

describe('Map Utility Functions', () => {
  test('validateCoordinates function works correctly', () => {
    // Valid coordinates
    expect(validateCoordinates(40.7128, -74.0060)).toBe(true);
    expect(validateCoordinates(0, 0)).toBe(true);
    expect(validateCoordinates(-90, -180)).toBe(true);
    expect(validateCoordinates(90, 180)).toBe(true);
    
    // Invalid coordinates
    expect(validateCoordinates(91, 0)).toBe(false); // Invalid latitude > 90
    expect(validateCoordinates(-91, 0)).toBe(false); // Invalid latitude < -90
    expect(validateCoordinates(0, 181)).toBe(false); // Invalid longitude > 180
    expect(validateCoordinates(0, -181)).toBe(false); // Invalid longitude < -180
  });

  test('formatCoordinates produces correct string format', () => {
    expect(formatCoordinates(40.7128, -74.0060)).toBe('40.712800, -74.006000');
    expect(formatCoordinates(0, 0)).toBe('0.000000, 0.000000');
    expect(formatCoordinates(-12.345678, 123.456789)).toBe('-12.345678, 123.456789');
  });
});

describe('TypeScript Interface Validation', () => {
  test('MAP_CONFIG type checking', () => {
    // This test validates TypeScript compilation
    const center: [number, number] = MAP_CONFIG.DEFAULT_CENTER;
    const zoom: number = MAP_CONFIG.DEFAULT_ZOOM;
    const url: string = MAP_CONFIG.TILE_URL;
    
    expect(center).toHaveLength(2);
    expect(typeof zoom).toBe('number');
    expect(typeof url).toBe('string');
  });

  test('Coordinate validation with proper types', () => {
    const lat: number = 40.7128;
    const lng: number = -74.0060;
    
    const isValid: boolean = validateCoordinates(lat, lng);
    const formatted: string = formatCoordinates(lat, lng);
    
    expect(typeof isValid).toBe('boolean');
    expect(typeof formatted).toBe('string');
  });
}); 