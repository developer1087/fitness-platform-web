'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import TrainerLayout from '../../../components/TrainerLayout';
import { useParams } from 'next/navigation';

interface TraineeDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'trial';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  lastSession?: string;
  totalSessions: number;
  profilePicture?: string;
  age?: number;
  height?: string;
  weight?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalNotes?: string;
  sessionHistory: SessionHistory[];
  payments: PaymentHistory[];
  notes: TrainerNote[];
}

interface SessionHistory {
  id: string;
  date: string;
  duration: number;
  type: string;
  notes?: string;
  completed: boolean;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'paid' | 'pending' | 'overdue';
}

interface TrainerNote {
  id: string;
  date: string;
  note: string;
  category: 'progress' | 'behavior' | 'medical' | 'goal' | 'general';
}

// Mock data - in a real app this would come from an API
const mockTraineeDetails: TraineeDetails = {
  id: '1',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@email.com',
  phone: '+1 (555) 123-4567',
  joinDate: '2024-08-15',
  status: 'active',
  fitnessLevel: 'beginner',
  goals: ['Weight Loss', 'General Fitness', 'Improved Endurance'],
  lastSession: '2024-09-20',
  totalSessions: 12,
  profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=300&h=300&fit=crop&crop=face',
  age: 28,
  height: '5\'6"',
  weight: '140 lbs',
  emergencyContact: {
    name: 'Mike Johnson',
    phone: '+1 (555) 987-6543',
    relationship: 'Spouse'
  },
  medicalNotes: 'No known medical conditions. Cleared for all activities.',
  sessionHistory: [
    {
      id: '1',
      date: '2024-09-20',
      duration: 60,
      type: 'Strength Training',
      notes: 'Great progress on squats and deadlifts. Increased weight by 10lbs.',
      completed: true
    },
    {
      id: '2',
      date: '2024-09-18',
      duration: 45,
      type: 'Cardio',
      notes: 'Completed 30 minutes on treadmill, good form throughout.',
      completed: true
    },
    {
      id: '3',
      date: '2024-09-16',
      duration: 60,
      type: 'Full Body',
      notes: 'Focused on form and technique. Client showing improved confidence.',
      completed: true
    }
  ],
  payments: [
    {
      id: '1',
      date: '2024-09-01',
      amount: 320,
      method: 'Credit Card',
      status: 'paid'
    },
    {
      id: '2',
      date: '2024-08-01',
      amount: 320,
      method: 'Credit Card',
      status: 'paid'
    }
  ],
  notes: [
    {
      id: '1',
      date: '2024-09-20',
      note: 'Sarah is making excellent progress. She\'s become much more confident with weights.',
      category: 'progress'
    },
    {
      id: '2',
      date: '2024-09-15',
      note: 'Updated goals to include improved endurance after discussion with client.',
      category: 'goal'
    },
    {
      id: '3',
      date: '2024-09-10',
      note: 'Client mentioned some soreness after last session. Adjusted intensity.',
      category: 'general'
    }
  ]
};

export default function TraineeDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'payments' | 'notes'>('overview');
  const [trainee] = useState<TraineeDetails>(mockTraineeDetails);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      trial: 'bg-blue-100 text-blue-800'
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      progress: 'bg-green-100 text-green-800',
      behavior: 'bg-blue-100 text-blue-800',
      medical: 'bg-red-100 text-red-800',
      goal: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return styles[category as keyof typeof styles] || styles.general;
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
                  <p className="text-sm text-gray-900">{trainee.phone}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Physical Stats</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">Age: {trainee.age}</p>
                  <p className="text-sm text-gray-900">Height: {trainee.height}</p>
                  <p className="text-sm text-gray-900">Weight: {trainee.weight}</p>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Emergency Contact</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{trainee.emergencyContact?.name}</p>
                    <p className="text-sm text-gray-600">{trainee.emergencyContact?.phone}</p>
                    <p className="text-sm text-gray-600">{trainee.emergencyContact?.relationship}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Medical Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">{trainee.medicalNotes}</p>
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

                <div className="space-y-3">
                  {trainee.sessionHistory.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{session.type}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.date).toLocaleDateString()} • {session.duration} minutes
                          </p>
                          {session.notes && (
                            <p className="mt-2 text-sm text-gray-700">{session.notes}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.completed ? 'Completed' : 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trainee.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${payment.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

                <div className="space-y-3">
                  {trainee.notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(note.category)}`}>
                          {note.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(note.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-900">{note.note}</p>
                    </div>
                  ))}
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