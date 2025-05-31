import L from 'leaflet';
import { Post } from '../types/posts';
import { MAP_CONFIG } from '../config/mapConfig';

// Coordinate validation utilities
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Map bounds calculation from posts
export const calculateBoundsFromPosts = (posts: Post[]): L.LatLngBounds => {
  if (posts.length === 0) {
    // Return default bounds around NYC if no posts
    return L.latLngBounds(
      [MAP_CONFIG.DEFAULT_CENTER[0] - 0.1, MAP_CONFIG.DEFAULT_CENTER[1] - 0.1],
      [MAP_CONFIG.DEFAULT_CENTER[0] + 0.1, MAP_CONFIG.DEFAULT_CENTER[1] + 0.1]
    );
  }

  const coordinates = posts.map(post => [post.latitude, post.longitude] as [number, number]);
  return L.latLngBounds(coordinates);
};

// Performance utilities for marker management
export const isMarkerInBounds = (
  lat: number, 
  lng: number, 
  bounds: L.LatLngBounds
): boolean => {
  return bounds.contains([lat, lng]);
};

// Distance calculation between two coordinates (in kilometers)
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}; 