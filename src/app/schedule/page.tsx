'use client';

import { useAuth } from '../../hooks/useAuth';
import TrainerLayout from '../../components/TrainerLayout';

export default function SchedulePage() {
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
    <TrainerLayout currentPage="schedule">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Schedule & Calendar</h2>
            <button
              disabled
              className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
            >
              Schedule Session (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Schedule Management Coming Soon! 📅</h3>
            <p className="text-gray-700 mb-4 max-w-2xl mx-auto">
              We're building a comprehensive scheduling system to help you manage appointments,
              track availability, and streamline your training sessions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">📅 Calendar View</h4>
                <p className="text-sm text-gray-600">Visual calendar with drag-and-drop scheduling</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">⏰ Time Management</h4>
                <p className="text-sm text-gray-600">Set availability, block time, and manage conflicts</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">🔔 Notifications</h4>
                <p className="text-sm text-gray-600">Automatic reminders for you and your trainees</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">📱 Mobile Sync</h4>
                <p className="text-sm text-gray-600">Sync with Google Calendar and other platforms</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Session Types</h4>
                <p className="text-sm text-gray-600">Customize session types, durations, and locations</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Analytics</h4>
                <p className="text-sm text-gray-600">Track scheduling patterns and utilization</p>
              </div>
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Calendar Preview</h3>
                  <div className="flex items-center space-x-2">
                    <button disabled className="px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded cursor-not-allowed">← Prev</button>
                    <span className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <button disabled className="px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded cursor-not-allowed">Next →</button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - date.getDay() + i);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isCurrentMonth = date.getMonth() === new Date().getMonth();

                    return (
                      <div
                        key={i}
                        className={`p-3 h-20 border border-gray-100 rounded ${
                          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                      >
                        <div className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'} ${isToday ? 'font-bold text-blue-600' : ''}`}>
                          {date.getDate()}
                        </div>
                        {isCurrentMonth && Math.random() > 0.7 && (
                          <div className="mt-1">
                            <div className="h-1 bg-blue-200 rounded mb-1"></div>
                            <div className="text-xs text-gray-600 truncate">Preview Session</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available Hours</p>
                  <p className="text-2xl font-semibold text-gray-900">40</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TrainerLayout>
  );
}