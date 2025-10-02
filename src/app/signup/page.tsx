'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TraineeService } from '../../lib/traineeService';
import { authService } from '../../lib/auth';
import { TraineeInvitationRecord, SignupFormData, signupSchema } from '../../shared-types';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invitationToken = searchParams?.get('token');

  const [invitation, setInvitation] = useState<TraineeInvitationRecord | null>(null);
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(!!invitationToken);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Block ALL invitation-based signups on web - trainees must use mobile app
  useEffect(() => {
    if (invitationToken) {
      // Block form submission - trainees can only sign up via mobile app
      setInvitationError('Trainee signups must be completed via the mobile app. Please open this link on your mobile device to download the Ryzup Fitness app and complete your signup.');
      setIsLoadingInvitation(false);
    }
  }, [invitationToken]);

  const loadInvitation = async (token: string) => {
    setIsLoadingInvitation(true);
    setInvitationError(null);

    try {
      console.log('Loading invitation with token:', token);
      const invitationData = await TraineeService.getInvitationByToken(token);

      if (invitationData) {
        console.log('✅ Invitation loaded successfully:', invitationData);
        setInvitation(invitationData);
        // Pre-fill form with invitation data
        setFormData(prev => ({
          ...prev,
          firstName: invitationData.firstName,
          lastName: invitationData.lastName,
          email: invitationData.email,
        }));
      } else {
        setInvitationError('Invalid or expired invitation link. Please contact your trainer for a new invitation.');
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setInvitationError('Error loading invitation. Please try again or contact your trainer.');
    } finally {
      setIsLoadingInvitation(false);
    }
  };

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const redirectToAppStore = () => {
    // Detect device type and redirect to appropriate app store
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    // Get invitation token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (isIOS) {
      // For iOS: Use Universal Links or fallback to App Store
      const appStoreUrl = 'https://apps.apple.com/app/ryzup-fitness'; // Update when published
      const deepLink = `ryzup://invitation?token=${token || ''}`;

      // Show user a message about downloading the app
      const message = 'To complete your signup, please download the Ryzup Fitness app from the App Store.';

      // Try to open the app if installed
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);

      // Redirect to App Store
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.location.href = appStoreUrl;
      }, 2000);

    } else if (isAndroid) {
      // For Android: Use intent:// URL or fallback to Play Store
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.ryzup.fitness';
      const intentUrl = `intent://invitation?token=${token || ''}#Intent;scheme=ryzup;package=com.ryzup.fitness;end`;

      // Redirect to Play Store with intent fallback
      window.location.href = intentUrl;

      // Fallback to Play Store if app not installed
      setTimeout(() => {
        window.location.href = playStoreUrl;
      }, 2000);

    } else {
      // Desktop - show instructions
      alert('Please open this link on your mobile device to download the Ryzup Fitness app and complete your signup.');
      router.push('/');
    }
  };

  const validateForm = (): boolean => {
    try {
      signupSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof Error) {
        const zodError = JSON.parse(error.message);
        const newErrors: Record<string, string> = {};
        zodError.forEach((err: { path: string[]; message: string }) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const newUser = userCredential.user;
      console.log('User created:', newUser.uid);

      // If there's an invitation, accept it (trainee signup)
      if (invitation) {
        console.log('Attempting to accept invitation:', invitation.id, 'for user:', newUser.uid);
        await TraineeService.acceptInvitation(invitation.id, newUser.uid);
        console.log('✅ Invitation accepted successfully for:', invitation.id);

        // For trainee signup, redirect to app store
        redirectToAppStore();
      } else {
        // Regular trainer signup - create trainer profile
        await authService.updateUserProfile(newUser.uid, {
          firstName: formData.firstName,
          lastName: formData.lastName
        });

        // Redirect to trainer dashboard
        router.push('/');
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      // Provide more specific error messages
      let errorMessage = 'Signup failed. Please try again.';

      if (error?.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please use a different email or sign in.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address. Please check your email format.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          default:
            errorMessage = `Authentication error: ${error.message}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInvitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (invitationError) {
    // Check if this is an invitation token error (requires mobile app)
    const isMobileRequired = invitationToken && invitationError.includes('mobile app');

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {isMobileRequired ? (
              <>
                <div className="mx-auto h-16 w-16 flex items-center justify-center bg-blue-100 rounded-full">
                  <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Mobile App Required
                </h2>
                <p className="mt-4 text-center text-base text-gray-700">
                  {invitationError}
                </p>
                <div className="mt-8 space-y-4">
                  <div className="bg-white rounded-lg shadow p-6 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">How to complete your signup:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                      <li>Open this invitation link on your iPhone or Android device</li>
                      <li>Download the Ryzup Fitness app from the App Store or Google Play</li>
                      <li>Complete your signup in the app</li>
                    </ol>
                  </div>
                  <p className="text-sm text-gray-500">
                    If you're a trainer, please <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500">sign up here</Link> instead.
                  </p>
                </div>
              </>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Invitation Error
                </h2>
                <p className="mt-2 text-center text-sm text-red-600">
                  {invitationError}
                </p>
                <div className="mt-4">
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
                    Go to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-600 rounded-full">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {invitation ? 'Join Your Fitness Program' : 'Create your account'}
          </h2>
          {invitation && (
            <p className="mt-2 text-center text-sm text-gray-600">
              You've been invited by your trainer to join their fitness program
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  readOnly={!!invitation}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  } ${invitation ? 'bg-gray-100' : ''}`}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  readOnly={!!invitation}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  } ${invitation ? 'bg-gray-100' : ''}`}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                readOnly={!!invitation}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } ${invitation ? 'bg-gray-100' : ''}`}
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}