// Trainer-specific session management types
// Extends the existing workout types for trainer-client session management

import type { Workout, WorkoutExercise, Exercise, ExerciseSet } from './workout/types';

// Training Session - represents a scheduled session between trainer and trainee
export interface TrainingSession {
  id: string;
  trainerId: string;
  traineeId: string;

  // Session Details
  title: string;
  description?: string;
  type: SessionType;
  status: SessionStatus;

  // Scheduling
  scheduledDate: string; // ISO string
  startTime: string; // ISO string
  endTime?: string; // ISO string
  duration: number; // minutes
  location?: string;

  // Workout Data
  workoutId?: string; // Reference to Workout if pre-planned
  workout?: Workout; // Populated workout data
  exercises: SessionExercise[]; // Exercises specific to this session

  // Session Results
  actualStartTime?: string;
  actualEndTime?: string;
  completedExercises: number;
  totalExercises: number;

  // Notes and Feedback
  trainerNotes?: string; // Pre-session notes from trainer
  sessionNotes?: string; // During/post-session notes
  traineeNotes?: string; // Feedback from trainee

  // Performance Tracking
  traineePerformance?: TraineePerformance;
  personalRecords: PersonalRecord[];

  // Billing
  sessionRate?: number;
  isPaid: boolean;
  paymentId?: string;

  // Tracking
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type SessionType =
  | 'personal_training'
  | 'group_training'
  | 'assessment'
  | 'consultation'
  | 'follow_up'
  | 'rehabilitation'
  | 'nutrition_coaching'
  | 'form_check'
  | 'virtual_session';

export type SessionStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

// Session-specific exercise data
export interface SessionExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise; // Populated exercise data
  order: number;

  // Planned vs Actual
  plannedSets: SessionSet[];
  actualSets: SessionSet[];

  // Session-specific modifications
  modifications?: string[];
  substituted?: boolean;
  substitutionReason?: string;
  skipped?: boolean;
  skipReason?: string;

  // Trainer coaching
  coachingCues: string[];
  formFeedback?: string;
  difficulty?: 'too_easy' | 'appropriate' | 'too_hard';

  // Timing
  startTime?: string;
  endTime?: string;
  restTime?: number; // seconds between sets
}

// Session-specific set data
export interface SessionSet {
  id: string;
  setNumber: number;
  type: 'warmup' | 'working' | 'drop' | 'amrap' | 'failure';

  // Planned targets
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number; // seconds
  targetDistance?: number; // meters

  // Actual performance
  actualReps?: number;
  actualWeight?: number;
  actualDuration?: number;
  actualDistance?: number;

  // Session context
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  trainerRating?: number; // Trainer's assessment (1-10)

  // Notes
  notes?: string;
  formNotes?: string;

  // Timestamps
  startTime?: string;
  endTime?: string;
}

// Trainee performance assessment
export interface TraineePerformance {
  sessionId: string;

  // Overall assessment
  overallRating: number; // 1-10
  effort: number; // 1-10
  formQuality: number; // 1-10
  energy: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  mood: 'poor' | 'fair' | 'good' | 'great' | 'excellent';

  // Physical indicators
  fatigueLevel: number; // 1-10
  painLevel?: number; // 1-10
  injuryRisk?: 'none' | 'low' | 'moderate' | 'high';

  // Progress indicators
  strengthImprovement: 'declined' | 'maintained' | 'slight' | 'good' | 'excellent';
  techniqueImprovement: 'declined' | 'maintained' | 'slight' | 'good' | 'excellent';
  cardioImprovement: 'declined' | 'maintained' | 'slight' | 'good' | 'excellent';

  // Goals and motivation
  goalProgress: number; // 1-10
  motivation: number; // 1-10
  confidence: number; // 1-10;

  // Next session planning
  recommendations: string[];
  nextSessionFocus: string[];
  adjustmentsNeeded: string[];
}

// Personal records achieved in session
export interface PersonalRecord {
  id: string;
  sessionId: string;
  traineeId: string;
  exerciseId: string;

  recordType: 'max_weight' | 'max_reps' | 'best_time' | 'max_distance' | 'total_volume';
  value: number;
  unit: string; // kg, lbs, seconds, meters, etc.

  // Previous record
  previousValue?: number;
  improvement: number; // percentage or absolute

  // Context
  notes?: string;
  verified: boolean; // confirmed by trainer

  createdAt: string;
}

// Session templates for common workout types
export interface SessionTemplate {
  id: string;
  trainerId: string;

  name: string;
  description?: string;
  type: SessionType;
  category: 'strength' | 'cardio' | 'flexibility' | 'functional' | 'sport_specific' | 'rehabilitation';

  // Template structure
  estimatedDuration: number; // minutes
  exercises: SessionTemplateExercise[];

  // Target audience
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];

  // Usage tracking
  timesUsed: number;
  lastUsed?: string;

  // Template metadata
  isPublic: boolean;
  tags: string[];

  createdAt: string;
  updatedAt: string;
}

export interface SessionTemplateExercise {
  exerciseId: string;
  order: number;
  sets: number;
  reps: string; // e.g., "8-12", "max", "30 seconds"
  weight?: string; // e.g., "bodyweight", "previous + 5kg"
  restTime?: number; // seconds
  notes?: string;
  coachingCues?: string[];
}

// Session statistics for trainers
export interface SessionStats {
  trainerId: string;
  period: 'week' | 'month' | 'quarter' | 'year';

  // Volume metrics
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;

  // Performance metrics
  averageSessionDuration: number; // minutes
  averageSessionRating: number; // 1-10
  personalRecordsSet: number;

  // Client progress
  clientRetentionRate: number; // percentage
  averageClientProgress: number; // 1-10
  newClients: number;

  // Revenue (if tracked)
  totalRevenue?: number;
  averageSessionRate?: number;

  // Time breakdown
  strengthSessions: number;
  cardioSessions: number;
  assessmentSessions: number;
  otherSessions: number;

  generatedAt: string;
}

// Forms for creating/editing sessions
export interface CreateSessionFormData {
  traineeId: string;
  title: string;
  description?: string;
  type: SessionType;
  scheduledDate: string;
  startTime: string;
  duration: number;
  location?: string;
  templateId?: string; // Use existing template
  sessionRate?: number;
  trainerNotes?: string;
}

export interface SessionLogFormData {
  exercises: {
    exerciseId: string;
    sets: {
      reps?: number;
      weight?: number;
      duration?: number;
      rpe?: number;
      notes?: string;
    }[];
    modifications?: string[];
    formFeedback?: string;
  }[];

  sessionNotes?: string;
  traineePerformance?: Partial<TraineePerformance>;
  personalRecords?: Omit<PersonalRecord, 'id' | 'sessionId' | 'traineeId' | 'createdAt'>[];
}