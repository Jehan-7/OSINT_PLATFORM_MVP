import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ready to continue your OSINT investigations?
            </p>
            <Link to="/dashboard">
              <Button size="lg">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OSINT Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Open Source Intelligence Gathering & Analysis Platform
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Join our community of intelligence analysts and researchers. 
            Share insights, collaborate on investigations, and contribute to open source intelligence.
          </p>
          
          <div className="space-x-4">
            <Link to="/register">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Intelligence Posts
              </h3>
              <p className="text-gray-600">
                Share and discover intelligence reports with geospatial context
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Community Notes
              </h3>
              <p className="text-gray-600">
                Collaborative fact-checking and verification system
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure Platform
              </h3>
              <p className="text-gray-600">
                Built with security and privacy as core principles
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 