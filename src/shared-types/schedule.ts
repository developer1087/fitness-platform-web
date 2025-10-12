// Schedule and Calendar Management Types
// Handles trainer availability, booking slots, and calendar scheduling

export interface TrainerAvailabilitySlot {
  id: string;
  trainerId: string;

  // Time slot details
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:MM format (24-hour)
  endTime: string; // HH:MM format (24-hour)

  // Availability settings
  isAvailable: boolean;
  maxBookings?: number; // For group sessions
  sessionTypes: string[]; // Which session types allowed in this slot

  // Recurring availability
  recurrenceType: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  recurrenceEnd?: string; // ISO date when recurring availability ends

  // Exceptions
  exceptions: AvailabilityException[];

  // Metadata
  notes?: string;
  location?: string;
  isRemote?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityException {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  type: 'unavailable' | 'available' | 'modified';

  // For modified slots
  modifiedStartTime?: string;
  modifiedEndTime?: string;
  reason?: string;

  createdAt: string;
}

export interface BookingSlot {
  id: string;
  trainerId: string;
  traineeId?: string; // null if available, trainee ID if booked

  // Slot timing
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // minutes

  // Booking details
  status: 'available' | 'booked' | 'blocked' | 'cancelled' | 'completed';
  sessionType: string;
  sessionId?: string; // Reference to TrainingSession if booked

  // Booking metadata
  bookingNotes?: string;
  cancellationReason?: string;
  isRecurring: boolean;
  recurringGroupId?: string; // Groups recurring bookings together

  // Pricing
  price?: number;
  currency?: string;

  // Location
  location?: string;
  isRemote: boolean;

  // Timestamps
  bookedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringBooking {
  id: string;
  trainerId: string;
  traineeId: string;

  // Recurrence pattern
  pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  frequency: number; // Every N periods (e.g., every 2 weeks)
  daysOfWeek: number[]; // For weekly/biweekly patterns

  // Timing
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // minutes

  // Recurrence bounds
  startDate: string; // ISO date
  endDate?: string; // ISO date - null for indefinite
  maxOccurrences?: number; // Alternative to end date

  // Session details
  sessionType: string;
  title: string;
  description?: string;

  // Generated bookings
  generatedSlots: string[]; // BookingSlot IDs created from this pattern
  nextGenerationDate: string; // When to generate next batch of slots

  // Status
  isActive: boolean;
  pausedUntil?: string; // Temporarily pause until this date

  // Metadata
  notes?: string;
  location?: string;
  isRemote: boolean;
  price?: number;

  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  trainerId: string;

  // Event details
  title: string;
  description?: string;
  type: 'session' | 'availability' | 'break' | 'personal' | 'training' | 'admin';

  // Timing
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  isAllDay: boolean;
  timezone?: string;

  // Related entities
  sessionId?: string; // If type is 'session'
  traineeId?: string; // If related to specific trainee
  bookingSlotId?: string; // If related to booking slot

  // Event properties
  color?: string; // For calendar display
  isRecurring: boolean;
  recurringEventId?: string; // Groups recurring events

  // Status
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';

  // Notifications
  reminders: EventReminder[];

  // Location
  location?: string;
  isRemote: boolean;
  meetingLink?: string;

  createdAt: string;
  updatedAt: string;
}

export interface EventReminder {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  minutesBefore: number; // How many minutes before event
  message?: string; // Custom reminder message
  isSent: boolean;
  sentAt?: string;

  // Recipients
  sendToTrainer: boolean;
  sendToTrainee: boolean;
}

export interface ScheduleTemplate {
  id: string;
  trainerId: string;

  // Template details
  name: string;
  description?: string;
  category: 'weekly' | 'monthly' | 'seasonal' | 'custom';

  // Template structure
  availabilitySlots: Omit<TrainerAvailabilitySlot, 'id' | 'trainerId' | 'createdAt' | 'updatedAt'>[];
  defaultSessionTypes: string[];
  defaultDuration: number; // minutes

  // Pricing defaults
  defaultPrice?: number;
  currency?: string;

  // Auto-apply settings
  isActive: boolean;
  autoApplyFromDate?: string; // Auto-apply this template from this date
  autoApplyToDate?: string; // Stop auto-applying after this date

  // Usage tracking
  timesUsed: number;
  lastUsed?: string;

  createdAt: string;
  updatedAt: string;
}

// Calendar view configurations
export interface CalendarViewSettings {
  trainerId: string;

  // View preferences
  defaultView: 'day' | 'week' | 'month' | 'agenda';
  startHour: number; // 0-23
  endHour: number; // 0-23
  workingDays: number[]; // Days to show as working days

  // Display settings
  showWeekends: boolean;
  showBlockedSlots: boolean;
  showAvailableSlots: boolean;
  timeSlotDuration: 15 | 30 | 60; // minutes

  // Color coding
  colorScheme: {
    [sessionType: string]: string; // Hex colors for different session types
  };

  // Timezone
  timezone: string;

  updatedAt: string;
}

// Booking and scheduling forms
export interface CreateAvailabilityFormData {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  sessionTypes: string[];
  maxBookings?: number;
  recurrenceType: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  recurrenceEnd?: string;
  location?: string;
  isRemote?: boolean;
  notes?: string;
}

export interface BookSlotFormData {
  traineeId: string;
  sessionType: string;
  date: string;
  startTime: string;
  duration: number;
  location?: string;
  isRemote: boolean;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: {
    pattern: 'weekly' | 'biweekly' | 'monthly';
    frequency: number;
    endDate?: string;
    maxOccurrences?: number;
  };
}

export interface ScheduleStatsData {
  trainerId: string;
  period: 'week' | 'month' | 'quarter';

  // Availability metrics
  totalAvailableHours: number;
  bookedHours: number;
  availableHours: number;
  utilizationRate: number; // percentage

  // Booking metrics
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;

  // Revenue metrics
  totalRevenue: number;
  averageSessionValue: number;
  peakBookingHours: { hour: number; count: number }[];

  // Popular time slots
  popularDays: { day: number; bookings: number }[];
  popularTimes: { hour: number; bookings: number }[];

  generatedAt: string;
}

// Conflict detection and resolution
export interface ScheduleConflict {
  id: string;
  type: 'double_booking' | 'availability_gap' | 'travel_time' | 'break_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Affected entities
  affectedSlots: string[]; // BookingSlot IDs
  affectedSessions: string[]; // TrainingSession IDs

  // Conflict details
  conflictDate: string;
  conflictTime: string;
  description: string;
  suggestedResolution?: string;

  // Resolution status
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;

  detectedAt: string;
}

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
  isAvailable: boolean;
  isBooked: boolean;
  sessionType?: string;
  traineeId?: string;
  bookingId?: string;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  timeSlots: TimeSlot[];
  totalAvailableSlots: number;
  totalBookedSlots: number;
  firstAvailableTime?: string;
  lastAvailableTime?: string;
}