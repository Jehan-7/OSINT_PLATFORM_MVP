import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome to OSINT Platform
            </h1>
            
            {user && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Hello, {user.username}!
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    🎉 Sprint 3 Complete!
                  </h3>
                  <p className="text-blue-700">
                    Frontend authentication system is now fully operational. You've successfully:
                  </p>
                  <ul className="mt-3 text-blue-700 space-y-1">
                    <li>• Registered or logged into your account</li>
                    <li>• Authenticated with the backend API</li>
                    <li>• Accessed this protected dashboard</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Your Profile</h3>
                {user && (
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Reputation:</strong> {user.reputation || 0}</p>
                    <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Next Steps</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Sprint 4: Post Creation UI</p>
                  <p>• Sprint 5: Map Integration</p>
                  <p>• Sprint 6: Community Features</p>
                  <p>• Sprint 7: Advanced Search</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 