import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  TrainerAvailabilitySlot,
  BookingSlot,
  RecurringBooking,
  CreateAvailabilityFormData,
  BookSlotFormData,
  ScheduleStatsData,
  DaySchedule,
  TimeSlot,
  CalendarViewSettings
} from '../shared-types/schedule';

// Collections
const AVAILABILITY_SLOTS_COLLECTION = 'availability_slots';
const BOOKING_SLOTS_COLLECTION = 'booking_slots';
const RECURRING_BOOKINGS_COLLECTION = 'recurring_bookings';
// const CALENDAR_EVENTS_COLLECTION = 'calendar_events';
// const SCHEDULE_TEMPLATES_COLLECTION = 'schedule_templates';
// const SCHEDULE_CONFLICTS_COLLECTION = 'schedule_conflicts';
const CALENDAR_SETTINGS_COLLECTION = 'calendar_settings';

export class ScheduleService {

  // ==================== AVAILABILITY MANAGEMENT ====================

  // Create trainer availability slot
  static async createAvailabilitySlot(
    trainerId: string,
    availabilityData: CreateAvailabilityFormData
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date().toISOString();

      // Build slot object, omitting undefined fields for Firestore compatibility
      const slot: Omit<TrainerAvailabilitySlot, 'id'> = {
        trainerId,
        dayOfWeek: availabilityData.dayOfWeek,
        startTime: availabilityData.startTime,
        endTime: availabilityData.endTime,
        isAvailable: true,
        sessionTypes: availabilityData.sessionTypes,
        recurrenceType: availabilityData.recurrenceType,
        exceptions: [],
        isRemote: availabilityData.isRemote || false,
        createdAt: now,
        updatedAt: now
      };

      // Add optional fields only if they're not undefined
      if (availabilityData.maxBookings !== undefined) {
        slot.maxBookings = availabilityData.maxBookings;
      }
      if (availabilityData.recurrenceEnd !== undefined) {
        slot.recurrenceEnd = availabilityData.recurrenceEnd;
      }
      if (availabilityData.notes !== undefined) {
        slot.notes = availabilityData.notes;
      }
      if (availabilityData.location !== undefined) {
        slot.location = availabilityData.location;
      }

      const slotRef = await addDoc(collection(db, AVAILABILITY_SLOTS_COLLECTION), slot);

      // Generate initial booking slots based on availability
      await this.generateBookingSlotsFromAvailability(slotRef.id, slot);

      return slotRef.id;
    } catch (error) {
      console.error('Error creating availability slot:', error);
      throw error;
    }
  }

  // Get trainer's availability slots
  static async getTrainerAvailability(trainerId: string): Promise<TrainerAvailabilitySlot[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const availabilityQuery = query(
        collection(db, AVAILABILITY_SLOTS_COLLECTION),
        where('trainerId', '==', trainerId),
        where('isAvailable', '==', true),
        orderBy('dayOfWeek', 'asc'),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(availabilityQuery);
      const slots: TrainerAvailabilitySlot[] = [];

      snapshot.forEach((doc) => {
        slots.push({ id: doc.id, ...doc.data() } as TrainerAvailabilitySlot);
      });

      return slots;
    } catch (error) {
      console.error('Error getting trainer availability:', error);
      throw error;
    }
  }

  // ==================== BOOKING MANAGEMENT ====================

  // Generate booking slots from availability
  static async generateBookingSlotsFromAvailability(
    availabilitySlotId: string,
    availability: Omit<TrainerAvailabilitySlot, 'id'>,
    weeksAhead: number = 8
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const batch = writeBatch(db);
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + (weeksAhead * 7));

      // Find next occurrence of the availability day
      const currentDate = new Date(now);
      while (currentDate.getDay() !== availability.dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate slots for each week
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Calculate duration based on start and end time
        const [startHour, startMinute] = availability.startTime.split(':').map(Number);
        const [endHour, endMinute] = availability.endTime.split(':').map(Number);
        const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

        // Build booking slot, omitting undefined fields for Firestore compatibility
        const bookingSlot: Omit<BookingSlot, 'id'> = {
          trainerId: availability.trainerId,
          date: dateStr,
          startTime: availability.startTime,
          endTime: availability.endTime,
          duration: durationMinutes,
          status: 'available',
          sessionType: availability.sessionTypes[0] || 'personal_training',
          isRecurring: false,
          currency: 'USD',
          isRemote: availability.isRemote || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Add optional location if defined
        if (availability.location !== undefined) {
          bookingSlot.location = availability.location;
        }

        const slotRef = doc(collection(db, BOOKING_SLOTS_COLLECTION));
        batch.set(slotRef, bookingSlot);

        // Move to next week (same day)
        currentDate.setDate(currentDate.getDate() + 7);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error generating booking slots:', error);
      throw error;
    }
  }

  // Book a time slot
  static async bookTimeSlot(
    trainerId: string,
    bookingData: BookSlotFormData
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date().toISOString();

      // Check if slot is available
      const conflictingSlots = await this.checkForConflicts(trainerId, bookingData.date, bookingData.startTime, bookingData.duration);
      if (conflictingSlots.length > 0) {
        throw new Error('Time slot conflicts with existing booking');
      }

      const [startHour, startMinute] = bookingData.startTime.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(startHour, startMinute + bookingData.duration);
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      const bookingSlot: Omit<BookingSlot, 'id'> = {
        trainerId,
        traineeId: bookingData.traineeId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: endTimeStr,
        duration: bookingData.duration,
        status: 'booked',
        sessionType: bookingData.sessionType,
        isRecurring: bookingData.isRecurring || false,
        bookingNotes: bookingData.notes,
        location: bookingData.location,
        isRemote: bookingData.isRemote,
        bookedAt: now,
        createdAt: now,
        updatedAt: now
      };

      const slotRef = await addDoc(collection(db, BOOKING_SLOTS_COLLECTION), bookingSlot);

      // If recurring, create recurring booking pattern
      if (bookingData.isRecurring && bookingData.recurringPattern) {
        await this.createRecurringBooking(trainerId, bookingData);
      }

      return slotRef.id;
    } catch (error) {
      console.error('Error booking time slot:', error);
      throw error;
    }
  }

  // Get booking slots for a trainer
  static async getTrainerBookings(
    trainerId: string,
    startDate: string,
    endDate: string
  ): Promise<BookingSlot[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const bookingsQuery = query(
        collection(db, BOOKING_SLOTS_COLLECTION),
        where('trainerId', '==', trainerId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(bookingsQuery);
      const bookings: BookingSlot[] = [];

      snapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() } as BookingSlot);
      });

      return bookings;
    } catch (error) {
      console.error('Error getting trainer bookings:', error);
      throw error;
    }
  }

  // ==================== CALENDAR MANAGEMENT ====================

  // Get day schedule with time slots
  static async getDaySchedule(trainerId: string, date: string): Promise<DaySchedule> {
    try {
      const bookings = await this.getTrainerBookings(trainerId, date, date);
      const availability = await this.getTrainerAvailability(trainerId);

      // Get day of week for the requested date
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      // Find availability for this day
      const dayAvailability = availability.filter(slot => slot.dayOfWeek === dayOfWeek);

      const timeSlots: TimeSlot[] = [];
      let totalAvailableSlots = 0;
      let totalBookedSlots = 0;
      let firstAvailableTime: string | undefined;
      let lastAvailableTime: string | undefined;

      // Generate time slots from availability
      for (const avail of dayAvailability) {
        const [startHour, startMinute] = avail.startTime.split(':').map(Number);
        const [endHour, endMinute] = avail.endTime.split(':').map(Number);

        // Create 30-minute slots (can be configurable)
        for (let hour = startHour; hour < endHour || (hour === endHour && startMinute < endMinute); hour++) {
          for (let minute = hour === startHour ? startMinute : 0; minute < 60; minute += 30) {
            if (hour === endHour && minute >= endMinute) break;

            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const endSlotMinute = minute + 30;
            const endSlotHour = endSlotMinute >= 60 ? hour + 1 : hour;
            const endSlotMinuteNormalized = endSlotMinute >= 60 ? endSlotMinute - 60 : endSlotMinute;
            const endTimeStr = `${endSlotHour.toString().padStart(2, '0')}:${endSlotMinuteNormalized.toString().padStart(2, '0')}`;

            // Check if this slot is booked
            const booking = bookings.find(b =>
              b.startTime <= timeStr && b.endTime > timeStr
            );

            const timeSlot: TimeSlot = {
              start: timeStr,
              end: endTimeStr,
              isAvailable: !booking,
              isBooked: !!booking,
              sessionType: booking?.sessionType,
              traineeId: booking?.traineeId,
              bookingId: booking?.id
            };

            timeSlots.push(timeSlot);

            if (timeSlot.isAvailable) {
              totalAvailableSlots++;
              if (!firstAvailableTime) firstAvailableTime = timeStr;
              lastAvailableTime = timeStr;
            } else {
              totalBookedSlots++;
            }
          }
        }
      }

      return {
        date,
        timeSlots,
        totalAvailableSlots,
        totalBookedSlots,
        firstAvailableTime,
        lastAvailableTime
      };
    } catch (error) {
      console.error('Error getting day schedule:', error);
      throw error;
    }
  }

  // ==================== RECURRING BOOKINGS ====================

  // Create recurring booking pattern
  static async createRecurringBooking(
    trainerId: string,
    bookingData: BookSlotFormData
  ): Promise<string> {
    try {
      if (!db || !bookingData.recurringPattern) {
        throw new Error('Firebase Firestore not initialized or no recurring pattern');
      }

      const now = new Date().toISOString();
      const recurring: Omit<RecurringBooking, 'id'> = {
        trainerId,
        traineeId: bookingData.traineeId,
        pattern: bookingData.recurringPattern.pattern,
        frequency: bookingData.recurringPattern.frequency,
        daysOfWeek: [new Date(bookingData.date).getDay()], // Convert date to day of week
        startTime: bookingData.startTime,
        endTime: '', // Will be calculated
        duration: bookingData.duration,
        startDate: bookingData.date,
        endDate: bookingData.recurringPattern.endDate,
        maxOccurrences: bookingData.recurringPattern.maxOccurrences,
        sessionType: bookingData.sessionType,
        title: `Recurring ${bookingData.sessionType}`,
        description: bookingData.notes,
        generatedSlots: [],
        nextGenerationDate: new Date().toISOString(),
        isActive: true,
        location: bookingData.location,
        isRemote: bookingData.isRemote,
        createdAt: now,
        updatedAt: now
      };

      // Calculate end time
      const [startHour, startMinute] = bookingData.startTime.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(startHour, startMinute + bookingData.duration);
      recurring.endTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      const recurringRef = await addDoc(collection(db, RECURRING_BOOKINGS_COLLECTION), recurring);
      return recurringRef.id;
    } catch (error) {
      console.error('Error creating recurring booking:', error);
      throw error;
    }
  }

  // ==================== CONFLICT DETECTION ====================

  // Check for scheduling conflicts
  static async checkForConflicts(
    trainerId: string,
    date: string,
    startTime: string,
    duration: number
  ): Promise<BookingSlot[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(startHour, startMinute + duration);
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      const conflictsQuery = query(
        collection(db, BOOKING_SLOTS_COLLECTION),
        where('trainerId', '==', trainerId),
        where('date', '==', date),
        where('status', '==', 'booked')
      );

      const snapshot = await getDocs(conflictsQuery);
      const conflicts: BookingSlot[] = [];

      snapshot.forEach((doc) => {
        const booking = { id: doc.id, ...doc.data() } as BookingSlot;

        // Check for time overlap
        if (
          (startTime >= booking.startTime && startTime < booking.endTime) ||
          (endTimeStr > booking.startTime && endTimeStr <= booking.endTime) ||
          (startTime <= booking.startTime && endTimeStr >= booking.endTime)
        ) {
          conflicts.push(booking);
        }
      });

      return conflicts;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  // Generate schedule statistics
  static async generateScheduleStats(
    trainerId: string,
    period: 'week' | 'month' | 'quarter'
  ): Promise<ScheduleStatsData> {
    try {
      const now = new Date();
      const startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      const bookings = await this.getTrainerBookings(
        trainerId,
        startDate.toISOString().split('T')[0],
        now.toISOString().split('T')[0]
      );

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'booked').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

      const bookedHours = bookings.reduce((total, booking) => total + (booking.duration / 60), 0);

      // Calculate available hours from availability slots
      const availability = await this.getTrainerAvailability(trainerId);
      const totalAvailableHours = availability.reduce((total, slot) => {
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        const hours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
        return total + hours;
      }, 0) * (period === 'week' ? 1 : period === 'month' ? 4 : 12); // Approximate weeks in period

      const utilizationRate = totalAvailableHours > 0 ? (bookedHours / totalAvailableHours) * 100 : 0;

      // Calculate revenue (assuming price is stored in bookings)
      const totalRevenue = bookings.reduce((total, booking) => total + (booking.price || 0), 0);
      const averageSessionValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      const stats: ScheduleStatsData = {
        trainerId,
        period,
        totalAvailableHours,
        bookedHours,
        availableHours: totalAvailableHours - bookedHours,
        utilizationRate,
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings: 0, // Would need to track this separately
        totalRevenue,
        averageSessionValue,
        peakBookingHours: [], // Would need more complex analysis
        popularDays: [], // Would need more complex analysis
        popularTimes: [], // Would need more complex analysis
        generatedAt: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      console.error('Error generating schedule stats:', error);
      throw error;
    }
  }

  // ==================== CALENDAR SETTINGS ====================

  // Get calendar view settings
  static async getCalendarSettings(trainerId: string): Promise<CalendarViewSettings | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, CALENDAR_SETTINGS_COLLECTION, trainerId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { trainerId, ...docSnap.data() } as CalendarViewSettings;
      }

      // Return default settings if none exist
      return {
        trainerId,
        defaultView: 'week',
        startHour: 6,
        endHour: 22,
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        showWeekends: true,
        showBlockedSlots: true,
        showAvailableSlots: true,
        timeSlotDuration: 30,
        colorScheme: {
          personal_training: '#3B82F6',
          group_training: '#10B981',
          assessment: '#F59E0B',
          consultation: '#8B5CF6'
        },
        timezone: 'America/New_York',
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting calendar settings:', error);
      throw error;
    }
  }

  // Update calendar settings
  static async updateCalendarSettings(
    trainerId: string,
    settings: Partial<CalendarViewSettings>
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, CALENDAR_SETTINGS_COLLECTION, trainerId);
      await updateDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating calendar settings:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  // Cancel a booking
  static async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, BOOKING_SLOTS_COLLECTION, bookingId);
      await updateDoc(docRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Get available time slots for a specific date
  static async getAvailableSlots(
    trainerId: string,
    date: string,
    sessionType?: string
  ): Promise<TimeSlot[]> {
    try {
      const daySchedule = await this.getDaySchedule(trainerId, date);
      let availableSlots = daySchedule.timeSlots.filter(slot => slot.isAvailable);

      // Filter by session type if specified
      if (sessionType) {
        const availability = await this.getTrainerAvailability(trainerId);
        const targetDay = new Date(date).getDay();
        const relevantAvailability = availability.filter(
          avail => avail.dayOfWeek === targetDay && avail.sessionTypes.includes(sessionType)
        );

        if (relevantAvailability.length > 0) {
          availableSlots = availableSlots.filter(slot => {
            return relevantAvailability.some(avail =>
              slot.start >= avail.startTime && slot.end <= avail.endTime
            );
          });
        }
      }

      return availableSlots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }
}