// Workout and Exercise Types for Fitness Platform

export interface Workout {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: WorkoutType;

  // Scheduling
  scheduledDate?: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // minutes

  // Status
  status: WorkoutStatus;

  // Content
  exercises: WorkoutExercise[];

  // Metrics
  totalSets?: number;
  totalReps?: number;
  totalWeight?: number; // kg
  estimatedCaloriesBurned?: number;
  actualCaloriesBurned?: number;

  // Social
  isPublic: boolean;
  likes?: number;
  comments?: WorkoutComment[];

  // Template
  isTemplate: boolean;
  templateId?: string; // Reference to template if created from one

  // Tracking
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type WorkoutStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'cancelled';

export interface WorkoutExercise {
  id: string;
  exerciseId: string; // Reference to Exercise
  exercise: Exercise; // Populated exercise data
  order: number; // Order in workout

  // Sets and Performance
  sets: ExerciseSet[];
  restTime?: number; // seconds between sets
  notes?: string;

  // Performance Tracking
  personalRecord?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard' | 'max_effort';

  // Modifications
  modifications?: string[];
  substitution?: boolean;
  substitutionReason?: string;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  type: SetType;

  // Performance Data
  reps?: number;
  weight?: number; // kg
  distance?: number; // meters
  duration?: number; // seconds
  calories?: number;

  // Cardio-specific
  speed?: number; // km/h or m/s
  incline?: number; // percentage
  resistance?: number; // level

  // RPE and Notes
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  notes?: string;

  // Timestamps
  startTime?: Date;
  endTime?: Date;
}

export type SetType =
  | 'normal'
  | 'warmup'
  | 'working'
  | 'drop'
  | 'super'
  | 'giant'
  | 'rest_pause'
  | 'cluster'
  | 'amrap'     // As Many Reps As Possible
  | 'emom'      // Every Minute On the Minute
  | 'tabata'
  | 'failure';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;

  // Muscle Groups
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];

  // Equipment and Setup
  equipment: EquipmentType[];
  difficulty: ExerciseDifficulty;

  // Instructions
  instructions: string[];
  setupInstructions?: string[];
  safetyTips?: string[];
  commonMistakes?: string[];

  // Media
  images?: string[]; // URLs
  videos?: ExerciseVideo[];

  // Metrics
  defaultSets?: number;
  defaultReps?: string; // e.g., "8-12", "max", "30 seconds"

  // Tags and Variations
  tags: string[];
  variations?: ExerciseVariation[];
  alternatives?: string[]; // Exercise IDs

  // Tracking
  isApproved: boolean;
  createdBy?: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'full_body'
  | 'cardio'
  | 'flexibility'
  | 'balance'
  | 'functional'
  | 'olympic_lifts'
  | 'powerlifting'
  | 'plyometric'
  | 'isometric'
  | 'rehabilitation';

export type MuscleGroup =
  | 'chest'
  | 'upper_chest'
  | 'lower_chest'
  | 'back'
  | 'lats'
  | 'rhomboids'
  | 'middle_traps'
  | 'lower_traps'
  | 'rear_delts'
  | 'shoulders'
  | 'front_delts'
  | 'side_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'tibialis'
  | 'core'
  | 'abs'
  | 'obliques'
  | 'lower_back'
  | 'hip_flexors'
  | 'adductors'
  | 'abductors';

export type ExerciseDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export interface ExerciseVideo {
  url: string;
  type: 'demonstration' | 'tutorial' | 'form_tips';
  duration?: number; // seconds
  thumbnail?: string;
}

export interface ExerciseVariation {
  name: string;
  description: string;
  difficulty: ExerciseDifficulty;
  modifications: string[];
}

// Workout Programs and Templates
export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  category: ProgramCategory;

  // Program Structure
  duration: number; // weeks
  workoutsPerWeek: number;
  workoutTemplates: WorkoutTemplate[];

  // Target Audience
  targetLevel: FitnessLevel[];
  targetGoals: FitnessGoalType[];
  requiredEquipment: EquipmentType[];

  // Creator Info
  createdBy: string; // User ID
  isOfficial: boolean; // Created by platform
  rating: number;
  totalUsers: number;

  // Media
  coverImage?: string;
  previewImages?: string[];

  // Tracking
  createdAt: Date;
  updatedAt: Date;
}

export type ProgramCategory =
  | 'strength'
  | 'muscle_building'
  | 'fat_loss'
  | 'endurance'
  | 'powerlifting'
  | 'bodybuilding'
  | 'crossfit'
  | 'calisthenics'
  | 'rehabilitation'
  | 'beginner'
  | 'sport_specific';

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  type: WorkoutType;
  week: number; // Which week in program
  day: number;   // Which day in week

  // Template Structure
  exercises: TemplateExercise[];
  estimatedDuration: number; // minutes
  difficulty: ExerciseDifficulty;

  // Usage
  timesUsed: number;
  averageRating: number;

  // Tracking
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateExercise {
  exerciseId: string;
  order: number;
  sets: number;
  reps: string; // e.g., "8-12", "max", "30 seconds"
  weight?: string; // e.g., "bodyweight", "60-70% 1RM"
  restTime?: number; // seconds
  notes?: string;
}

// Progress Tracking
export interface WorkoutProgress {
  userId: string;
  exerciseId: string;

  // Personal Records
  maxWeight?: number;
  maxReps?: number;
  maxDistance?: number;
  bestTime?: number;

  // Volume Tracking
  totalVolume: number; // weight * reps * sets
  averageIntensity: number; // percentage

  // Frequency
  lastPerformed: Date;
  timesPerformed: number;

  // Progression
  progressHistory: WorkoutProgressEntry[];

  // Analysis
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface WorkoutProgressEntry {
  date: Date;
  workout: string; // Workout ID
  sets: ExerciseSet[];
  volume: number;
  notes?: string;
}

// Social Features
export interface WorkoutComment {
  id: string;
  userId: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date;
  likes: number;
  replies?: WorkoutComment[];
}

export interface WorkoutLike {
  userId: string;
  workoutId: string;
  createdAt: Date;
}

// Workout Sessions (Live tracking)
export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId: string;

  // Session State
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  currentExerciseIndex: number;
  currentSetIndex: number;

  // Timing
  startTime: Date;
  endTime?: Date;
  pausedTime: number; // total paused seconds

  // Real-time Data
  completedSets: ExerciseSet[];
  heartRateData?: HeartRateReading[];
  caloriesBurned: number;

  // Notes
  sessionNotes?: string;
  mood?: 'terrible' | 'bad' | 'okay' | 'good' | 'excellent';
  energy?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
}

export interface HeartRateReading {
  timestamp: Date;
  heartRate: number; // BPM
  zone?: 'rest' | 'fat_burn' | 'cardio' | 'peak';
}

// Import types from user module
import type {
  WorkoutType,
  FitnessLevel,
  FitnessGoalType,
  EquipmentType
} from '../user/types';