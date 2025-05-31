import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationPicker from '../../../components/map/LocationPicker';

// Mock the MapClickHandler and coordinate selection
let mockMapClickHandler: any = null;

// Mock React-Leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, className, whenCreated, ...props }: any) => {
    if (whenCreated) {
      const mockMap = {
        setView: vi.fn(),
        fitBounds: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        getCenter: vi.fn(() => ({ lat: center[0], lng: center[1] })),
        getZoom: vi.fn(() => zoom),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      setTimeout(() => whenCreated(mockMap), 0);
    }
    
    return (
      <div 
        data-testid="location-picker-map" 
        data-center={center?.join(',')} 
        data-zoom={zoom}
        className={className}
        onClick={(e) => {
          // Simulate map click with coordinates via the MapClickHandler
          if (mockMapClickHandler) {
            mockMapClickHandler(40.7580, -73.9855);
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  },

  TileLayer: ({ url, attribution }: any) => (
    <div 
      data-testid="location-picker-tile-layer" 
      data-url={url}
      data-attribution={attribution}
    />
  ),

  Marker: ({ position, children }: any) => (
    <div 
      data-testid={`location-picker-marker-${position[0]},${position[1]}`}
      data-lat={position[0]} 
      data-lng={position[1]}
    >
      {children}
    </div>
  ),

  Popup: ({ children }: any) => (
    <div data-testid="location-picker-popup">
      {children}
    </div>
  ),

  useMapEvents: (handlers: any) => {
    // Store the click handler for later use
    mockMapClickHandler = (lat: number, lng: number) => {
      // Create proper Leaflet-style event structure
      const mockEvent = {
        latlng: { lat, lng },
        containerPoint: { x: 100, y: 100 },
        layerPoint: { x: 100, y: 100 }
      };
      handlers.click?.(mockEvent);
    };
    return null;
  }
}));

describe('LocationPicker', () => {
  const mockOnLocationSelect = vi.fn();
  
  const defaultProps = {
    onLocationSelect: mockOnLocationSelect,
    className: 'test-class'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMapClickHandler = null;
  });

  describe('Component Rendering', () => {
    test('renders with default props', () => {
      render(<LocationPicker {...defaultProps} />);
      
      expect(screen.getByTestId('location-picker-container')).toBeInTheDocument();
      expect(screen.getByTestId('location-picker-map')).toBeInTheDocument();
      expect(screen.getByTestId('location-picker-tile-layer')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<LocationPicker {...defaultProps} className="custom-picker" />);
      
      const container = screen.getByTestId('location-picker-container');
      expect(container).toHaveClass('custom-picker');
    });

    test('displays initial coordinates when provided', () => {
      const initialCoords = { lat: 40.7128, lng: -74.0060 };
      render(
        <LocationPicker 
          {...defaultProps} 
          initialCoordinates={initialCoords}
        />
      );
      
      expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      expect(screen.getByDisplayValue('-74.006')).toBeInTheDocument();
      expect(screen.getByTestId('location-picker-marker-40.7128,-74.006')).toBeInTheDocument();
    });

    test('shows disabled state when disabled prop is true', () => {
      render(<LocationPicker {...defaultProps} disabled={true} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      const lngInput = screen.getByLabelText(/longitude/i);
      
      expect(latInput).toBeDisabled();
      expect(lngInput).toBeDisabled();
      expect(screen.getByText(/coordinate selection disabled/i)).toBeInTheDocument();
    });

    test('displays error message when error prop is provided', () => {
      const errorMessage = 'Invalid coordinates selected';
      render(<LocationPicker {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('location-picker-error')).toBeInTheDocument();
    });
  });

  describe('Map Interaction', () => {
    test('handles map click and updates coordinates', async () => {
      render(<LocationPicker {...defaultProps} />);
      
      const map = screen.getByTestId('location-picker-map');
      fireEvent.click(map);
      
      await waitFor(() => {
        expect(mockOnLocationSelect).toHaveBeenCalledWith({
          lat: 40.7580,
          lng: -73.9855
        });
      });
      
      // Should update input fields
      expect(screen.getByDisplayValue('40.758')).toBeInTheDocument();
      expect(screen.getByDisplayValue('-73.9855')).toBeInTheDocument();
      
      // Should place marker on map
      expect(screen.getByTestId('location-picker-marker-40.758,-73.9855')).toBeInTheDocument();
    });

    test('displays coordinate information after selection', async () => {
      render(<LocationPicker {...defaultProps} />);
      
      const map = screen.getByTestId('location-picker-map');
      fireEvent.click(map);
      
      await waitFor(() => {
        expect(screen.getByText(/selected coordinates/i)).toBeInTheDocument();
        // Search for coordinates in the green selection box (not the popup)
        const selectionBox = screen.getByText(/selected coordinates/i).closest('div');
        expect(selectionBox).toHaveTextContent('40.758000, -73.985500');
      });
    });

    test('shows helpful instruction text initially', () => {
      render(<LocationPicker {...defaultProps} />);
      
      expect(screen.getByText(/click on the map to select coordinates/i)).toBeInTheDocument();
      expect(screen.getByText(/you can also enter coordinates manually/i)).toBeInTheDocument();
    });
  });

  describe('Manual Input Fields', () => {
    test('handles manual latitude input with validation', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      await user.clear(latInput);
      await user.type(latInput, '40.7128');
      
      expect(latInput).toHaveValue('40.7128');
    });

    test('handles manual longitude input with validation', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const lngInput = screen.getByLabelText(/longitude/i);
      await user.clear(lngInput);
      await user.type(lngInput, '-74.0060');
      
      expect(lngInput).toHaveValue('-74.0060');
    });

    test('validates coordinate inputs and calls onLocationSelect', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      const lngInput = screen.getByLabelText(/longitude/i);
      
      await user.clear(latInput);
      await user.type(latInput, '40.7128');
      await user.clear(lngInput);
      await user.type(lngInput, '-74.0060');
      
      // Trigger validation by blurring input
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnLocationSelect).toHaveBeenCalledWith({
          lat: 40.7128,
          lng: -74.0060
        });
      });
    });

    test('shows validation errors for invalid latitude', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      await user.clear(latInput);
      await user.type(latInput, '95'); // Invalid latitude > 90
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/latitude must be between -90 and 90/i)).toBeInTheDocument();
      });
      
      expect(mockOnLocationSelect).not.toHaveBeenCalled();
    });

    test('shows validation errors for invalid longitude', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const lngInput = screen.getByLabelText(/longitude/i);
      await user.clear(lngInput);
      await user.type(lngInput, '185'); // Invalid longitude > 180
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/longitude must be between -180 and 180/i)).toBeInTheDocument();
      });
      
      expect(mockOnLocationSelect).not.toHaveBeenCalled();
    });

    test('shows validation errors for non-numeric input', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      await user.clear(latInput);
      await user.type(latInput, 'invalid');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid number/i)).toBeInTheDocument();
      });
      
      expect(mockOnLocationSelect).not.toHaveBeenCalled();
    });
  });

  describe('Clear Functionality', () => {
    test('provides clear button to reset coordinates', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} initialCoordinates={{ lat: 40.7128, lng: -74.0060 }} />);
      
      // Should show clear button when coordinates are set - check by text content
      expect(screen.getByText(/clear selection/i)).toBeInTheDocument();
      
      await user.click(screen.getByText(/clear selection/i));
      
      // Should clear input fields
      expect(screen.getByLabelText(/latitude/i)).toHaveValue('');
      expect(screen.getByLabelText(/longitude/i)).toHaveValue('');
      
      // Should call onLocationSelect with null to indicate cleared state
      expect(mockOnLocationSelect).toHaveBeenCalledWith(null);
    });

    test('hides clear button when no coordinates are selected', () => {
      render(<LocationPicker {...defaultProps} />);
      
      expect(screen.queryByText(/clear selection/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<LocationPicker {...defaultProps} />);
      
      expect(screen.getByLabelText(/latitude/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/longitude/i)).toHaveAttribute('aria-label');
      expect(screen.getByRole('region', { name: /coordinate selection map/i })).toBeInTheDocument();
    });

    test('provides screen reader announcements for coordinate selection', async () => {
      render(<LocationPicker {...defaultProps} />);
      
      const map = screen.getByTestId('location-picker-map');
      fireEvent.click(map);
      
      await waitFor(() => {
        // The announcement is in a sr-only div, check by searching for the text content
        const announcement = document.querySelector('[aria-live="polite"]');
        expect(announcement).toHaveTextContent('Coordinates selected: 40.758, -73.9855');
      });
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      
      // Should be focusable
      await user.tab();
      expect(latInput).toHaveFocus();
      
      // Should move to longitude input
      await user.tab();
      expect(screen.getByLabelText(/longitude/i)).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    test('handles coordinate validation edge cases', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      
      // Test edge case: exactly 90 degrees (valid)
      await user.clear(latInput);
      await user.type(latInput, '90');
      await user.tab();
      
      expect(screen.queryByText(/latitude must be between/i)).not.toBeInTheDocument();
      
      // Test edge case: exactly -90 degrees (valid)
      await user.clear(latInput);
      await user.type(latInput, '-90');
      await user.tab();
      
      expect(screen.queryByText(/latitude must be between/i)).not.toBeInTheDocument();
    });

    test('handles decimal precision correctly', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      const lngInput = screen.getByLabelText(/longitude/i);
      
      await user.clear(latInput);
      await user.type(latInput, '40.123456789');
      await user.clear(lngInput);
      await user.type(lngInput, '-74.987654321');
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnLocationSelect).toHaveBeenCalledWith({
          lat: 40.123456789,
          lng: -74.987654321
        });
      });
    });

    test('shows helpful error messages for common mistakes', async () => {
      const user = userEvent.setup();
      render(<LocationPicker {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      
      // Test common mistake: using longitude range for latitude
      await user.clear(latInput);
      await user.type(latInput, '120'); // Valid longitude, invalid latitude
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/latitude must be between -90 and 90/i)).toBeInTheDocument();
      });
    });
  });
}); 