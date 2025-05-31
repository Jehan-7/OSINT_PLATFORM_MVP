// PostCard Component Tests - Following established component test patterns
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PostCard } from '../../components/posts/PostCard';
import type { Post } from '../../types';

// Mock data for testing
const mockPost: Post = {
  id: 1,
  content: 'Intelligence gathering spotted increased activity in downtown area. Multiple unmarked vehicles observed near the financial district.',
  author: {
    id: 1,
    username: 'analyst_user',
    reputation: 150,
  },
  latitude: 40.7829,
  longitude: -73.9654,
  location_name: 'Central Park, NYC',
  upvotes: 5,
  downvotes: 1,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const mockPostWithoutLocation: Post = {
  ...mockPost,
  id: 2,
  location_name: undefined,
  latitude: 40.7580,
  longitude: -73.9855,
};

const mockPostLongContent: Post = {
  ...mockPost,
  id: 3,
  content: 'This is a very long post content that should test how the component handles text wrapping and display of lengthy intelligence reports. It contains multiple sentences and should demonstrate proper typography and layout handling within the PostCard component. The content continues to test various edge cases and ensure that the component maintains readability and proper visual hierarchy even with extensive text content.',
};

describe('PostCard Component', () => {
  describe('Content Display', () => {
    it('should render post content and metadata correctly', () => {
      render(<PostCard post={mockPost} />);
      
      expect(screen.getByText(mockPost.content)).toBeInTheDocument();
      expect(screen.getByText(mockPost.author.username)).toBeInTheDocument();
      expect(screen.getByText(`${mockPost.author.reputation} rep`)).toBeInTheDocument();
      expect(screen.getByText(mockPost.location_name!)).toBeInTheDocument();
      expect(screen.getByText(mockPost.upvotes.toString())).toBeInTheDocument();
      expect(screen.getByText(mockPost.downvotes.toString())).toBeInTheDocument();
    });

    it('should display formatted timestamp', () => {
      render(<PostCard post={mockPost} />);
      
      // Should show relative time (e.g., "X hours ago", "X days ago")
      const timeElement = screen.getByText(/ago$/);
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('dateTime', mockPost.created_at);
    });

    it('should display coordinates when location_name is not available', () => {
      render(<PostCard post={mockPostWithoutLocation} />);
      
      expect(screen.getByText(`${mockPostWithoutLocation.latitude}, ${mockPostWithoutLocation.longitude}`)).toBeInTheDocument();
    });

    it('should handle long content gracefully', () => {
      render(<PostCard post={mockPostLongContent} />);
      
      expect(screen.getByText(mockPostLongContent.content)).toBeInTheDocument();
      // Content should be displayed without truncation in basic implementation
    });
  });

  describe('Author Information', () => {
    it('should show author information by default', () => {
      render(<PostCard post={mockPost} />);
      
      expect(screen.getByText(mockPost.author.username)).toBeInTheDocument();
      expect(screen.getByText(`${mockPost.author.reputation} rep`)).toBeInTheDocument();
    });

    it('should hide author information when showAuthor is false', () => {
      render(<PostCard post={mockPost} showAuthor={false} />);
      
      expect(screen.queryByText(mockPost.author.username)).not.toBeInTheDocument();
      expect(screen.queryByText(`${mockPost.author.reputation} rep`)).not.toBeInTheDocument();
    });
  });

  describe('Interaction Handling', () => {
    it('should handle click events correctly', () => {
      const handleClick = vi.fn();
      render(<PostCard post={mockPost} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledWith(mockPost);
    });

    it('should handle keyboard navigation', () => {
      const handleClick = vi.fn();
      render(<PostCard post={mockPost} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      
      // Should respond to Enter key
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalledWith(mockPost);
      
      // Should respond to Space key
      fireEvent.keyDown(card, { key: ' ', code: 'Space' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should not be interactive when onClick is not provided', () => {
      render(<PostCard post={mockPost} />);
      
      // Should not have button role when not interactive
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      
      // Should be an article element instead
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      render(<PostCard post={mockPost} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', `Post by ${mockPost.author.username}`);
    });

    it('should have proper semantic HTML structure', () => {
      render(<PostCard post={mockPost} />);
      
      // Should use semantic HTML elements
      expect(screen.getByRole('article')).toBeInTheDocument();
      
      // Time element should have proper datetime attribute
      const timeElement = screen.getByText(/ago$/);
      expect(timeElement.tagName.toLowerCase()).toBe('time');
      expect(timeElement).toHaveAttribute('dateTime', mockPost.created_at);
    });

    it('should be keyboard focusable when interactive', () => {
      const handleClick = vi.fn();
      render(<PostCard post={mockPost} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Visual States', () => {
    it('should apply custom className when provided', () => {
      const customClass = 'custom-post-card';
      render(<PostCard post={mockPost} className={customClass} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass(customClass);
    });

    it('should have hover states for interactive cards', () => {
      const handleClick = vi.fn();
      render(<PostCard post={mockPost} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      
      // Should have hover transition classes
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
    });

    it('should display engagement metrics with proper styling', () => {
      render(<PostCard post={mockPost} />);
      
      // Upvotes should be styled with green
      const upvoteElement = screen.getByText(mockPost.upvotes.toString()).closest('span');
      expect(upvoteElement).toHaveClass('text-green-600');
      
      // Downvotes should be styled with red
      const downvoteElement = screen.getByText(mockPost.downvotes.toString()).closest('span');
      expect(downvoteElement).toHaveClass('text-red-600');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive layout classes', () => {
      render(<PostCard post={mockPost} />);
      
      const card = screen.getByRole('article');
      
      // Should have responsive padding and spacing
      expect(card).toHaveClass('p-6');
      
      // Should have proper responsive text sizing
      const content = screen.getByText(mockPost.content);
      expect(content.closest('div')).toHaveClass('prose', 'prose-sm');
    });

    it('should handle location display responsively', () => {
      render(<PostCard post={mockPost} />);
      
      // Location should have truncation for long names
      const locationElement = screen.getByText(mockPost.location_name!);
      expect(locationElement).toHaveClass('truncate', 'max-w-32');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero engagement metrics', () => {
      const postWithZeroEngagement: Post = {
        ...mockPost,
        upvotes: 0,
        downvotes: 0,
      };
      
      render(<PostCard post={postWithZeroEngagement} />);
      
      // Should find both upvote and downvote zeros
      const upvoteZero = screen.getByText('0', { selector: '.text-green-600' });
      const downvoteZero = screen.getByText('0', { selector: '.text-red-600' });
      
      expect(upvoteZero).toBeInTheDocument();
      expect(downvoteZero).toBeInTheDocument();
    });

    it('should handle very high reputation numbers', () => {
      const postWithHighRep: Post = {
        ...mockPost,
        author: {
          ...mockPost.author,
          reputation: 99999,
        },
      };
      
      render(<PostCard post={postWithHighRep} />);
      
      expect(screen.getByText('99999 rep')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const postWithSpecialChars: Post = {
        ...mockPost,
        content: 'Special chars: @#$%^&*()_+ "quotes" and émojis 🔍',
      };
      
      render(<PostCard post={postWithSpecialChars} />);
      
      expect(screen.getByText(postWithSpecialChars.content)).toBeInTheDocument();
    });
  });
}); 