import { z } from 'zod';

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// Signup schema
export const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reset password schema
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

// Trainee invitation schema
export const traineeInvitationSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  goals: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Trainee invitation record
export const traineeInvitationRecordSchema = z.object({
  id: z.string(),
  trainerId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  goals: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'expired']),
  inviteToken: z.string(),
  invitedAt: z.string(), // ISO string
  acceptedAt: z.string().optional(), // ISO string
  expiresAt: z.string(), // ISO string
});

// Enhanced trainee schema with more fields
export const traineeSchema = z.object({
  id: z.string(),
  userId: z.string().optional(), // Links to user profile when they sign up
  trainerId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
  joinDate: z.string(), // ISO string
  status: z.enum(['pending', 'active', 'inactive', 'trial']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()),
  notes: z.string().optional(),
  lastSession: z.string().optional(), // ISO string
  totalSessions: z.number().min(0),
  invitationId: z.string().optional(), // Links back to invitation record
});

// Infer types from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type TraineeInvitationFormData = z.infer<typeof traineeInvitationSchema>;
export type TraineeInvitationRecord = z.infer<typeof traineeInvitationRecordSchema>;
export type Trainee = z.infer<typeof traineeSchema>;