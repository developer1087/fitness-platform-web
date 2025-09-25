import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User, LoginCredentials, SignupCredentials, UserProfile } from '../shared-types';

// Auth service functions
export const authService = {
  // Sign in with email and password
  async signIn(credentials: LoginCredentials): Promise<User> {
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await this.createUserObject(userCredential.user);
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;

    // Check if this is a new user and create profile if needed
    const existingProfile = await this.getUserProfile(firebaseUser.uid);

    if (!existingProfile) {
      // Extract name from Google profile
      const displayName = firebaseUser.displayName || '';
      const [firstName = '', lastName = ''] = displayName.split(' ');

      const userProfile: UserProfile = {
        firstName,
        lastName,
        preferences: {
          workoutReminders: true,
          emailNotifications: true,
          pushNotifications: true,
          privacySettings: {
            profileVisibility: 'friends',
            workoutDataSharing: false,
            progressSharing: false,
          },
        },
      };

      await this.createUserProfile(firebaseUser.uid, userProfile);
    }

    return await this.createUserObject(firebaseUser);
  },

  // Sign up with email and password
  async signUp(credentials: SignupCredentials): Promise<User> {
    const { email, password, firstName, lastName } = credentials;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(firebaseUser, {
      displayName: `${firstName} ${lastName}`,
    });

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      firstName,
      lastName,
      preferences: {
        workoutReminders: true,
        emailNotifications: true,
        pushNotifications: true,
        privacySettings: {
          profileVisibility: 'friends',
          workoutDataSharing: false,
          progressSharing: false,
        },
      },
    };

    await this.createUserProfile(firebaseUser.uid, userProfile);
    return await this.createUserObject(firebaseUser);
  },

  // Sign out
  async signOut(): Promise<void> {
    await signOut(auth);
  },

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  // Create user profile in Firestore
  async createUserProfile(uid: string, profile: UserProfile): Promise<void> {
    const userDoc = doc(db, 'users', uid);
    await setDoc(userDoc, {
      ...profile,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });
  },

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, updates);
  },

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = doc(db, 'users', uid);
    const docSnap = await getDoc(userDoc);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  // Create User object from Firebase User
  async createUserObject(firebaseUser: FirebaseUser): Promise<User> {
    const profile = await this.getUserProfile(firebaseUser.uid);

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
      role: 'user', // Default role, could be fetched from Firestore
      profile: profile || {
        firstName: '',
        lastName: '',
        preferences: {
          workoutReminders: true,
          emailNotifications: true,
          pushNotifications: true,
          privacySettings: {
            profileVisibility: 'friends',
            workoutDataSharing: false,
            progressSharing: false,
          },
        },
      },
    };
  },
};