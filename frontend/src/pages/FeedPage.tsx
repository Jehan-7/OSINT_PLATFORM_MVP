import React, { useEffect } from 'react';
import { usePosts } from '../contexts/PostsContext';
import { PostCard } from '../components/posts/PostCard';

// PostSkeleton component for loading state
const PostSkeleton: React.FC = () => (
  <div
    className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse"
    data-testid="post-skeleton"
  >
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded w-32"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

// ErrorState component
const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="text-center py-12" role="alert">
    <div
      className="mx-auto h-12 w-12 text-red-500 mb-4"
      data-testid="error-icon"
      aria-hidden="true"
    >
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load posts</h3>
    <p className="text-gray-600 mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
    >
      Try Again
    </button>
  </div>
);

// EmptyState component
const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <div
      className="mx-auto h-12 w-12 text-gray-400 mb-4"
      data-testid="empty-icon"
      aria-hidden="true"
    >
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
    <p className="text-gray-600">Be the first to share some intelligence! Posts will appear here once created.</p>
  </div>
);

// FeedPage component
export const FeedPage: React.FC = () => {
  const { posts, loading, error, fetchPosts, clearError, refreshPosts } = usePosts();

  useEffect(() => {
    // Only fetch if we don't have posts and no error
    if (posts.length === 0 && !error) {
      fetchPosts(1, 20, false);
    }
  }, [posts.length, error, fetchPosts]);

  // Handle retry functionality
  const handleRetry = () => {
    clearError();
    fetchPosts(1, 20, true);
  };

  // Handle refresh functionality
  const handleRefresh = () => {
    refreshPosts();
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Intelligence Feed</h1>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div aria-live="polite">
          <div className="text-center mb-6">
            <p className="text-gray-600">Loading posts...</p>
          </div>
          <div className="space-y-6" data-testid="posts-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState error={error} onRetry={handleRetry} />
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <EmptyState />
      )}

      {/* Posts List */}
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-6" data-testid="posts-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showAuthor={true}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default FeedPage; 