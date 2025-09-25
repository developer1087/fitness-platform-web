// Auth types - using auth as primary source for User, AuthState, etc.
export * from './auth/types';
export * from './auth/schemas';

// User types - exclude conflicting types
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
} from './user/types';

// Workout types
export * from './workout/types';

// Nutrition types
export * from './nutrition/types';

// Progress types
export * from './progress/types';

// Social types
export * from './social/types';