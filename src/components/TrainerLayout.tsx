'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { TraineeService } from '../lib/traineeService';

interface TrainerLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

export default function TrainerLayout({ children, currentPage = 'dashboard' }: TrainerLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isTrainee, setIsTrainee] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsCheckingRole(false);
        return;
      }

      try {
        // Check if this user exists in the trainees collection
        const traineeData = await TraineeService.getTraineeByUserId(user.uid);

        if (traineeData) {
          // User is a trainee - block access to trainer dashboard
          setIsTrainee(true);
        } else {
          // User is NOT a trainee - allow access (they're a trainer)
          setIsTrainee(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        // On error, assume trainer (safer to allow access than block)
        setIsTrainee(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkUserRole();
  }, [user]);

  if (!user || isCheckingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Block trainee access - show error page
  if (isTrainee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center bg-red-100 rounded-full">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-4 text-center text-base text-gray-700">
              This is the trainer dashboard. Trainees should use the Ryzup Fitness mobile app.
            </p>
            <div className="mt-8 space-y-4">
              <div className="bg-white rounded-lg shadow p-6 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  To access your fitness program:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Download the Ryzup Fitness app from the App Store or Google Play</li>
                  <li>Sign in with your email: <strong className="text-gray-900">{user?.email}</strong></li>
                  <li>Access your workouts, progress tracking, and more</li>
                </ol>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  router.push('/auth/login');
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 002 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2V5z" />
        </svg>
      ),
      id: 'dashboard'
    },
    {
      name: 'Trainees',
      href: '/trainees',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a3 3 0 003-3V12a3 3 0 00-3-3h-4.5z" />
        </svg>
      ),
      id: 'trainees'
    },
    {
      name: 'Sessions',
      href: '/sessions',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      id: 'sessions'
    },
    {
      name: 'Schedule',
      href: '/schedule',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 12V7m6 0v14m-6-4h6" />
        </svg>
      ),
      id: 'schedule'
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      id: 'payments'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      id: 'profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen fixed">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">
              Trainer Hub
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome, {user.profile.firstName}!
            </p>
          </div>

          <nav className="mt-6">
            <div className="px-6 space-y-1">
              {navigationItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="absolute bottom-6 left-6">
            <button
              onClick={signOut}
              className="text-gray-700 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <svg className="text-gray-400 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {children}
        </div>
      </div>
    </div>
  );
}