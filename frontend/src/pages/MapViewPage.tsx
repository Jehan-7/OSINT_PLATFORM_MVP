import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { usePosts } from '../contexts/PostsContext';
import { calculateBoundsFromPosts } from '../utils/mapUtils';
import { MAP_CONFIG } from '../config/mapConfig';
import PostMarker from '../components/map/PostMarker';
import MapSkeleton from '../components/map/MapSkeleton';
import MapErrorBoundary from '../components/map/MapErrorBoundary';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  MapIcon,
  PlusIcon,
  MapPinIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface MapViewPageState {
  mapCenter: [number, number];
  mapZoom: number;
  selectedPost: any | null;
  mapLoaded: boolean;
}

const MapViewPage: React.FC = () => {
  const { 
    posts, 
    loading, 
    error, 
    fetchPosts 
  } = usePosts();
  
  const mapRef = useRef<L.Map | null>(null);
  const [mapState, setMapState] = useState<MapViewPageState>({
    mapCenter: MAP_CONFIG.DEFAULT_CENTER,
    mapZoom: MAP_CONFIG.DEFAULT_ZOOM,
    selectedPost: null,
    mapLoaded: false
  });

  // Initial posts fetch
  useEffect(() => {
    if (posts.length === 0 && !loading && !error) {
      fetchPosts();
    }
  }, [posts.length, loading, error, fetchPosts]);

  // Auto-fit bounds when posts change (including new posts)
  useEffect(() => {
    if (posts.length > 0 && mapRef.current && mapState.mapLoaded) {
      try {
        const bounds = calculateBoundsFromPosts(posts);
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      } catch (error) {
        console.warn('Error fitting map bounds:', error);
      }
    }
  }, [posts, mapState.mapLoaded]);

  // Map event handlers
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    setMapState(prev => ({ ...prev, mapLoaded: true }));
    
    // Set up map event listeners
    map.on('moveend', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setMapState(prev => ({
        ...prev,
        mapCenter: [center.lat, center.lng],
        mapZoom: zoom
      }));
    });
  }, []);

  const handlePostMarkerClick = useCallback((post: any) => {
    setMapState(prev => ({ ...prev, selectedPost: post }));
    
    // Center map on selected post
    if (mapRef.current) {
      mapRef.current.setView([post.latitude, post.longitude], Math.max(mapState.mapZoom, 12));
    }
  }, [mapState.mapZoom]);

  // Loading state
  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Loading Map Data</p>
              <p className="text-sm text-blue-700">Fetching posts to display on the map...</p>
            </div>
          </div>
        </div>
        <MapSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <div className="flex">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Failed to Load Map Data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={() => fetchPosts(1, 20, true)}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Posts to Display</h3>
        <p className="mt-1 text-sm text-gray-500">
          No intelligence posts are available to show on the map yet.
        </p>
        <div className="mt-6">
          <Link
            to="/create-post"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create the First Post
          </Link>
        </div>
      </div>
    );
  }

  // Main map view
  return (
    <div className="space-y-6">
      {/* Map Statistics */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{posts.length} posts on map</span>
            </div>
            {mapState.selectedPost && (
              <div className="flex items-center text-sm text-blue-600">
                <EyeIcon className="h-4 w-4 mr-1" />
                <span>Post selected</span>
              </div>
            )}
          </div>
          <Link
            to="/create-post"
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Post
          </Link>
        </div>
      </div>

      {/* Interactive Map */}
      <MapErrorBoundary>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <MapContainer
            center={mapState.mapCenter}
            zoom={mapState.mapZoom}
            style={{ height: '600px', width: '100%' }}
            className="leaflet-container focus:outline-none"
            whenCreated={handleMapReady}
          >
            <TileLayer
              url={MAP_CONFIG.TILE_URL}
              attribution={MAP_CONFIG.ATTRIBUTION}
            />
            {posts.map(post => (
              <PostMarker
                key={post.id}
                post={post}
                onClick={handlePostMarkerClick}
                isSelected={post.id === mapState.selectedPost?.id}
              />
            ))}
          </MapContainer>
        </div>
      </MapErrorBoundary>

      {/* Post Creation Call-to-Action */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Share Your Intelligence
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>See something important? Create a post to share it with the community.</p>
            </div>
            <div className="mt-3">
              <Link
                to="/create-post"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Create New Post
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewPage; 