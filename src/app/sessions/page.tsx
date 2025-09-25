'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TrainerLayout from '../../components/TrainerLayout';

interface TrainingSession {
  id: string;
  traineeId: string;
  traineeName: string;
  traineePhoto?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  location: string;
  notes?: string;
  exercises?: Exercise[];
  completedAt?: string;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
}

const mockSessions: TrainingSession[] = [
  {
    id: '1',
    traineeId: '1',
    traineeName: 'Sarah Johnson',
    traineePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=150&h=150&fit=crop&crop=face',
    date: '2024-09-21',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    type: 'Strength Training',
    status: 'scheduled',
    location: 'Main Gym',
    notes: 'Focus on upper body today. Client wants to work on bench press form.'
  },
  {
    id: '2',
    traineeId: '2',
    traineeName: 'Mike Chen',
    traineePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    date: '2024-09-21',
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    type: 'HIIT',
    status: 'scheduled',
    location: 'Studio A',
    notes: 'High intensity interval training session.'
  },
  {
    id: '3',
    traineeId: '3',
    traineeName: 'Alex Rivera',
    traineePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    date: '2024-09-20',
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    type: 'Athletic Performance',
    status: 'completed',
    location: 'Main Gym',
    completedAt: '2024-09-20T16:55:00Z',
    exercises: [
      { id: '1', name: 'Squats', sets: 4, reps: '8-10', weight: '185 lbs', notes: 'Great form, increased weight' },
      { id: '2', name: 'Deadlifts', sets: 3, reps: '5', weight: '225 lbs', notes: 'Perfect technique' },
      { id: '3', name: 'Bench Press', sets: 4, reps: '8', weight: '155 lbs' },
      { id: '4', name: 'Pull-ups', sets: 3, reps: '12', notes: 'Bodyweight, excellent control' }
    ]
  },
  {
    id: '4',
    traineeId: '4',
    traineeName: 'Emma Wilson',
    date: '2024-09-19',
    startTime: '11:00',
    endTime: '12:00',
    duration: 60,
    type: 'Yoga & Flexibility',
    status: 'cancelled',
    location: 'Studio B',
    notes: 'Client cancelled due to illness.'
  },
  {
    id: '5',
    traineeId: '1',
    traineeName: 'Sarah Johnson',
    traineePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=150&h=150&fit=crop&crop=face',
    date: '2024-09-18',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    type: 'Cardio',
    status: 'completed',
    location: 'Cardio Zone',
    completedAt: '2024-09-18T09:58:00Z',
    exercises: [
      { id: '1', name: 'Treadmill', sets: 1, reps: '30 min', notes: 'Steady pace, good endurance' },
      { id: '2', name: 'Rowing Machine', sets: 3, reps: '5 min', notes: 'High intensity intervals' }
    ]
  }
];

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>(mockSessions);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  const filteredSessions = sessions.filter(session => {
    const matchesDate = !selectedDate || session.date === selectedDate;
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || styles.scheduled;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'scheduled':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 12V7m6 0v14m-6-4h6" />
          </svg>
        );
    }
  };

  const markAsCompleted = (sessionId: string) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, status: 'completed' as const, completedAt: new Date().toISOString() }
        : session
    ));
  };

  const markAsCancelled = (sessionId: string) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, status: 'cancelled' as const }
        : session
    ));
  };

  const viewSessionDetails = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  return (
    <TrainerLayout currentPage="sessions">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Schedule Session
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedDate('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 12V7m6 0v14m-6-4h6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedDate || statusFilter !== 'all'
                  ? 'Try adjusting your filters or schedule a new session.'
                  : 'Get started by scheduling your first session.'
                }
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(session.status)}
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                          {session.traineePhoto ? (
                            <img
                              src={session.traineePhoto}
                              alt={session.traineeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{session.traineeName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{session.type}</span>
                            <span>•</span>
                            <span>{new Date(session.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{session.startTime} - {session.endTime}</span>
                            <span>•</span>
                            <span>{session.location}</span>
                          </div>
                          {session.notes && (
                            <p className="text-sm text-gray-700 mt-2">{session.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                        {session.status === 'no-show' ? 'No Show' : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewSessionDetails(session)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {session.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => markAsCompleted(session.id)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Mark as Completed"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>

                            <button
                              onClick={() => markAsCancelled(session.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Cancel Session"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule New Session</h3>
              <p className="text-sm text-gray-600 mb-4">
                Session scheduling functionality will be implemented next.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
                <button
                  onClick={() => setShowSessionDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trainee</label>
                    <p className="text-sm text-gray-900">{selectedSession.traineeName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedSession.date).toLocaleDateString()} at {selectedSession.startTime}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="text-sm text-gray-900">{selectedSession.duration} minutes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="text-sm text-gray-900">{selectedSession.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="text-sm text-gray-900">{selectedSession.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedSession.status)}`}>
                      {selectedSession.status.charAt(0).toUpperCase() + selectedSession.status.slice(1)}
                    </span>
                  </div>
                </div>

                {selectedSession.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedSession.notes}</p>
                  </div>
                )}

                {selectedSession.exercises && selectedSession.exercises.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Exercises</label>
                    <div className="space-y-3">
                      {selectedSession.exercises.map((exercise) => (
                        <div key={exercise.id} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                              <p className="text-sm text-gray-600">
                                {exercise.sets} sets × {exercise.reps} reps
                                {exercise.weight && ` @ ${exercise.weight}`}
                              </p>
                              {exercise.notes && (
                                <p className="text-sm text-gray-700 mt-1">{exercise.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSession.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed At</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedSession.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowSessionDetails(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {selectedSession.status === 'scheduled' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Edit Session
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </TrainerLayout>
  );
}