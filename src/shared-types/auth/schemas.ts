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

// Phone number validation (Israeli format: 05X-XXX-XXXX or 05XXXXXXXX)
export const phoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^05\d{8}$/,
    'Phone number must be in format 05XXXXXXXX (10 digits starting with 05)'
  );

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
  phoneNumber: phoneNumberSchema, // Primary method
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional(), // Fallback method
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  goals: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Trainee invitation record
export const traineeInvitationRecordSchema = z.object({
  id: z.string(),
  trainerId: z.string(),
  phoneNumber: z.string(), // Primary contact
  email: z.string().email().optional(), // Fallback contact
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
  phoneNumber: z.string(), // Primary identifier
  email: z.string().email().optional(), // Fallback
  profilePicture: z.string().optional(),
  joinDate: z.string(), // ISO string
  status: z.enum(['pending', 'active', 'inactive', 'trial']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()),
  notes: z.string().optional(),
  lastSession: z.string().optional(), // ISO string
  totalSessions: z.number().min(0),
  invitationId: z.string().optional(), // Links back to invitation record
  authMethod: z.enum(['phone', 'email', 'google']).default('phone'), // Track how they authenticated
});

// Phone auth login schema
export const phoneLoginSchema = z.object({
  phoneNumber: phoneNumberSchema,
  verificationCode: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

// Phone auth signup schema
export const phoneSignupSchema = z.object({
  phoneNumber: phoneNumberSchema,
  verificationCode: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
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
});

// Infer types from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;
export type PhoneSignupFormData = z.infer<typeof phoneSignupSchema>;
export type TraineeInvitationFormData = z.infer<typeof traineeInvitationSchema>;
export type TraineeInvitationRecord = z.infer<typeof traineeInvitationRecordSchema>;
export type Trainee = z.infer<typeof traineeSchema>;