'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import TrainerLayout from '../../../components/TrainerLayout';
import { useParams } from 'next/navigation';
import { TraineeService } from '../../../lib/traineeService';
import { Trainee } from '../../../shared-types';


export default function TraineeDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'payments' | 'notes'>('overview');
  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Load trainee data
  useEffect(() => {
    if (id && user?.uid) {
      loadTrainee();
    }
  }, [id, user, loadTrainee]);

  const loadTrainee = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const traineeData = await TraineeService.getTraineeById(id);
      if (traineeData) {
        setTrainee(traineeData);
      } else {
        setError('Trainee not found');
      }
    } catch (err) {
      console.error('Error loading trainee:', err);
      setError('Failed to load trainee details');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <TrainerLayout currentPage="trainees">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Loading trainee details...</p>
          </div>
        </div>
      </TrainerLayout>
    );
  }

  if (error || !trainee) {
    return (
      <TrainerLayout currentPage="trainees">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="mt-2 text-red-600 font-medium">{error || 'Trainee not found'}</p>
            <a href="/trainees" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              ← Back to Trainees
            </a>
          </div>
        </div>
      </TrainerLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      trial: 'bg-blue-100 text-blue-800'
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };


  return (
    <TrainerLayout currentPage="trainees">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a
                href="/trainees"
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h2 className="text-2xl font-bold text-gray-900">
                {trainee.firstName} {trainee.lastName}
              </h2>
              <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(trainee.status)}`}>
                {trainee.status}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Schedule Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Profile Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
              {trainee.profilePicture ? (
                <img
                  src={trainee.profilePicture}
                  alt={`${trainee.firstName} ${trainee.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">{trainee.email}</p>
                  <p className="text-sm text-gray-500">Phone: Not set</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Physical Stats</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Age: Not set</p>
                  <p className="text-sm text-gray-500">Height: Not set</p>
                  <p className="text-sm text-gray-500">Weight: Not set</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Training Info</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">Level: {trainee.fitnessLevel}</p>
                  <p className="text-sm text-gray-900">Sessions: {trainee.totalSessions}</p>
                  <p className="text-sm text-gray-900">
                    Joined: {new Date(trainee.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Fitness Goals</h3>
            <div className="flex flex-wrap gap-2">
              {trainee.goals.map((goal, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {goal}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'sessions', label: 'Session History' },
                { key: 'payments', label: 'Payments' },
                { key: 'notes', label: 'Notes' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3 px-6 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">{trainee.notes || 'No notes available'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Emergency Contact & Medical Info</h3>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-700 text-sm">
                      📝 Emergency contact and medical information features will be implemented in the next update.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Session History</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    Schedule New Session
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    📅 Session management features will be implemented in the next update. You can currently track total sessions: <strong>{trainee.totalSessions}</strong>
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-green-700 text-sm">
                    💳 Payment management features will be implemented in the next update. This will include payment tracking, invoicing, and revenue analytics.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Trainer Notes</h3>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Note
                  </button>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <p className="text-purple-700 text-sm">
                    📝 Advanced note management will be implemented in the next update. Currently showing basic notes from trainee profile: <br/>
                    <strong>{trainee.notes || 'No notes available'}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals - Simplified for now */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Trainee Profile</h3>
              <p className="text-sm text-gray-600 mb-4">
                Profile editing functionality will be implemented next.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Note</h3>
              <p className="text-sm text-gray-600 mb-4">
                Note functionality will be implemented next.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TrainerLayout>
  );
}