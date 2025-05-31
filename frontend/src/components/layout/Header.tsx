import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlusIcon, MapIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreatePost = () => {
    if (user) {
      navigate('/create-post');
    } else {
      navigate('/login', { state: { from: '/create-post' } });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <EyeIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">OSINT Platform</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Main navigation">
            {/* Main Navigation Links */}
            <div className="flex items-center space-x-4">
              <Link
                to="/feed"
                className={`text-gray-700 hover:text-blue-600 font-medium transition-colors ${
                  isActiveRoute('/feed') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                }`}
              >
                Feed
              </Link>
              <Link
                to="/map"
                className={`flex items-center text-gray-700 hover:text-blue-600 font-medium transition-colors ${
                  isActiveRoute('/map') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                }`}
              >
                <MapIcon className="h-4 w-4 mr-1" />
                Map
              </Link>
              
              {/* Create Post Button */}
              <button
                onClick={handleCreatePost}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Post</span>
              </button>
            </div>

            {/* Authentication Section */}
            {user ? (
              <div className="flex items-center space-x-4 border-l border-gray-200 pl-4">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium text-gray-900">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="text-gray-700 hover:text-red-600 font-medium transition-colors"
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 border-l border-gray-200 pl-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden" data-testid="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {/* Main Navigation */}
              <div className="space-y-3">
                <Link
                  to="/feed"
                  className="block text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Feed
                </Link>
                <Link
                  to="/map"
                  className="block text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Map View
                </Link>
                <button
                  onClick={() => {
                    handleCreatePost();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Post
                </button>
              </div>

              {user ? (
                <div className="pt-3 border-t border-gray-100 mt-3">
                  <div className="px-3 py-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Signed in as <span className="font-medium text-gray-900">{user.username}</span>
                    </p>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="text-red-600 font-medium"
                    >
                      {loading ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-3 border-t border-gray-100 mt-3">
                  <Link
                    to="/login"
                    className="block text-gray-700 hover:text-blue-600 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 