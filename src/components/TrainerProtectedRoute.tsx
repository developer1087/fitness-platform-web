'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { TraineeService } from '../lib/traineeService';

interface TrainerProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that prevents trainees from accessing trainer dashboard
 * Checks if logged-in user exists in the trainees collection
 */
export function TrainerProtectedRoute({ children }: TrainerProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isTrainee, setIsTrainee] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (authLoading) {
        return; // Wait for auth to load
      }

      if (!user) {
        // Not logged in - redirect to login
        router.push('/auth/login');
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
  }, [user, authLoading, router]);

  // Show loading state while checking authentication and role
  if (authLoading || isCheckingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
                onClick={() => {
                  // Sign out and redirect to login
                  router.push('/auth/login');
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is a trainer - render children
  return <>{children}</>;
}
