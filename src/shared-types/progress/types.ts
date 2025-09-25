// Progress Tracking and Analytics Types for Fitness Platform

export interface ProgressEntry {
  id: string;
  userId: string;
  date: Date;
  type: ProgressType;

  // Measurements
  measurements?: BodyMeasurements;
  weight?: WeightEntry;
  bodyComposition?: BodyComposition;
  performanceMetrics?: PerformanceMetrics;

  // Photos
  photos?: ProgressPhoto[];

  // Notes
  notes?: string;
  mood?: MoodRating;
  energy?: EnergyLevel;
  sleep?: SleepQuality;

  // Context
  tags?: string[];
  isPublic: boolean;
  milestone?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type ProgressType =
  | 'weight'
  | 'measurements'
  | 'body_composition'
  | 'performance'
  | 'photos'
  | 'general';

export interface BodyMeasurements {
  // Circumferences (cm)
  chest?: number;
  waist?: number;
  hips?: number;
  neck?: number;
  bicepLeft?: number;
  bicepRight?: number;
  forearmLeft?: number;
  forearmRight?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  shoulders?: number;

  // Custom measurements
  customMeasurements?: CustomMeasurement[];
}

export interface CustomMeasurement {
  name: string;
  value: number;
  unit: string;
  bodyPart?: string;
}

export interface WeightEntry {
  weight: number; // kg
  unit: 'kg' | 'lbs';
  method: WeightMeasurementMethod;
  timeOfDay: TimeOfDay;
  notes?: string;
}

export type WeightMeasurementMethod =
  | 'scale'
  | 'smart_scale'
  | 'gym_scale'
  | 'doctor_office'
  | 'estimate';

export type TimeOfDay =
  | 'morning_fasted'
  | 'morning_fed'
  | 'afternoon'
  | 'evening'
  | 'pre_workout'
  | 'post_workout';

export interface BodyComposition {
  bodyFatPercentage?: number;
  muscleMass?: number; // kg
  boneMass?: number;   // kg
  waterPercentage?: number;
  visceralFat?: number;
  metabolicAge?: number;
  bmr?: number; // Basal Metabolic Rate

  // Method used
  method: BodyCompositionMethod;
  deviceModel?: string;
}

export type BodyCompositionMethod =
  | 'bioelectrical_impedance'
  | 'dexa_scan'
  | 'bod_pod'
  | 'hydrostatic_weighing'
  | 'skin_fold_calipers'
  | 'visual_estimate';

export interface PerformanceMetrics {
  // Strength Metrics
  benchPress1RM?: number;
  squat1RM?: number;
  deadlift1RM?: number;
  overheadPress1RM?: number;

  // Cardio Metrics
  vo2Max?: number;
  restingHeartRate?: number;
  maxHeartRate?: number;
  runningSpeed5k?: number; // km/h
  runningSpeed10k?: number;
  cyclingFTP?: number; // Functional Threshold Power

  // Flexibility
  sitAndReach?: number; // cm
  shoulderFlexibility?: number;

  // Custom performance metrics
  customMetrics?: CustomPerformanceMetric[];
}

export interface CustomPerformanceMetric {
  name: string;
  value: number;
  unit: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'power' | 'endurance';
  exercise?: string;
}

export interface ProgressPhoto {
  id: string;
  url: string;
  angle: PhotoAngle;
  pose: PhotoPose;
  lighting?: LightingCondition;
  clothing?: ClothingType;

  // Metadata
  uploadedAt: Date;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };

  // Comparison
  isBaseline?: boolean;
  comparisonGroup?: string;
}

export type PhotoAngle =
  | 'front'
  | 'back'
  | 'side_left'
  | 'side_right'
  | 'three_quarter_front'
  | 'three_quarter_back';

export type PhotoPose =
  | 'relaxed'
  | 'flexed'
  | 'most_muscular'
  | 'front_double_bicep'
  | 'rear_double_bicep'
  | 'side_chest'
  | 'abs_and_thigh';

export type LightingCondition =
  | 'natural'
  | 'artificial'
  | 'mixed'
  | 'poor'
  | 'good';

export type ClothingType =
  | 'minimal'
  | 'workout_clothes'
  | 'casual'
  | 'same_as_baseline';

export type MoodRating = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type SleepQuality = 1 | 2 | 3 | 4 | 5;

// Goal Tracking
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  type: GoalType;

  // Target
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate?: Date;

  // Progress
  startValue: number;
  startDate: Date;
  progressPercentage: number;
  isAchieved: boolean;
  achievedDate?: Date;

  // Tracking
  milestones: GoalMilestone[];
  progressEntries: GoalProgressEntry[];

  // Motivation
  priority: 'low' | 'medium' | 'high';
  reward?: string;
  publicCommitment: boolean;

  // Status
  status: GoalStatus;

  createdAt: Date;
  updatedAt: Date;
}

export type GoalCategory =
  | 'weight'
  | 'strength'
  | 'endurance'
  | 'body_composition'
  | 'flexibility'
  | 'habit'
  | 'nutrition'
  | 'performance';

export type GoalType =
  | 'increase'
  | 'decrease'
  | 'maintain'
  | 'achieve';

export type GoalStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned'
  | 'overdue';

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  targetDate?: Date;
  achieved: boolean;
  achievedDate?: Date;
  reward?: string;
}

export interface GoalProgressEntry {
  id: string;
  date: Date;
  value: number;
  notes?: string;
  photoId?: string;
}

// Analytics and Insights
export interface UserAnalytics {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  period: AnalyticsPeriod;

  // Workout Analytics
  workoutAnalytics: WorkoutAnalytics;

  // Nutrition Analytics
  nutritionAnalytics: NutritionAnalytics;

  // Progress Analytics
  progressAnalytics: ProgressAnalytics;

  // Behavioral Analytics
  behaviorAnalytics: BehaviorAnalytics;

  // Health Analytics
  healthAnalytics: HealthAnalytics;

  lastUpdated: Date;
}

export type AnalyticsPeriod =
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'all_time';

export interface WorkoutAnalytics {
  // Volume and Frequency
  totalWorkouts: number;
  totalWorkoutTime: number; // minutes
  averageWorkoutDuration: number;
  workoutsPerWeek: number;

  // Consistency
  currentStreak: number; // days
  longestStreak: number;
  consistencyScore: number; // 0-100

  // Performance
  totalVolumeLifted: number; // kg
  averageIntensity: number; // RPE or %1RM
  personalRecords: number;

  // Preferences
  favoriteWorkoutType: string;
  favoriteExercises: ExerciseStat[];
  peakWorkoutTime: string; // HH:MM

  // Progress
  strengthProgress: StrengthProgress;
  enduranceProgress: EnduranceProgress;
}

export interface ExerciseStat {
  exerciseName: string;
  timesPerformed: number;
  totalVolume: number;
  averageIntensity: number;
  lastPerformed: Date;
}

export interface StrengthProgress {
  overallGain: number; // percentage
  topProgressingExercises: ExerciseProgress[];
  plateauedExercises: string[];
}

export interface ExerciseProgress {
  exerciseName: string;
  startingMax: number;
  currentMax: number;
  progressPercentage: number;
}

export interface EnduranceProgress {
  vo2MaxImprovement: number;
  runningSpeedImprovement: number;
  heartRateRecovery: number;
}

export interface NutritionAnalytics {
  // Adherence
  calorieGoalAdherence: number; // percentage
  macroGoalAdherence: MacroAdherence;
  trackingConsistency: number; // days tracked / total days

  // Patterns
  averageDailyCalories: number;
  averageMacroDistribution: MacroDistribution;
  mealTimingPatterns: MealTimingPattern[];

  // Quality
  dietQualityScore: number; // 0-100
  processedFoodPercentage: number;
  micronutrientCoverage: MicronutrientCoverage;

  // Habits
  mostLoggedFoods: FoodStat[];
  hydrationAverage: number; // ml per day
}

export interface MacroAdherence {
  protein: number; // percentage
  carbs: number;
  fat: number;
}

export interface MealTimingPattern {
  meal: string;
  averageTime: string; // HH:MM
  consistency: number; // 0-100
}

export interface MicronutrientCoverage {
  [nutrient: string]: number; // percentage of RDA
}

export interface FoodStat {
  foodName: string;
  timesLogged: number;
  totalCalories: number;
  lastLogged: Date;
}

export interface ProgressAnalytics {
  // Body Composition
  weightChange: number; // kg
  bodyFatChange: number; // percentage points
  muscleMassChange: number; // kg

  // Measurements
  measurementChanges: MeasurementChange[];

  // Goals
  activeGoals: number;
  completedGoals: number;
  goalCompletionRate: number; // percentage

  // Trends
  weightTrend: TrendDirection;
  measurementTrends: { [measurement: string]: TrendDirection };
}

export interface MeasurementChange {
  measurement: string;
  startValue: number;
  currentValue: number;
  change: number;
  changePercentage: number;
}

export type TrendDirection =
  | 'increasing'
  | 'decreasing'
  | 'stable'
  | 'fluctuating';

export interface BehaviorAnalytics {
  // Usage Patterns
  appUsageMinutesPerDay: number;
  mostActiveTimeOfDay: string;
  mostActiveDayOfWeek: string;

  // Feature Usage
  featureUsage: FeatureUsage[];

  // Consistency
  loginStreak: number;
  dataEntryConsistency: number; // percentage

  // Engagement
  socialInteractions: number;
  commentsLeft: number;
  workoutsShared: number;
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  lastUsed: Date;
  timeSpent: number; // minutes
}

export interface HealthAnalytics {
  // Vital Signs
  averageRestingHeartRate: number;
  heartRateVariability: number;
  sleepQualityAverage: number;

  // Recovery
  recoveryScore: number; // 0-100
  overtrainingRisk: 'low' | 'medium' | 'high';

  // Correlations
  correlations: HealthCorrelation[];
}

export interface HealthCorrelation {
  factor1: string;
  factor2: string;
  correlation: number; // -1 to 1
  significance: 'low' | 'medium' | 'high';
}

// Achievements and Badges
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Criteria
  criteria: AchievementCriteria;

  // Rewards
  points: number;
  badge: string; // URL or identifier

  // Meta
  rarity: number; // percentage of users who have it
  isHidden: boolean; // surprise achievements

  createdAt: Date;
}

export type AchievementCategory =
  | 'consistency'
  | 'milestones'
  | 'strength'
  | 'endurance'
  | 'social'
  | 'nutrition'
  | 'special';

export interface AchievementCriteria {
  type: 'single' | 'cumulative' | 'streak';
  metric: string;
  target: number;
  timeframe?: number; // days
  conditions?: CriteriaCondition[];
}

export interface CriteriaCondition {
  field: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number | string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;

  // Progress
  progress: number; // 0-100
  isCompleted: boolean;
  completedAt?: Date;

  // Context
  progressHistory: AchievementProgress[];
  currentValue: number;

  isNotified: boolean;
}

export interface AchievementProgress {
  date: Date;
  value: number;
  context?: string;
}

// Import types from other modules
import type { MacroDistribution } from '../nutrition/types';