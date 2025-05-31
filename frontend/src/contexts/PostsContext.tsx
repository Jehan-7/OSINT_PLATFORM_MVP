import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { PostsState, PostsContextValue, Post, PaginationData } from '../types';
import { postsService } from '../services/postsService';

// Posts action types
type PostsAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_POSTS'; payload: { posts: Post[]; pagination: PaginationData } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'SET_LAST_FETCHED'; payload: Date }
  | { type: 'UPDATE_CACHE'; payload: { key: string; data: Post[]; timestamp: Date } };

// Initial state
const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
  pagination: null,
  lastFetched: null,
  cache: new Map(),
};

// Posts reducer
function postsReducer(state: PostsState, action: PostsAction): PostsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_POSTS':
      return {
        ...state,
        posts: action.payload.posts,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts], // Add new post at beginning
      };
    case 'SET_LAST_FETCHED':
      return { ...state, lastFetched: action.payload };
    case 'UPDATE_CACHE':
      const newCache = new Map(state.cache);
      newCache.set(action.payload.key, { data: action.payload.data, timestamp: action.payload.timestamp });
      return { ...state, cache: newCache };
    default:
      return state;
  }
}

// Create context
const PostsContext = createContext<PostsContextValue | undefined>(undefined);

// Posts Provider Props
interface PostsProviderProps {
  children: ReactNode;
}

// Posts Provider Component
export function PostsProvider({ children }: PostsProviderProps) {
  const [state, dispatch] = useReducer(postsReducer, initialState);

  // Cache management
  const getCacheKey = (page: number, limit: number): string => `${page}-${limit}`;
  
  const isCacheValid = (timestamp: Date): boolean => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    return Date.now() - timestamp.getTime() < CACHE_DURATION;
  };

  // Fetch posts function
  const fetchPosts = async (
    page: number = 1, 
    limit: number = 20, 
    forceRefresh: boolean = false
  ): Promise<void> => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cacheKey = getCacheKey(page, limit);
        const cached = state.cache.get(cacheKey);
        
        if (cached && isCacheValid(cached.timestamp)) {
          dispatch({
            type: 'SET_POSTS',
            payload: { posts: cached.data, pagination: state.pagination! },
          });
          return;
        }
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await postsService.fetchPosts(page, limit);
      
      // Update cache
      const cacheKey = getCacheKey(page, limit);
      dispatch({
        type: 'UPDATE_CACHE',
        payload: { key: cacheKey, data: response.posts, timestamp: new Date() },
      });
      
      // Update state
      dispatch({
        type: 'SET_POSTS',
        payload: { posts: response.posts, pagination: response.pagination },
      });
      
      dispatch({ type: 'SET_LAST_FETCHED', payload: new Date() });
      
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message || 'Failed to fetch posts. Please try again.',
      });
    }
  };

  // Fetch single post by ID
  const fetchPostById = async (id: number): Promise<Post | null> => {
    try {
      const response = await postsService.fetchPostById(id);
      return response.post;
    } catch (error: any) {
      // Don't update global error state for individual post fetches
      console.error('Failed to fetch post:', error.message);
      return null;
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Refresh posts (force refresh)
  const refreshPosts = async (): Promise<void> => {
    const currentPage = state.pagination?.page || 1;
    const currentLimit = state.pagination?.limit || 20;
    await fetchPosts(currentPage, currentLimit, true);
  };

  // Add new post (for future post creation)
  const addPost = (post: Post): void => {
    dispatch({ type: 'ADD_POST', payload: post });
  };

  // Context value
  const value: PostsContextValue = {
    ...state,
    fetchPosts,
    fetchPostById,
    clearError,
    refreshPosts,
    addPost,
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

// Custom hook to use posts context
export function usePosts(): PostsContextValue {
  const context = useContext(PostsContext);
  
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  
  return context;
}

export default PostsContext; 