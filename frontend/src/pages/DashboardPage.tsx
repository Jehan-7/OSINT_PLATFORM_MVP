import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OSINT Platform</h1>
              <p className="text-gray-600">Intelligence Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.username}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Welcome to your Dashboard
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    User Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Username:</span> {user?.username}</p>
                    <p><span className="font-medium">Email:</span> {user?.email}</p>
                    <p><span className="font-medium">Reputation:</span> {user?.reputation}</p>
                    <p><span className="font-medium">Member since:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Sprint 3 Complete! 🎉
                  </h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <p>✅ Frontend Foundation Setup</p>
                    <p>✅ TypeScript Interfaces</p>
                    <p>✅ API Service Layer</p>
                    <p>✅ Authentication Context</p>
                    <p>✅ Registration & Login UI</p>
                    <p>✅ Protected Routing</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Next Steps (Sprint 4+)
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Post creation and viewing interface</li>
                  <li>• Geospatial map integration</li>
                  <li>• Community notes system</li>
                  <li>• Advanced search and filtering</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 