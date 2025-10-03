export type AuthMethod = 'phone' | 'email' | 'google';

export interface User {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  role: UserRole;
  authMethod: AuthMethod;
  profile: UserProfile;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  preferences?: UserPreferences;
}

export interface UserPreferences {
  workoutReminders: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  privacySettings: {
    profileVisibility: 'public' | 'friends' | 'private';
    workoutDataSharing: boolean;
    progressSharing: boolean;
  };
}


export type UserRole = 'trainee' | 'trainer' | 'admin';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

// Phone Authentication
export interface PhoneAuthCredentials {
  phoneNumber: string;
  verificationCode: string;
}

export interface PhoneSignupCredentials {
  phoneNumber: string;
  verificationCode: string;
  firstName: string;
  lastName: string;
}