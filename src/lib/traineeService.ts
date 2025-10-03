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
  // serverTimestamp,
  // Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  TraineeInvitationFormData,
  TraineeInvitationRecord,
  Trainee,
  // UserProfile
} from '../shared-types';
// Email sending is handled server-side via API route to avoid bundling Node-only modules in the client

// Collections
const TRAINEE_INVITATIONS_COLLECTION = 'trainee_invitations';
const TRAINEES_COLLECTION = 'trainees';
// const USERS_COLLECTION = 'users';

// Generate a secure random token for invitations
function generateInviteToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export class TraineeService {

  // Create a trainee invitation
  static async inviteTrainee(
    trainerId: string,
    invitationData: TraineeInvitationFormData
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      // Check if trainee with this phone number already exists for this trainer
      const existingTraineeQuery = query(
        collection(db, TRAINEES_COLLECTION),
        where('trainerId', '==', trainerId),
        where('phoneNumber', '==', invitationData.phoneNumber)
      );
      const existingTraineeSnapshot = await getDocs(existingTraineeQuery);

      if (!existingTraineeSnapshot.empty) {
        throw new Error('A trainee with this phone number already exists');
      }

      // Check if there's already a pending invitation for this phone number
      const existingInvitationQuery = query(
        collection(db, TRAINEE_INVITATIONS_COLLECTION),
        where('trainerId', '==', trainerId),
        where('phoneNumber', '==', invitationData.phoneNumber),
        where('status', '==', 'pending')
      );
      const existingInvitationSnapshot = await getDocs(existingInvitationQuery);

      if (!existingInvitationSnapshot.empty) {
        throw new Error('An invitation is already pending for this phone number');
      }

      const inviteToken = generateInviteToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitationRecord: Omit<TraineeInvitationRecord, 'id'> = {
        trainerId,
        phoneNumber: invitationData.phoneNumber,
        email: invitationData.email,
        firstName: invitationData.firstName,
        lastName: invitationData.lastName,
        fitnessLevel: invitationData.fitnessLevel,
        goals: invitationData.goals || [],
        notes: invitationData.notes,
        status: 'pending',
        inviteToken,
        invitedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      // Create invitation record
      const invitationRef = await addDoc(
        collection(db, TRAINEE_INVITATIONS_COLLECTION),
        invitationRecord
      );

      // Create pending trainee record
      const traineeRecord: Omit<Trainee, 'id'> = {
        trainerId,
        phoneNumber: invitationData.phoneNumber,
        email: invitationData.email,
        firstName: invitationData.firstName,
        lastName: invitationData.lastName,
        joinDate: now.toISOString(),
        status: 'pending',
        fitnessLevel: invitationData.fitnessLevel || 'beginner',
        goals: invitationData.goals || [],
        notes: invitationData.notes,
        totalSessions: 0,
        invitationId: invitationRef.id,
        authMethod: 'phone', // Default to phone auth for new invitations
      };

      await addDoc(collection(db, TRAINEES_COLLECTION), traineeRecord);

      // Send invitation SMS (primary) and email (fallback) via server API (non-blocking for UX)
      try {
        const trainerName = auth?.currentUser?.displayName || 'Your Trainer';

        // Send SMS invitation (primary method)
        void fetch('/api/sms/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: invitationData.phoneNumber,
            trainerName,
            traineeFirstName: invitationData.firstName,
            invitationToken: inviteToken,
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const msg = await res.text();
            console.warn('Invitation SMS API responded with non-OK:', msg);
          }
        }).catch((err) => {
          console.warn('Invitation SMS API call failed:', err);
        });

        // Send email invitation if email is provided (fallback method)
        if (invitationData.email) {
          void fetch('/api/email/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              traineeEmail: invitationData.email,
              trainerName,
              traineeFirstName: invitationData.firstName,
              invitationToken: inviteToken,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const msg = await res.text();
              console.warn('Invitation email API responded with non-OK:', msg);
            }
          }).catch((err) => {
            console.warn('Invitation email API call failed:', err);
          });
        }
      } catch (invitationError) {
        console.error('Error initiating invitation SMS/email:', invitationError);
        // Don't fail the entire operation if SMS/email fails
      }

      return invitationRef.id;
    } catch (error) {
      console.error('Error inviting trainee:', error);
      throw error;
    }
  }

  // Get all trainees for a trainer
  static async getTraineesByTrainer(trainerId: string): Promise<Trainee[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const traineesQuery = query(
        collection(db, TRAINEES_COLLECTION),
        where('trainerId', '==', trainerId),
        orderBy('joinDate', 'desc')
      );

      const snapshot = await getDocs(traineesQuery);
      const trainees: Trainee[] = [];

      snapshot.forEach((doc) => {
        trainees.push({ id: doc.id, ...doc.data() } as Trainee);
      });

      return trainees;
    } catch (error) {
      console.error('Error getting trainees:', error);
      throw error;
    }
  }

  // Get trainee by ID
  static async getTraineeById(traineeId: string): Promise<Trainee | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const docRef = doc(db, TRAINEES_COLLECTION, traineeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Trainee;
      }

      return null;
    } catch (error) {
      console.error('Error getting trainee:', error);
      throw error;
    }
  }

  // Get trainee by Firebase Auth user ID
  static async getTraineeByUserId(userId: string): Promise<Trainee | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const traineesQuery = query(
        collection(db, TRAINEES_COLLECTION),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(traineesQuery);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Trainee;
    } catch (error) {
      console.error('Error getting trainee by user ID:', error);
      throw error;
    }
  }

  // Get trainee by phone number
  static async getTraineeByPhone(trainerId: string, phoneNumber: string): Promise<Trainee | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const traineesQuery = query(
        collection(db, TRAINEES_COLLECTION),
        where('trainerId', '==', trainerId),
        where('phoneNumber', '==', phoneNumber)
      );

      const snapshot = await getDocs(traineesQuery);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Trainee;
    } catch (error) {
      console.error('Error getting trainee by phone number:', error);
      throw error;
    }
  }

  // Update trainee
  static async updateTrainee(traineeId: string, updates: Partial<Trainee>): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const docRef = doc(db, TRAINEES_COLLECTION, traineeId);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating trainee:', error);
      throw error;
    }
  }

  // Delete trainee
  static async deleteTrainee(traineeId: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      // Fetch trainee to get trainerId and email for invitation cleanup
      const traineeRef = doc(db, TRAINEES_COLLECTION, traineeId);
      const traineeSnap = await getDoc(traineeRef);

      if (traineeSnap.exists()) {
        const traineeData = traineeSnap.data() as any;
        const trainerId = traineeData.trainerId as string | undefined;
        const phoneNumber = traineeData.phoneNumber as string | undefined;

        // Delete the trainee document first
        await deleteDoc(traineeRef);

        // If we have identifiers, also delete ALL invitations for this trainee phone number (any status)
        if (trainerId && phoneNumber) {
          const allInvitesQuery = query(
            collection(db, TRAINEE_INVITATIONS_COLLECTION),
            where('trainerId', '==', trainerId),
            where('phoneNumber', '==', phoneNumber)
          );
          const allInvitesSnap = await getDocs(allInvitesQuery);
          const deletePromises: Promise<void>[] = [];
          allInvitesSnap.forEach((inviteDoc) => {
            deletePromises.push(deleteDoc(inviteDoc.ref));
          });
          if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
          }
        }
      } else {
        // If no trainee doc, nothing to delete
        return;
      }
    } catch (error) {
      console.error('Error deleting trainee:', error);
      throw error;
    }
  }

  // Get invitation by token (for signup process)
  static async getInvitationByToken(token: string): Promise<TraineeInvitationRecord | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const invitationQuery = query(
        collection(db, TRAINEE_INVITATIONS_COLLECTION),
        where('inviteToken', '==', token),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(invitationQuery);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const invitation = { id: doc.id, ...doc.data() } as TraineeInvitationRecord;

      // Check if invitation has expired
      if (new Date(invitation.expiresAt) < new Date()) {
        await this.expireInvitation(invitation.id);
        return null;
      }

      return invitation;
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      throw error;
    }
  }

  // Accept invitation (called when trainee signs up)
  static async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      // Update invitation status
      const invitationRef = doc(db, TRAINEE_INVITATIONS_COLLECTION, invitationId);
      await updateDoc(invitationRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      });

      // Find and update corresponding trainee record
      const traineeQuery = query(
        collection(db, TRAINEES_COLLECTION),
        where('invitationId', '==', invitationId)
      );

      const traineeSnapshot = await getDocs(traineeQuery);

      if (!traineeSnapshot.empty) {
        const traineeDoc = traineeSnapshot.docs[0];
        const traineeRef = doc(db, TRAINEES_COLLECTION, traineeDoc.id);
        await updateDoc(traineeRef, {
          userId,
          status: 'active',
          updatedAt: new Date().toISOString(),
        });

        // Update user role to 'trainee' in users collection
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          role: 'trainee',
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Expire invitation
  static async expireInvitation(invitationId: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const invitationRef = doc(db, TRAINEE_INVITATIONS_COLLECTION, invitationId);
      await updateDoc(invitationRef, {
        status: 'expired',
      });
    } catch (error) {
      console.error('Error expiring invitation:', error);
      throw error;
    }
  }

  // Resend invitation (generates new token and extends expiry)
  static async resendInvitation(invitationId: string): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const newToken = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const invitationRef = doc(db, TRAINEE_INVITATIONS_COLLECTION, invitationId);
      await updateDoc(invitationRef, {
        inviteToken: newToken,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        resentAt: new Date().toISOString(),
      });

      return newToken;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  // Get pending invitations for a trainer
  static async getPendingInvitations(trainerId: string): Promise<TraineeInvitationRecord[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      const invitationsQuery = query(
        collection(db, TRAINEE_INVITATIONS_COLLECTION),
        where('trainerId', '==', trainerId),
        where('status', '==', 'pending'),
        orderBy('invitedAt', 'desc')
      );

      const snapshot = await getDocs(invitationsQuery);
      const invitations: TraineeInvitationRecord[] = [];

      snapshot.forEach((doc) => {
        invitations.push({ id: doc.id, ...doc.data() } as TraineeInvitationRecord);
      });

      return invitations;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      throw error;
    }
  }
}