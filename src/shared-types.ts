// Local shared-types for deployment compatibility
export * from './shared-types/auth/types';
export * from './shared-types/auth/schemas';

// Explicit re-exports to ensure Vercel build picks them up
export { resetPasswordSchema, type ResetPasswordFormData } from './shared-types/auth/schemas';
export * from './shared-types/workout/types';
export * from './shared-types/nutrition/types';
export * from './shared-types/progress/types';
export * from './shared-types/social/types';

// User types - exclude conflicting types and use explicit exports
export type {
  UserProfile as DetailedUserProfile,
  PhysicalMeasurement,
  FitnessLevel,
  ActivityLevel,
  FitnessGoal,
  FitnessGoalType,
  GoalTarget,
  WorkoutPreferences,
  WorkoutType,
  DurationPreference,
  FrequencyPreference,
  TimeSlot,
  EquipmentType,
  WorkoutLocation,
  Injury,
  UserPreferences as DetailedUserPreferences,
  PrivacySettings,
  User as DetailedUser,
  UserRole as DetailedUserRole,
  AccountStatus,
  SubscriptionTier,
  UserAnalytics,
  UserConnection,
  UserAchievement,
  TrainerProfile,
  Certification,
  TrainerAvailability
} from './shared-types/user/types';