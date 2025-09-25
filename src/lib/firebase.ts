import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if we have valid configuration
function initializeFirebase() {
  // Check if we're in a build environment or missing required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase configuration missing, skipping initialization');
    return null;
  }

  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  } else {
    return getApps()[0];
  }
}

// Initialize Firebase app
const app = initializeFirebase();

// Initialize Firebase services with safety checks
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Connect to emulators in development - must be done before any operations
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && app) {
  // Use a flag to ensure we only connect once
  if (!(globalThis as any).__FIREBASE_EMULATOR_CONNECTED__) {
    if (auth) {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        console.log('✅ Connected to Auth emulator');
      } catch (error) {
        console.log('Auth emulator connection:', error);
      }
    }

    if (db) {
      try {
        connectFirestoreEmulator(db, 'localhost', 8081);
        console.log('✅ Connected to Firestore emulator');
      } catch (error) {
        console.log('Firestore emulator connection:', error);
      }
    }

    if (storage) {
      try {
        connectStorageEmulator(storage, 'localhost', 9199);
        console.log('✅ Connected to Storage emulator');
      } catch (error) {
        console.log('Storage emulator connection:', error);
      }
    }

    (globalThis as any).__FIREBASE_EMULATOR_CONNECTED__ = true;
  }
}

export default app;