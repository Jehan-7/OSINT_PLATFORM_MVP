// Import Post type for interface definitions
import { Post } from '../types/posts';
import L from 'leaflet';

// Map configuration constants for React-Leaflet integration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [40.7128, -74.0060] as [number, number], // NYC fallback
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 2,
  MAX_ZOOM: 18,
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
} as const;

// TypeScript interfaces for map components
export interface MapViewProps {
  posts: Post[];
  loading: boolean;
  onPostMarkerClick?: (post: Post) => void;
  className?: string;
}

export interface PostMarkerProps {
  post: Post;
  onClick?: (post: Post) => void;
  isSelected?: boolean;
}

export interface LocationPickerProps {
  onLocationSelect: (coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
  className?: string;
  disabled?: boolean;
  error?: string;
}

export interface MapState {
  bounds: L.LatLngBounds | null;
  center: [number, number];
  zoom: number;
  selectedPostId: number | null;
} 