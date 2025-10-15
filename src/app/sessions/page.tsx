'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TrainerLayout from '../../components/TrainerLayout';
import { SessionService } from '../../lib/sessionService';
import { TraineeService } from '../../lib/traineeService';
import { PaymentService } from '../../lib/paymentService';
import type { TrainingSession, CreateSessionFormData } from '../../shared-types/trainer-sessions';
import type { Trainee } from '../../shared-types';
import type { TraineePackage } from '../../shared-types/payment/types';

export default function SessionsPage() {
  const { user } = useAuth();
  const [allSessions, setAllSessions] = useState<TrainingSession[]>([]); // Store ALL sessions
  const [sessions, setSessions] = useState<TrainingSession[]>([]); // Filtered sessions for display
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('today');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load all sessions once
  useEffect(() => {
    if (user?.uid) {
      loadAllSessions();
      loadTrainees();
    }
  }, [user]);

  // Filter sessions when tab changes
  useEffect(() => {
    filterSessions();
  }, [activeTab, allSessions]);

  const loadAllSessions = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);
    try {
      // Load ALL sessions at once
      const sessionData = await SessionService.getTrainerSessions(user.uid, { limit: 100 });
      setAllSessions(sessionData);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    let filtered: TrainingSession[] = [];

    switch (activeTab) {
      case 'today':
        filtered = allSessions.filter(s =>
          s.scheduledDate === todayStr
        );
        break;
      case 'upcoming':
        filtered = allSessions.filter(s =>
          s.scheduledDate > todayStr && s.status !== 'completed' && s.status !== 'cancelled'
        );
        break;
      case 'completed':
        filtered = allSessions.filter(s => s.status === 'completed');
        break;
      default:
        filtered = allSessions;
    }

    setSessions(filtered);
  };

  const loadTrainees = async () => {
    if (!user?.uid) return;

    try {
      const traineeData = await TraineeService.getTraineesByTrainer(user.uid);
      setTrainees(traineeData.filter(t => t.status === 'active'));
    } catch (err) {
      console.error('Error loading trainees:', err);
    }
  };

  const handleCreateSession = async (sessionData: CreateSessionFormData) => {
    if (!user?.uid) return;

    try {
      await SessionService.createSession(user.uid, sessionData);
      setShowCreateModal(false);
      loadAllSessions(); // Refresh the list
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create session');
    }
  };

  const handleStatusUpdate = async (sessionId: string, status: TrainingSession['status']) => {
    try {
      await SessionService.updateSessionStatus(sessionId, status);
      loadAllSessions(); // Refresh the list
    } catch (err) {
      console.error('Error updating session status:', err);
      setError('Failed to update session');
    }
  };

  const getStatusBadge = (status: TrainingSession['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
      rescheduled: 'bg-yellow-100 text-yellow-800'
    };
    return styles[status] || styles.scheduled;
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'personal_training':
        return '🏋️';
      case 'group_training':
        return '👥';
      case 'assessment':
        return '📊';
      case 'consultation':
        return '💬';
      default:
        return '📅';
    }
  };

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
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Session
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              {
                key: 'today',
                label: 'Today',
                count: allSessions.filter(s => {
                  const today = new Date().toISOString().split('T')[0];
                  return s.scheduledDate === today;
                }).length
              },
              {
                key: 'upcoming',
                label: 'Upcoming',
                count: allSessions.filter(s => {
                  const today = new Date().toISOString().split('T')[0];
                  return s.scheduledDate > today && s.status !== 'completed' && s.status !== 'cancelled';
                }).length
              },
              {
                key: 'completed',
                label: 'Completed',
                count: allSessions.filter(s => s.status === 'completed').length
              },
              {
                key: 'all',
                label: 'All Sessions',
                count: allSessions.length
              }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-600">Loading sessions...</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first training session.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Session
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              // Try to find trainee by document ID first, then by userId field
              const trainee = trainees.find(t => t.id === session.traineeId || (t as any).userId === session.traineeId);
              const sessionDate = new Date(session.scheduledDate);

              // Parse startTime correctly (it's in HH:MM format)
              const [hours, minutes] = (session.startTime || '00:00').split(':').map(Number);
              const startTimeDisplay = new Date(sessionDate);
              startTimeDisplay.setHours(hours, minutes, 0, 0);

              return (
                <div key={session.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getSessionTypeIcon(session.type)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                          <p className="text-sm text-gray-600">
                            {trainee ? `${trainee.firstName} ${trainee.lastName}` : 'Unknown trainee'} • {session.type ? session.type.replace('_', ' ') : 'Session'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Date & Time:</span>
                          <p className="text-gray-900">
                            {sessionDate.toLocaleDateString()} at {startTimeDisplay.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Duration:</span>
                          <p className="text-gray-900">{session.duration} minutes</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Location:</span>
                          <p className="text-gray-900">{session.location || 'Not specified'}</p>
                        </div>
                      </div>

                      {session.description && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-500 text-sm">Description:</span>
                          <p className="text-gray-900 text-sm mt-1">{session.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(session.status || 'scheduled')}`}>
                        {session.status ? session.status.replace('_', ' ') : 'scheduled'}
                      </span>

                      <div className="flex space-x-2">
                        {session.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(session.id, 'in_progress')}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {session.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusUpdate(session.id, 'completed')}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-gray-600 px-2 py-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          trainees={trainees}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSession}
        />
      )}
    </TrainerLayout>
  );
}

// Create Session Modal Component
interface CreateSessionModalProps {
  trainees: Trainee[];
  onClose: () => void;
  onSubmit: (data: CreateSessionFormData) => void;
}

function CreateSessionModal({ trainees, onClose, onSubmit }: CreateSessionModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateSessionFormData>({
    traineeId: '',
    title: '',
    description: '',
    type: 'personal_training',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '',
    duration: 60,
    location: '',
    sessionRate: 200, // Default session rate in ILS
    trainerNotes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [traineePackages, setTraineePackages] = useState<TraineePackage[]>([]);
  const [usePackageCredit, setUsePackageCredit] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Load trainee packages when trainee is selected
  useEffect(() => {
    const loadTraineePackages = async () => {
      if (formData.traineeId && user?.uid) {
        try {
          const packages = await PaymentService.getTraineePackages(formData.traineeId, user.uid);
          const activePackages = packages.filter(p => p.status === 'active' && p.remainingSessions > 0);
          setTraineePackages(activePackages);

          // Auto-select first active package if available
          if (activePackages.length > 0) {
            setSelectedPackageId(activePackages[0].id);
            setUsePackageCredit(true);
          } else {
            setUsePackageCredit(false);
            setSelectedPackageId('');
          }
        } catch (err) {
          console.error('Error loading trainee packages:', err);
        }
      } else {
        setTraineePackages([]);
        setUsePackageCredit(false);
        setSelectedPackageId('');
      }
    };

    loadTraineePackages();
  }, [formData.traineeId, user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.traineeId) newErrors.traineeId = 'Please select a trainee';
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Include payment information in the session data
      const sessionDataWithPayment: CreateSessionFormData = {
        ...formData,
        usePackageCredit,
        traineePackageId: usePackageCredit ? selectedPackageId : undefined,
        createInvoiceAt: usePackageCredit ? undefined : 'before_24h' // Create invoice 24h before if not using package
      };

      await onSubmit(sessionDataWithPayment);
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Create Training Session</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trainee</label>
                <select
                  value={formData.traineeId}
                  onChange={(e) => setFormData({ ...formData, traineeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a trainee</option>
                  {trainees.map((trainee) => (
                    <option key={trainee.id} value={trainee.id}>
                      {trainee.firstName} {trainee.lastName}
                    </option>
                  ))}
                </select>
                {errors.traineeId && <p className="text-sm text-red-600 mt-1">{errors.traineeId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="personal_training">Personal Training</option>
                  <option value="group_training">Group Training</option>
                  <option value="assessment">Assessment</option>
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Strength Training Session"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Optional session description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.startTime && <p className="text-sm text-red-600 mt-1">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Gym, Studio A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Rate ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sessionRate}
                  onChange={(e) => setFormData({ ...formData, sessionRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Notes</label>
              <textarea
                value={formData.trainerNotes}
                onChange={(e) => setFormData({ ...formData, trainerNotes: e.target.value })}
                rows={3}
                placeholder="Pre-session notes, goals, or reminders..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Payment & Billing</h4>

              {traineePackages.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="usePackageCredit"
                      checked={usePackageCredit}
                      onChange={(e) => setUsePackageCredit(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="usePackageCredit" className="text-sm font-medium text-gray-700">
                      Use trainee's package credit (מנוי)
                    </label>
                  </div>

                  {usePackageCredit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Package</label>
                      <select
                        value={selectedPackageId}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {traineePackages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.packageName} - {pkg.remainingSessions} sessions remaining
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        One session credit will be deducted from this package
                      </p>
                    </div>
                  )}

                  {!usePackageCredit && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                      <p className="text-sm text-yellow-800">
                        💳 <strong>Pay-per-session:</strong> Invoice of ₪{formData.sessionRate} will be generated 24h before the session
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    💳 <strong>Pay-per-session:</strong> Invoice of ₪{formData.sessionRate} will be generated 24h before the session
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Trainee has no active packages. They can purchase a package from the Payments page.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}