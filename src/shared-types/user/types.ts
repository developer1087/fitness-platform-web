// Enhanced User Profile Types for Fitness Platform

export interface UserProfile {
  // Basic Information
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Physical Measurements
  height?: PhysicalMeasurement; // in cm
  weight?: PhysicalMeasurement; // in kg
  bodyFatPercentage?: number;

  // Fitness Information
  fitnessLevel: FitnessLevel;
  activityLevel: ActivityLevel;
  fitnessGoals: FitnessGoal[];
  workoutPreferences: WorkoutPreferences;

  // Health & Medical
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  injuries?: Injury[];

  // Preferences & Settings
  preferences: UserPreferences;

  // Tracking
  createdAt: Date;
  updatedAt: Date;
}

export interface PhysicalMeasurement {
  value: number;
  unit: string;
  recordedAt: Date;
}

export type FitnessLevel =
  | 'beginner'      // 0-6 months experience
  | 'novice'        // 6-12 months experience
  | 'intermediate'  // 1-2 years experience
  | 'advanced'      // 2+ years experience
  | 'expert';       // 5+ years experience

export type ActivityLevel =
  | 'sedentary'     // Little to no exercise
  | 'lightly_active' // Light exercise 1-3 days/week
  | 'moderately_active' // Moderate exercise 3-5 days/week
  | 'very_active'   // Hard exercise 6-7 days/week
  | 'extremely_active'; // Very hard exercise, physical job

export interface FitnessGoal {
  id: string;
  type: FitnessGoalType;
  target: GoalTarget;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

export type FitnessGoalType =
  | 'weight_loss'
  | 'weight_gain'
  | 'muscle_gain'
  | 'strength_increase'
  | 'endurance_improvement'
  | 'flexibility_improvement'
  | 'body_recomposition'
  | 'maintain_fitness'
  | 'sport_specific'
  | 'rehabilitation'
  | 'general_health';

export interface GoalTarget {
  metric: string; // e.g., 'weight', 'body_fat_percentage', 'bench_press_max'
  currentValue?: number;
  targetValue: number;
  unit: string;
}

export interface WorkoutPreferences {
  preferredWorkoutTypes: WorkoutType[];
  workoutDuration: DurationPreference;
  workoutFrequency: FrequencyPreference;
  preferredTimeSlots: TimeSlot[];
  equipmentAccess: EquipmentType[];
  workoutLocation: WorkoutLocation[];
}

export type WorkoutType =
  | 'strength_training'
  | 'cardio'
  | 'hiit'
  | 'yoga'
  | 'pilates'
  | 'crossfit'
  | 'bodyweight'
  | 'powerlifting'
  | 'olympic_lifting'
  | 'calisthenics'
  | 'swimming'
  | 'running'
  | 'cycling'
  | 'martial_arts'
  | 'dance'
  | 'sports_specific';

export interface DurationPreference {
  preferred: number; // minutes
  minimum: number;
  maximum: number;
}

export interface FrequencyPreference {
  sessionsPerWeek: number;
  restDaysPreferred: number[];
}

export type TimeSlot =
  | 'early_morning'   // 5-8 AM
  | 'morning'         // 8-11 AM
  | 'late_morning'    // 11-12 PM
  | 'afternoon'       // 12-5 PM
  | 'evening'         // 5-8 PM
  | 'night';          // 8-11 PM

export type EquipmentType =
  | 'none'
  | 'dumbbells'
  | 'barbells'
  | 'resistance_bands'
  | 'kettlebells'
  | 'pull_up_bar'
  | 'gym_machine'
  | 'cardio_equipment'
  | 'yoga_mat'
  | 'full_gym_access';

export type WorkoutLocation =
  | 'home'
  | 'gym'
  | 'outdoor'
  | 'studio'
  | 'online';

export interface Injury {
  id: string;
  type: string;
  description: string;
  affectedBodyParts: string[];
  severity: 'mild' | 'moderate' | 'severe';
  status: 'current' | 'recovering' | 'healed';
  injuryDate: Date;
  expectedRecoveryDate?: Date;
  restrictions?: string[];
}

export interface UserPreferences {
  // Notifications
  workoutReminders: boolean;
  progressReminders: boolean;
  goalDeadlineReminders: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;

  // Units
  unitSystem: 'metric' | 'imperial';

  // Privacy
  privacySettings: PrivacySettings;

  // App Behavior
  autoLogWorkouts: boolean;
  syncWithWearables: boolean;
  enableSocialFeatures: boolean;
  showProgressPhotos: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  workoutDataSharing: boolean;
  progressSharing: boolean;
  goalSharing: boolean;
  leaderboardParticipation: boolean;
}

// Extended User interface
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;

  // Timestamps
  createdAt: string;
  lastLoginAt: string;

  // Role & Status
  role: UserRole;
  accountStatus: AccountStatus;
  subscriptionTier: SubscriptionTier;

  // Profile
  profile: UserProfile;

  // Analytics
  analytics?: UserAnalytics;
}

export type UserRole =
  | 'user'          // Regular user
  | 'premium_user'  // Premium subscriber
  | 'trainer'       // Certified trainer
  | 'nutritionist'  // Certified nutritionist
  | 'admin'         // Platform administrator
  | 'super_admin';  // Super administrator

export type AccountStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'banned'
  | 'pending_verification';

export type SubscriptionTier =
  | 'free'
  | 'basic'
  | 'premium'
  | 'professional';

export interface UserAnalytics {
  totalWorkouts: number;
  totalWorkoutTime: number; // minutes
  currentStreak: number; // days
  longestStreak: number; // days
  averageWorkoutsPerWeek: number;
  favoriteWorkoutType: WorkoutType;
  totalCaloriesBurned: number;
  joinDate: Date;
  lastActiveDate: Date;
}

// Social Features
export interface UserConnection {
  id: string;
  connectedUserId: string;
  connectionType: 'friend' | 'trainer' | 'trainee' | 'blocked';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number; // 0-100
}

// Trainer-specific types
export interface TrainerProfile {
  certifications: Certification[];
  specializations: string[];
  experience: number; // years
  rating: number; // 1-5
  totalClients: number;
  hourlyRate?: number;
  bio: string;
  availability: TrainerAvailability[];
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
}

export interface TrainerAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  timezone: string;
}