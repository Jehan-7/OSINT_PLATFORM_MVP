import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '../../types';

// PostCard component props
interface PostCardProps {
  post: Post;
  onClick?: (post: Post) => void;
  showAuthor?: boolean;
  className?: string;
}

// PostCard component for individual post display
export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onClick, 
  showAuthor = true, 
  className = '' 
}) => {
  // Format timestamp to relative time
  const formattedTime = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  
  // Determine location display
  const locationDisplay = post.location_name || `${post.latitude}, ${post.longitude}`;
  
  // Handle keyboard events for accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(post);
    }
  };

  // Handle click events
  const handleClick = () => {
    if (onClick) {
      onClick(post);
    }
  };

  // Determine if component should be interactive
  const isInteractive = !!onClick;

  // Base classes for the card
  const baseClasses = `
    bg-white rounded-lg shadow-md border border-gray-200 p-6
    ${isInteractive ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : ''}
    ${className}
  `.trim();

  // Common content JSX
  const cardContent = (
    <>
      {/* Post content with proper typography */}
      <div className="prose prose-sm max-w-none mb-4">
        <p className="text-gray-900 leading-relaxed">{post.content}</p>
      </div>
      
      {/* Post metadata */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          {showAuthor && (
            <>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{post.author.username}</span>
                <span className="text-gray-500">•</span>
                <span className="text-blue-600">{post.author.reputation} rep</span>
              </div>
              <span className="text-gray-500">•</span>
            </>
          )}
          <time dateTime={post.created_at} className="text-gray-500">
            {formattedTime}
          </time>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Location */}
          <div className="flex items-center space-x-1 text-gray-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate max-w-32">{locationDisplay}</span>
          </div>
          
          {/* Engagement metrics */}
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-green-600">{post.upvotes}</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="text-red-600">{post.downvotes}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );

  // Render as interactive button or static article
  if (isInteractive) {
    return (
      <button
        className={baseClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={`Post by ${post.author.username}`}
        type="button"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <article 
      className={baseClasses}
      aria-label={`Post by ${post.author.username}`}
    >
      {cardContent}
    </article>
  );
};

export default PostCard; 