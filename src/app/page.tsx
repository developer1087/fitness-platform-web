'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import TrainerLayout from '../components/TrainerLayout';
import { TraineeService } from '../lib/traineeService';
import { SessionService } from '../lib/sessionService';
import { PaymentService } from '../lib/paymentService';

// Dashboard data interfaces
interface DashboardStats {
  newTrainees: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  totalTrainees: number;
  pendingPayments: number;
  todaySessions: number;
}

interface RecentActivity {
  id: string;
  type: 'trainee_joined' | 'session_completed' | 'payment_received' | 'session_scheduled';
  message: string;
  time: string;
  icon: string;
  iconColor: string;
  timestamp?: number; // Temporary field for sorting
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    newTrainees: 0,
    sessionsThisMonth: 0,
    revenueThisMonth: 0,
    totalTrainees: 0,
    pendingPayments: 0,
    todaySessions: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid) return;

      try {
        // Load trainees, sessions, and payment data in parallel from Firestore
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        const currentYear = now.getFullYear();

        const [trainees, todaySessions, allSessions, paymentSummary, recentPayments] = await Promise.all([
          TraineeService.getTraineesByTrainer(user.uid),
          SessionService.getTodaySessions(user.uid),
          SessionService.getTrainerSessions(user.uid),
          PaymentService.getPaymentSummary(user.uid, currentYear, currentMonth),
          PaymentService.getTrainerPayments(user.uid)
        ]);

        // Calculate stats from real data
        const nowForFilter = new Date();
        const currentMonthForFilter = nowForFilter.getMonth();
        const currentYearForFilter = nowForFilter.getFullYear();

        // Count new trainees this month
        const newTraineesThisMonth = trainees.filter(trainee => {
          const joinDate = new Date(trainee.joinDate);
          return joinDate.getMonth() === currentMonthForFilter && joinDate.getFullYear() === currentYearForFilter;
        }).length;

        // Count sessions this month
        const sessionsThisMonth = allSessions.filter(session => {
          const sessionDate = new Date(session.scheduledDate);
          return sessionDate.getMonth() === currentMonthForFilter && sessionDate.getFullYear() === currentYearForFilter;
        }).length;

        // Set stats based on real data
        setStats({
          newTrainees: newTraineesThisMonth,
          sessionsThisMonth,
          revenueThisMonth: paymentSummary.totalRevenue,
          totalTrainees: trainees.length,
          pendingPayments: paymentSummary.pendingPayments,
          todaySessions: todaySessions.length
        });

        // Create recent activity from multiple sources
        const allActivity: RecentActivity[] = [];

        // Add trainee joins
        trainees.forEach((trainee) => {
          allActivity.push({
            id: `trainee-${trainee.id}`,
            type: 'trainee_joined' as const,
            message: `${trainee.firstName} ${trainee.lastName} joined as trainee`,
            time: getTimeAgo(new Date(trainee.joinDate)),
            timestamp: new Date(trainee.joinDate).getTime(),
            icon: 'user',
            iconColor: 'text-blue-600'
          });
        });

        // Add recent session bookings (from all sessions, not just today's)
        allSessions.forEach((session) => {
          if (session.createdAt) {
            const trainee = trainees.find((t) => t.userId === session.traineeId);
            const traineeName = trainee ? `${trainee.firstName} ${trainee.lastName}` : 'Unknown Trainee';
            allActivity.push({
              id: `session-${session.id}`,
              type: 'session_scheduled' as const,
              message: `Session booked with ${traineeName} on ${session.scheduledDate}`,
              time: getTimeAgo(new Date(session.createdAt)),
              timestamp: new Date(session.createdAt).getTime(),
              icon: 'calendar',
              iconColor: 'text-green-600'
            });
          }
        });

        // Add recent payments
        recentPayments.forEach((payment) => {
          if (payment.createdAt) {
            const trainee = trainees.find((t) => t.userId === payment.traineeId);
            const traineeName = trainee ? `${trainee.firstName} ${trainee.lastName}` : 'Unknown Trainee';
            allActivity.push({
              id: `payment-${payment.id}`,
              type: 'payment_received' as const,
              message: `Payment of ₪${payment.amount} received from ${traineeName}`,
              time: getTimeAgo(new Date(payment.createdAt)),
              timestamp: new Date(payment.createdAt).getTime(),
              icon: 'dollar',
              iconColor: 'text-yellow-600'
            });
          }
        });

        // Sort all activity by timestamp (most recent first) and take top 8
        const sortedActivity = allActivity
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 8)
          .map(({ timestamp, ...rest }) => rest); // Remove timestamp from final objects

        setRecentActivity(sortedActivity);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to empty/zero stats if there's an error
        setStats({
          newTrainees: 0,
          sessionsThisMonth: 0,
          revenueThisMonth: 0,
          totalTrainees: 0,
          pendingPayments: 0,
          todaySessions: 0
        });
        setRecentActivity([]);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">
            Welcome to Fitness Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track your fitness journey with our comprehensive platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block"
            >
              Sign In
            </a>
            <a
              href="/auth/signup"
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors inline-block"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TrainerLayout currentPage="dashboard">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a3 3 0 003-3V12a3 3 0 00-3-3h-4.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Trainees This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newTrainees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sessions This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sessionsThisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue This Month</p>
                <p className="text-2xl font-bold text-gray-900">₪{stats.revenueThisMonth.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Trainees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTrainees}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todaySessions}</p>
                <p className="text-sm text-gray-500 mt-1">Scheduled for today</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 12V7m6 0v14m-6-4h6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-3xl font-bold text-gray-900">₪{stats.pendingPayments.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Require follow-up</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a href="/trainees" className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium text-gray-900">Add New Trainee</span>
                </div>
              </a>

              <a href="/sessions" className="block w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 12V7m6 0v14m-6-4h6" />
                  </svg>
                  <span className="font-medium text-gray-900">Schedule Session</span>
                </div>
              </a>

              <a href="/payments" className="block w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-gray-900">View Payments & Reports</span>
                </div>
              </a>

              <a href="/messages" className="block w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="font-medium text-gray-900">Messages</span>
                </div>
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${activity.iconColor.replace('text-', 'bg-').replace('-600', '-100')} rounded-full flex items-center justify-center`}>
                      {activity.icon === 'user' && (
                        <svg className={`w-4 h-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {activity.icon === 'check' && (
                        <svg className={`w-4 h-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {activity.icon === 'dollar' && (
                        <svg className={`w-4 h-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      )}
                      {activity.icon === 'calendar' && (
                        <svg className={`w-4 h-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 12V7m6 0v14m-6-4h6" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </TrainerLayout>
  );
}