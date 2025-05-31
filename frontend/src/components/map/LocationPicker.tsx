import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { validateCoordinates, formatCoordinates } from '../../utils/mapUtils';
import { MAP_CONFIG } from '../../config/mapConfig';
import { LocationPickerProps, LocationPickerState } from '../../types/map';
import {
  MapPinIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Custom marker icon for selected location
const createLocationMarkerIcon = () => L.divIcon({
  html: `
    <div class="relative">
      <div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
      <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
    </div>
  `,
  className: 'location-picker-marker',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40]
});

// Map click handler component
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    }
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialCoordinates,
  className = '',
  disabled = false,
  error
}) => {
  const [state, setState] = useState<LocationPickerState>({
    selectedCoordinates: initialCoordinates || null,
    manualLat: initialCoordinates?.lat.toString() || '',
    manualLng: initialCoordinates?.lng.toString() || '',
    coordinateError: null,
    mapCenter: initialCoordinates 
      ? [initialCoordinates.lat, initialCoordinates.lng]
      : MAP_CONFIG.DEFAULT_CENTER,
    mapZoom: initialCoordinates ? 12 : MAP_CONFIG.DEFAULT_ZOOM
  });

  const announcementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Announce coordinate changes for screen readers
  const announceCoordinates = useCallback((lat: number, lng: number) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = `Coordinates selected: ${lat}, ${lng}`;
    }
  }, []);

  // Handle map click events
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (disabled) return;

    const coordinates = { lat, lng };
    setState(prev => ({
      ...prev,
      selectedCoordinates: coordinates,
      manualLat: lat.toString(),
      manualLng: lng.toString(),
      coordinateError: null,
      mapCenter: [lat, lng]
    }));

    onLocationSelect(coordinates);
    announceCoordinates(lat, lng);
  }, [disabled, onLocationSelect, announceCoordinates]);

  // Validate coordinate input
  const validateCoordinateInput = useCallback((lat: string, lng: string): string | null => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (lat && isNaN(latNum)) {
      return 'Please enter a valid number for latitude';
    }
    if (lng && isNaN(lngNum)) {
      return 'Please enter a valid number for longitude';
    }
    if (lat && !validateCoordinates(latNum, 0)) {
      return 'Latitude must be between -90 and 90 degrees';
    }
    if (lng && !validateCoordinates(0, lngNum)) {
      return 'Longitude must be between -180 and 180 degrees';
    }

    return null;
  }, []);

  // Handle manual coordinate input
  const handleManualInput = useCallback((type: 'lat' | 'lng', value: string) => {
    setState(prev => ({
      ...prev,
      [type === 'lat' ? 'manualLat' : 'manualLng']: value,
      coordinateError: null
    }));
  }, []);

  // Handle input blur (validation trigger)
  const handleInputBlur = useCallback(() => {
    const { manualLat, manualLng } = state;
    
    // Validate individual field that has content
    if (manualLat && !manualLng) {
      const validationError = validateCoordinateInput(manualLat, '');
      if (validationError) {
        setState(prev => ({ ...prev, coordinateError: validationError }));
        return;
      }
    }
    
    if (manualLng && !manualLat) {
      const validationError = validateCoordinateInput('', manualLng);
      if (validationError) {
        setState(prev => ({ ...prev, coordinateError: validationError }));
        return;
      }
    }
    
    // Both fields need to be filled for coordinate selection
    if (!manualLat || !manualLng) return;

    const validationError = validateCoordinateInput(manualLat, manualLng);
    
    if (validationError) {
      setState(prev => ({ ...prev, coordinateError: validationError }));
      return;
    }

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const coordinates = { lat, lng };

    setState(prev => ({
      ...prev,
      selectedCoordinates: coordinates,
      coordinateError: null,
      mapCenter: [lat, lng]
    }));

    onLocationSelect(coordinates);
    announceCoordinates(lat, lng);
  }, [state, validateCoordinateInput, onLocationSelect, announceCoordinates]);

  // Clear coordinate selection
  const handleClearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedCoordinates: null,
      manualLat: '',
      manualLng: '',
      coordinateError: null,
      mapCenter: MAP_CONFIG.DEFAULT_CENTER,
      mapZoom: MAP_CONFIG.DEFAULT_ZOOM
    }));

    onLocationSelect(null);
    
    if (announcementRef.current) {
      announcementRef.current.textContent = 'Coordinate selection cleared';
    }
  }, [onLocationSelect]);

  // Update map view when coordinates change
  useEffect(() => {
    if (mapRef.current && state.selectedCoordinates) {
      mapRef.current.setView([state.selectedCoordinates.lat, state.selectedCoordinates.lng], 12);
    }
  }, [state.selectedCoordinates]);

  const hasError = error || state.coordinateError;
  const hasSelection = state.selectedCoordinates !== null;

  return (
    <div 
      className={`space-y-4 ${className}`}
      data-testid="location-picker-container"
    >
      {/* Screen reader announcements */}
      <div 
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Error Display */}
      {hasError && (
        <div 
          className="bg-red-50 border border-red-200 rounded-md p-3"
          data-testid="location-picker-error"
          role="alert"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
            <p className="ml-2 text-sm text-red-800">
              {error || state.coordinateError}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!hasSelection && !disabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start">
            <InformationCircleIcon className="h-4 w-4 text-blue-400 mt-0.5" />
            <div className="ml-2 text-sm text-blue-800">
              <p className="font-medium">How to select coordinates:</p>
              <ul className="mt-1 space-y-1 text-blue-700">
                <li>• Click on the map to select coordinates</li>
                <li>• You can also enter coordinates manually below</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        className="relative border border-gray-200 rounded-lg overflow-hidden"
        role="region"
        aria-label="Coordinate selection map"
      >
        {disabled && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-10">
            <p className="text-gray-600 font-medium">Coordinate selection disabled</p>
          </div>
        )}

        <MapContainer
          center={state.mapCenter}
          zoom={state.mapZoom}
          style={{ height: '300px', width: '100%' }}
          className="focus:outline-none"
          whenCreated={(map) => { mapRef.current = map; }}
        >
          <TileLayer
            url={MAP_CONFIG.TILE_URL}
            attribution={MAP_CONFIG.ATTRIBUTION}
          />
          
          {!disabled && <MapClickHandler onMapClick={handleMapClick} />}
          
          {state.selectedCoordinates && (
            <Marker 
              position={[state.selectedCoordinates.lat, state.selectedCoordinates.lng]}
              icon={createLocationMarkerIcon()}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-medium">Selected Location</p>
                  <p className="text-sm text-gray-600">
                    {formatCoordinates(state.selectedCoordinates.lat, state.selectedCoordinates.lng)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Manual Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="latitude-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Latitude
          </label>
          <input
            id="latitude-input"
            type="text"
            value={state.manualLat}
            onChange={(e) => handleManualInput('lat', e.target.value)}
            onBlur={handleInputBlur}
            disabled={disabled}
            placeholder="e.g., 40.7128"
            aria-label="Latitude coordinate input"
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              disabled 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-gray-900'
            } ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        </div>

        <div>
          <label 
            htmlFor="longitude-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Longitude
          </label>
          <input
            id="longitude-input"
            type="text"
            value={state.manualLng}
            onChange={(e) => handleManualInput('lng', e.target.value)}
            onBlur={handleInputBlur}
            disabled={disabled}
            placeholder="e.g., -74.0060"
            aria-label="Longitude coordinate input"
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              disabled 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-gray-900'
            } ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        </div>
      </div>

      {/* Selected Coordinates Display */}
      {hasSelection && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 text-green-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-green-800">Selected Coordinates</p>
                <p className="text-sm text-green-700">
                  {formatCoordinates(state.selectedCoordinates!.lat, state.selectedCoordinates!.lng)}
                </p>
              </div>
            </div>
            
            {!disabled && (
              <button
                onClick={handleClearSelection}
                className="flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                aria-label="Clear coordinate selection"
              >
                <XMarkIcon className="h-3 w-3 mr-1" />
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 