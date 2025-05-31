import L from 'leaflet';
import { Post } from './posts';

// Map component specific types
export interface MapComponentState {
  mapCenter: [number, number];
  mapZoom: number;
  selectedPost: Post | null;
  mapLoaded: boolean;
}

export interface LocationPickerState {
  selectedCoordinates: { lat: number; lng: number } | null;
  manualLat: string;
  manualLng: string;
  coordinateError: string | null;
  mapCenter: [number, number];
  mapZoom: number;
}

// Map event handlers
export interface MapEventHandlers {
  onMapMove?: (center: [number, number], zoom: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (post: Post) => void;
  onPopupOpen?: (post: Post) => void;
  onPopupClose?: () => void;
}

// Map bounds and viewport
export interface MapViewport {
  center: [number, number];
  zoom: number;
  bounds?: L.LatLngBounds;
}

// Performance monitoring
export interface MapPerformanceMetrics {
  renderTime: number;
  markerCount: number;
  lastRenderTime: Date | null;
  memoryUsage?: number;
}

// Error states for map components
export interface MapError {
  code: string;
  message: string;
  recoverable: boolean;
  timestamp: Date;
}

export type MapErrorType = 
  | 'TILE_LOAD_ERROR'
  | 'MARKER_RENDER_ERROR'
  | 'LOCATION_SELECTION_ERROR'
  | 'BOUNDS_CALCULATION_ERROR'
  | 'COORDINATE_VALIDATION_ERROR'; 