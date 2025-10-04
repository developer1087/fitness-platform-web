'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TrainerLayout from '../../components/TrainerLayout';
import AddTraineeModal from '../../components/AddTraineeModal';
import { TraineeService } from '../../lib/traineeService';
import { TraineeInvitationFormData, Trainee } from '../../shared-types';

// Remove duplicate interface - using the one from shared-types

const mockTrainees: Trainee[] = [
  {
    id: '1',
    trainerId: 'trainer-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phoneNumber: '+1 (555) 123-4567',
    joinDate: '2024-08-15',
    status: 'active',
    fitnessLevel: 'beginner',
    goals: ['Weight Loss', 'General Fitness'],
    lastSession: '2024-09-20',
    totalSessions: 12,
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    trainerId: 'trainer-1',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@email.com',
    phoneNumber: '+1 (555) 987-6543',
    joinDate: '2024-07-22',
    status: 'active',
    fitnessLevel: 'intermediate',
    goals: ['Muscle Gain', 'Strength Training'],
    lastSession: '2024-09-19',
    totalSessions: 28,
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    trainerId: 'trainer-1',
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex.rivera@email.com',
    phoneNumber: '+1 (555) 456-7890',
    joinDate: '2024-09-01',
    status: 'trial',
    fitnessLevel: 'advanced',
    goals: ['Athletic Performance', 'Endurance'],
    lastSession: '2024-09-18',
    totalSessions: 6,
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '4',
    trainerId: 'trainer-1',
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma.wilson@email.com',
    joinDate: '2024-06-10',
    status: 'inactive',
    fitnessLevel: 'beginner',
    goals: ['Weight Loss', 'Flexibility'],
    lastSession: '2024-08-30',
    totalSessions: 15
  }
];

export default function TraineesPage() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'trial' | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load trainees on component mount
  useEffect(() => {
    if (user?.uid) {
      loadTrainees();
    }
  }, [user]);

  const loadTrainees = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);
    try {
      const traineesList = await TraineeService.getTraineesByTrainer(user.uid);
      setTrainees(traineesList);
    } catch (err) {
      console.error('Error loading trainees:', err);
      setError('Failed to load trainees. Please try again.');
      // Fallback to mock data for development
      setTrainees(mockTrainees);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainee = async (invitationData: TraineeInvitationFormData) => {
    if (!user?.uid) return;

    try {
      await TraineeService.inviteTrainee(user.uid, invitationData);
      // Reload trainees to show the new pending trainee
      await loadTrainees();
    } catch (err: any) {
      console.error('Error adding trainee:', err);
      // Re-throw to let modal handle the error
      throw new Error(err.message || 'Failed to add trainee');
    }
  };

  const handleDeleteTrainee = async (traineeId: string) => {
    try {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this trainee? This action cannot be undone.') : true;
      if (!confirmed) return;
      await TraineeService.deleteTrainee(traineeId);
      await loadTrainees();
    } catch (err) {
      console.error('Error deleting trainee:', err);
      setError('Failed to delete trainee. Please try again.');
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

  const filteredTrainees = trainees.filter(trainee => {
    const matchesSearch = `${trainee.firstName} ${trainee.lastName} ${trainee.email || ''} ${trainee.phoneNumber || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trainee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      trial: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getFitnessLevelBadge = (level: string) => {
    const styles = {
      beginner: 'bg-yellow-100 text-yellow-800',
      intermediate: 'bg-orange-100 text-orange-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return styles[level as keyof typeof styles] || styles.beginner;
  };

  return (
    <TrainerLayout currentPage="trainees">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Trainees</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Trainee
            </button>
          </div>
        </div>
      </div>

          {/* Filters and Search */}
          <div className="p-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search trainees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="trial">Trial</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-gray-600">Loading trainees...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Trainees Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrainees.map((trainee) => (
                <div key={trainee.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4">
                        {trainee.profilePicture ? (
                          <img
                            src={trainee.profilePicture}
                            alt={`${trainee.firstName} ${trainee.lastName}`}
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
                        <h3 className="text-lg font-semibold text-gray-900">
                          {trainee.firstName} {trainee.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{trainee.phoneNumber}</p>
                        {trainee.email && (
                          <p className="text-xs text-gray-500">{trainee.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(trainee.status)}`}>
                          {trainee.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Level:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFitnessLevelBadge(trainee.fitnessLevel)}`}>
                          {trainee.fitnessLevel}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sessions:</span>
                        <span className="text-sm font-medium text-gray-900">{trainee.totalSessions}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Session:</span>
                        <span className="text-sm text-gray-900">
                          {trainee.lastSession ? new Date(trainee.lastSession).toLocaleDateString() : 'Never'}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600">Goals:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trainee.goals.map((goal, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <a
                        href={`/trainees/${trainee.id}`}
                        className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium text-center"
                      >
                        View Profile
                      </a>
                      <button className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-md hover:bg-green-100 transition-colors text-sm font-medium">
                        Schedule
                      </button>
                      <button
                        onClick={() => handleDeleteTrainee(trainee.id)}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                        aria-label="Delete trainee"
                      >
                        Delete
                      </button>
                      <button className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

                {/* No Results */}
                {filteredTrainees.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a3 3 0 003-3V12a3 3 0 00-3-3h-4.5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No trainees found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by adding your first trainee.'
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

      {/* Add Trainee Modal */}
      <AddTraineeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTrainee}
      />
    </TrainerLayout>
  );
}