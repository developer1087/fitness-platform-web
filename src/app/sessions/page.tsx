'use client';

import { useAuth } from '../../hooks/useAuth';
import TrainerLayout from '../../components/TrainerLayout';

export default function SessionsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  return (
    <TrainerLayout currentPage="sessions">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Training Sessions</h2>
            <button
              disabled
              className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
            >
              Create Session (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Session Management Coming Soon! 💪</h3>
            <p className="text-gray-700 mb-4 max-w-2xl mx-auto">
              We're developing comprehensive session tracking and workout management tools to help you deliver
              exceptional training experiences and monitor your clients' progress.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Session Planning</h4>
                <p className="text-sm text-gray-600">Create detailed workout plans and exercise routines</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Progress Tracking</h4>
                <p className="text-sm text-gray-600">Monitor weights, reps, and performance improvements</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">⏱️ Real-time Logging</h4>
                <p className="text-sm text-gray-600">Log exercises and notes during sessions</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">📈 Analytics</h4>
                <p className="text-sm text-gray-600">Analyze session trends and client progress</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Exercise Database</h4>
                <p className="text-sm text-gray-600">Access comprehensive exercise library</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">📱 Mobile App</h4>
                <p className="text-sm text-gray-600">Session logging on mobile devices</p>
              </div>
            </div>
          </div>

          {/* Session Overview */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Sessions Preview */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">Sample Session {i}</h4>
                          <span className="text-xs text-gray-500">Preview Mode</span>
                        </div>
                        <p className="text-sm text-gray-600">Strength Training • 60 min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Session Stats */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Session Statistics</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Total Sessions</span>
                    <span className="text-lg font-semibold text-gray-900">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">This Month</span>
                    <span className="text-lg font-semibold text-gray-900">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Average Duration</span>
                    <span className="text-lg font-semibold text-gray-900">0 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Completed Rate</span>
                    <span className="text-lg font-semibold text-gray-900">0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Types Preview */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Session Types</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">Strength Training</h4>
                    <p className="text-sm text-gray-500 mt-1">0 sessions</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">Cardio</h4>
                    <p className="text-sm text-gray-500 mt-1">0 sessions</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">HIIT</h4>
                    <p className="text-sm text-gray-500 mt-1">0 sessions</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 002.5-2.5V6a2.5 2.5 0 00-2.5-2.5H9V10z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">Flexibility</h4>
                    <p className="text-sm text-gray-500 mt-1">0 sessions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TrainerLayout>
  );
}