import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  // startAfter,
  // Timestamp,
  // serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { ScheduleService } from './scheduleService';
import type {
  TrainingSession,
  CreateSessionFormData,
  SessionLogFormData,
  SessionTemplate,
  SessionStats,
  PersonalRecord,
  // TraineePerformance
} from '../shared-types/trainer-sessions';

// Collections
const SESSIONS_COLLECTION = 'sessions';  // Changed from 'training_sessions' to match mobile app
const SESSION_TEMPLATES_COLLECTION = 'session_templates';
const PERSONAL_RECORDS_COLLECTION = 'personal_records';
// const SESSION_STATS_COLLECTION = 'session_stats';

export class SessionService {

  // ==================== SESSION MANAGEMENT ====================

  // Create a new training session
  static async createSession(
    trainerId: string,
    sessionData: CreateSessionFormData
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      // VALIDATION: Check for scheduling conflicts
      const conflicts = await ScheduleService.checkForConflicts(
        trainerId,
        sessionData.scheduledDate,
        sessionData.startTime,
        sessionData.duration
      );

      if (conflicts.length > 0) {
        throw new Error(
          `Time slot conflicts with existing booking at ${conflicts[0].startTime}. Please choose a different time.`
        );
      }

      // VALIDATION: Check if time slot falls within trainer's availability
      const availableSlots = await ScheduleService.getAvailableSlots(
        trainerId,
        sessionData.scheduledDate,
        sessionData.type
      );

      const sessionEndTime = this.calculateEndTime(sessionData.startTime, sessionData.duration);

      // Check if the entire session duration fits within available slots
      // Session must start within an available slot AND end within available slots
      const hasStartSlot = availableSlots.some(slot =>
        sessionData.startTime >= slot.start && sessionData.startTime < slot.end
      );

      const hasEndSlot = availableSlots.some(slot =>
        sessionEndTime > slot.start && sessionEndTime <= slot.end
      );

      // Also check if all intermediate time is covered by availability
      const isFullyCovered = this.isTimeRangeCovered(
        sessionData.startTime,
        sessionEndTime,
        availableSlots
      );

      if (!hasStartSlot || !hasEndSlot || !isFullyCovered) {
        throw new Error(
          `Selected time (${sessionData.startTime}) is not within your available hours. Please set your availability first or choose a different time.`
        );
      }

      const now = new Date().toISOString();
      const session: Omit<TrainingSession, 'id'> = {
        trainerId,
        traineeId: sessionData.traineeId,
        title: sessionData.title,
        description: sessionData.description,
        type: sessionData.type,
        status: 'scheduled',
        scheduledDate: sessionData.scheduledDate,
        startTime: sessionData.startTime,
        duration: sessionData.duration,
        location: sessionData.location,
        exercises: [], // Will be populated later
        completedExercises: 0,
        totalExercises: 0,
        trainerNotes: sessionData.trainerNotes,
        personalRecords: [],
        isPaid: false,
        sessionRate: sessionData.sessionRate,
        createdAt: now,
        updatedAt: now
      };

      // If using a template, populate exercises
      if (sessionData.templateId) {
        const template = await this.getSessionTemplate(sessionData.templateId);
        if (template) {
          session.exercises = template.exercises.map((ex, index) => ({
            id: `${Date.now()}-${index}`,
            exerciseId: ex.exerciseId,
            exercise: {} as any, // Will be populated when loading
            order: ex.order,
            plannedSets: [],
            actualSets: [],
            coachingCues: ex.coachingCues || []
          }));
          session.totalExercises = template.exercises.length;
        }
      }

      const sessionRef = await addDoc(collection(db, SESSIONS_COLLECTION), session);

      // LINK TO BOOKING SLOT: Mark the corresponding booking slot as booked
      try {
        await ScheduleService.bookTimeSlot(trainerId, {
          traineeId: sessionData.traineeId,
          sessionType: sessionData.type,
          date: sessionData.scheduledDate,
          startTime: sessionData.startTime,
          duration: sessionData.duration,
          location: sessionData.location,
          isRemote: false, // Can be determined from location or session type
          notes: sessionData.trainerNotes
        });
      } catch (bookingError) {
        console.warn('Session created but failed to create booking slot:', bookingError);
        // Don't fail the session creation if booking slot creation fails
      }

      return sessionRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Helper to calculate end time
  private static calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + durationMinutes);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // Helper to check if entire time range is covered by available slots
  private static isTimeRangeCovered(
    startTime: string,
    endTime: string,
    availableSlots: Array<{ start: string; end: string }>
  ): boolean {
    if (availableSlots.length === 0) return false;

    // Convert times to minutes for easier comparison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Sort slots by start time
    const sortedSlots = availableSlots
      .map(slot => ({
        start: timeToMinutes(slot.start),
        end: timeToMinutes(slot.end)
      }))
      .sort((a, b) => a.start - b.start);

    // Check if the time range is fully covered by contiguous slots
    let currentCoverage = startMinutes;

    for (const slot of sortedSlots) {
      // Skip slots that end before our coverage starts
      if (slot.end <= currentCoverage) continue;

      // If there's a gap, range is not covered
      if (slot.start > currentCoverage) return false;

      // Extend coverage
      currentCoverage = Math.max(currentCoverage, slot.end);

      // If we've covered up to or past the end time, we're done
      if (currentCoverage >= endMinutes) return true;
    }

    // Check if we reached the end
    return currentCoverage >= endMinutes;
  }

  // Get sessions for a trainer
  static async getTrainerSessions(
    trainerId: string,
    options: {
      status?: string;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<TrainingSession[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      let sessionsQuery = query(
        collection(db, SESSIONS_COLLECTION),
        where('trainerId', '==', trainerId),
        orderBy('scheduledDate', 'desc')
      );

      if (options.status) {
        sessionsQuery = query(sessionsQuery, where('status', '==', options.status));
      }

      if (options.limit) {
        sessionsQuery = query(sessionsQuery, limit(options.limit));
      }

      const snapshot = await getDocs(sessionsQuery);
      const sessions: TrainingSession[] = [];

      snapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() } as TrainingSession);
      });

      // Filter by date range if provided
      if (options.startDate || options.endDate) {
        return sessions.filter(session => {
          const sessionDate = new Date(session.scheduledDate);
          if (options.startDate && sessionDate < new Date(options.startDate)) return false;
          if (options.endDate && sessionDate > new Date(options.endDate)) return false;
          return true;
        });
      }

      return sessions;
    } catch (error) {
      console.error('Error getting trainer sessions:', error);
      throw error;
    }
  }

  // Get sessions for a trainee
  static async getTraineeSessions(
    traineeId: string,
    options: { limit?: number; status?: string } = {}
  ): Promise<TrainingSession[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      let sessionsQuery = query(
        collection(db, SESSIONS_COLLECTION),
        where('traineeId', '==', traineeId),
        orderBy('scheduledDate', 'desc')
      );

      if (options.status) {
        sessionsQuery = query(sessionsQuery, where('status', '==', options.status));
      }

      if (options.limit) {
        sessionsQuery = query(sessionsQuery, limit(options.limit));
      }

      const snapshot = await getDocs(sessionsQuery);
      const sessions: TrainingSession[] = [];

      snapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() } as TrainingSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error getting trainee sessions:', error);
      throw error;
    }
  }

  // Get a single session by ID
  static async getSession(sessionId: string): Promise<TrainingSession | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as TrainingSession;
      }

      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  // Update session status
  static async updateSessionStatus(
    sessionId: string,
    status: TrainingSession['status'],
    additionalData: Partial<TrainingSession> = {}
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
      await updateDoc(docRef, {
        status,
        ...additionalData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  // Start a session (mark as in progress)
  static async startSession(sessionId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.updateSessionStatus(sessionId, 'in_progress', {
      actualStartTime: now
    });
  }

  // Complete a session with results
  static async completeSession(
    sessionId: string,
    sessionLog: SessionLogFormData
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date().toISOString();
      const batch = writeBatch(db);

      // Update session with completion data
      const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
      batch.update(sessionRef, {
        status: 'completed',
        actualEndTime: now,
        completedAt: now,
        sessionNotes: sessionLog.sessionNotes,
        traineePerformance: sessionLog.traineePerformance,
        updatedAt: now
      });

      // Save personal records if any
      if (sessionLog.personalRecords && sessionLog.personalRecords.length > 0) {
        for (const pr of sessionLog.personalRecords) {
          const prRef = doc(collection(db, PERSONAL_RECORDS_COLLECTION));
          batch.set(prRef, {
            ...pr,
            id: prRef.id,
            sessionId,
            createdAt: now
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  // Delete a session
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // ==================== SESSION TEMPLATES ====================

  // Create a session template
  static async createSessionTemplate(
    trainerId: string,
    templateData: Omit<SessionTemplate, 'id' | 'trainerId' | 'timesUsed' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date().toISOString();
      const template: Omit<SessionTemplate, 'id'> = {
        ...templateData,
        trainerId,
        timesUsed: 0,
        createdAt: now,
        updatedAt: now
      };

      const templateRef = await addDoc(collection(db, SESSION_TEMPLATES_COLLECTION), template);
      return templateRef.id;
    } catch (error) {
      console.error('Error creating session template:', error);
      throw error;
    }
  }

  // Get session templates for a trainer
  static async getSessionTemplates(trainerId: string): Promise<SessionTemplate[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const templatesQuery = query(
        collection(db, SESSION_TEMPLATES_COLLECTION),
        where('trainerId', '==', trainerId),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(templatesQuery);
      const templates: SessionTemplate[] = [];

      snapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() } as SessionTemplate);
      });

      return templates;
    } catch (error) {
      console.error('Error getting session templates:', error);
      throw error;
    }
  }

  // Get a single template
  static async getSessionTemplate(templateId: string): Promise<SessionTemplate | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, SESSION_TEMPLATES_COLLECTION, templateId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as SessionTemplate;
      }

      return null;
    } catch (error) {
      console.error('Error getting session template:', error);
      throw error;
    }
  }

  // ==================== PERSONAL RECORDS ====================

  // Get personal records for a trainee
  static async getTraineePersonalRecords(traineeId: string): Promise<PersonalRecord[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const recordsQuery = query(
        collection(db, PERSONAL_RECORDS_COLLECTION),
        where('traineeId', '==', traineeId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(recordsQuery);
      const records: PersonalRecord[] = [];

      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as PersonalRecord);
      });

      return records;
    } catch (error) {
      console.error('Error getting personal records:', error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  // Generate session statistics for a trainer
  static async generateSessionStats(
    trainerId: string,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<SessionStats> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      // Calculate date range
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
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get sessions in the period
      const sessions = await this.getTrainerSessions(trainerId, {
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      });

      // Calculate statistics
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const cancelledSessions = sessions.filter(s => s.status === 'cancelled').length;
      const noShowSessions = sessions.filter(s => s.status === 'no_show').length;

      const averageSessionDuration = sessions.reduce((acc, s) => {
        if (s.actualStartTime && s.actualEndTime) {
          const duration = new Date(s.actualEndTime).getTime() - new Date(s.actualStartTime).getTime();
          return acc + (duration / (1000 * 60)); // Convert to minutes
        }
        return acc + s.duration;
      }, 0) / (totalSessions || 1);

      // Get personal records in this period
      const allRecords = await Promise.all(
        sessions.map(s => s.traineeId)
          .filter((id, index, arr) => arr.indexOf(id) === index) // unique trainee IDs
          .map(traineeId => this.getTraineePersonalRecords(traineeId))
      );

      const personalRecordsSet = allRecords.flat()
        .filter(pr => new Date(pr.createdAt) >= startDate).length;

      const stats: SessionStats = {
        trainerId,
        period,
        totalSessions,
        completedSessions,
        cancelledSessions,
        noShowSessions,
        averageSessionDuration,
        averageSessionRating: 0, // TODO: Implement session ratings
        personalRecordsSet,
        clientRetentionRate: 0, // TODO: Calculate retention
        averageClientProgress: 0, // TODO: Calculate progress
        newClients: 0, // TODO: Track new clients
        strengthSessions: sessions.filter(s => s.type === 'personal_training').length,
        cardioSessions: 0, // TODO: Track by workout type
        assessmentSessions: sessions.filter(s => s.type === 'assessment').length,
        otherSessions: sessions.filter(s => !['personal_training', 'assessment'].includes(s.type)).length,
        generatedAt: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      console.error('Error generating session stats:', error);
      throw error;
    }
  }

  // Get upcoming sessions for a trainer (next 7 days)
  static async getUpcomingSessions(trainerId: string): Promise<TrainingSession[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return this.getTrainerSessions(trainerId, {
      startDate: today.toISOString(),
      endDate: nextWeek.toISOString(),
      status: 'scheduled'
    });
  }

  // Get today's sessions for a trainer
  static async getTodaySessions(trainerId: string): Promise<TrainingSession[]> {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return this.getTrainerSessions(trainerId, {
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString()
    });
  }
}