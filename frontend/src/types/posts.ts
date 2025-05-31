// Posts Response Types (matching backend post controller exactly)

// Post data structure (from backend database schema)
export interface Post {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    reputation: number;
  };
  latitude: number;
  longitude: number;
  location_name?: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

// Pagination data structure (from backend API response)
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Success Response Types (matching backend post controller)
export interface PostsListResponse {
  success: true;
  posts: Post[];
  pagination: PaginationData;
}

export interface SinglePostResponse {
  success: true;
  post: Post;
}

// Error Response Types (matching backend error patterns)
export interface PostNotFoundResponse {
  success: false;
  message: 'Post not found';
  error: 'POST_NOT_FOUND';
}

export interface PostValidationErrorResponse {
  success: false;
  message: 'Validation failed';
  errors: string[];
}

export interface PostServerErrorResponse {
  success: false;
  message: string;
  error?: string;
}

// Union type for all possible post API error responses
export type PostApiErrorResponse = 
  | PostNotFoundResponse 
  | PostValidationErrorResponse 
  | PostServerErrorResponse;

// Create post data structure (for future use)
export interface CreatePostData {
  content: string;
  latitude: number;
  longitude: number;
  location_name?: string;
}

// Posts context state structure
export interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  pagination: PaginationData | null;
  lastFetched: Date | null;
  cache: Map<string, { data: Post[]; timestamp: Date }>;
}

// Posts context actions interface
export interface PostsContextValue extends PostsState {
  fetchPosts: (page?: number, limit?: number, forceRefresh?: boolean) => Promise<void>;
  fetchPostById: (id: number) => Promise<Post | null>;
  clearError: () => void;
  refreshPosts: () => Promise<void>;
  addPost: (post: Post) => void; // For future post creation
} 