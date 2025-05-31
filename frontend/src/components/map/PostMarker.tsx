import React, { useCallback, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '../../types/posts';
import { PostMarkerProps } from '../../config/mapConfig';
import { 
  MapPinIcon, 
  ChevronUpIcon, 
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

// Create custom marker icons
const createMarkerIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-marker',
  html: `
    <div class="w-6 h-6 rounded-full border-2 ${
      isSelected 
        ? 'bg-red-500 border-red-300 ring-2 ring-red-200' 
        : 'bg-blue-500 border-blue-300'
    } shadow-lg flex items-center justify-center">
      <div class="w-2 h-2 bg-white rounded-full"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const PostMarker: React.FC<PostMarkerProps> = ({ 
  post, 
  onClick, 
  isSelected = false 
}) => {
  const handleMarkerClick = useCallback(() => {
    onClick?.(post);
  }, [post, onClick]);

  const markerIcon = useMemo(() => createMarkerIcon(isSelected), [isSelected]);

  return (
    <Marker 
      position={[post.latitude, post.longitude]}
      eventHandlers={{ click: handleMarkerClick }}
      icon={markerIcon}
    >
      <Popup maxWidth={300} className="custom-popup">
        <div className="max-w-xs">
          <h3 className="font-semibold text-sm mb-2 line-clamp-3 leading-tight">
            {post.content}
          </h3>
          
          <div className="text-xs text-gray-600 space-y-1 mb-3">
            <p>
              By: <span className="font-medium text-gray-900">{post.author.username}</span>
              <span className="mx-1">•</span>
              <span className="text-blue-600">{post.author.reputation} rep</span>
            </p>
            <p className="text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
            {post.location_name && (
              <p className="flex items-center text-gray-500">
                <MapPinIcon className="h-3 w-3 mr-1" />
                <span className="truncate">{post.location_name}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-green-600">
                <ChevronUpIcon className="h-3 w-3 mr-0.5" />
                {post.upvotes}
              </span>
              <span className="flex items-center text-red-600">
                <ChevronDownIcon className="h-3 w-3 mr-0.5" />
                {post.downvotes}
              </span>
            </div>
            <Link
              to={`/posts/${post.id}`}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
            >
              View Details
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default PostMarker; 