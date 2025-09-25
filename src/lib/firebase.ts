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

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development - must be done before any operations
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Use a flag to ensure we only connect once
  if (!(globalThis as any).__FIREBASE_EMULATOR_CONNECTED__) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('✅ Connected to Auth emulator');
    } catch (error) {
      console.log('Auth emulator connection:', error);
    }

    try {
      connectFirestoreEmulator(db, 'localhost', 8081);
      console.log('✅ Connected to Firestore emulator');
    } catch (error) {
      console.log('Firestore emulator connection:', error);
    }

    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('✅ Connected to Storage emulator');
    } catch (error) {
      console.log('Storage emulator connection:', error);
    }

    (globalThis as any).__FIREBASE_EMULATOR_CONNECTED__ = true;
  }
}

export default app;