import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { Exercise } from '../shared-types';

const EXERCISES_COLLECTION = 'exercises';

export class ExerciseService {

  // Get all exercises
  static async getAllExercises(): Promise<Exercise[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const exercisesQuery = query(
        collection(db, EXERCISES_COLLECTION),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(exercisesQuery);
      const exercises: Exercise[] = [];

      snapshot.forEach((doc) => {
        exercises.push({ id: doc.id, ...doc.data() } as Exercise);
      });

      return exercises;
    } catch (error) {
      console.error('Error getting exercises:', error);
      throw error;
    }
  }

  // Get exercises by category
  static async getExercisesByCategory(category: Exercise['category']): Promise<Exercise[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const exercisesQuery = query(
        collection(db, EXERCISES_COLLECTION),
        where('category', '==', category),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(exercisesQuery);
      const exercises: Exercise[] = [];

      snapshot.forEach((doc) => {
        exercises.push({ id: doc.id, ...doc.data() } as Exercise);
      });

      return exercises;
    } catch (error) {
      console.error('Error getting exercises by category:', error);
      throw error;
    }
  }

  // Get exercise by ID
  static async getExercise(exerciseId: string): Promise<Exercise | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, EXERCISES_COLLECTION, exerciseId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Exercise;
      }

      return null;
    } catch (error) {
      console.error('Error getting exercise:', error);
      throw error;
    }
  }

  // Search exercises by name
  static async searchExercises(searchTerm: string, limitCount: number = 20): Promise<Exercise[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const exercisesQuery = query(
        collection(db, EXERCISES_COLLECTION),
        orderBy('name'),
        limit(limitCount)
      );

      const snapshot = await getDocs(exercisesQuery);
      const exercises: Exercise[] = [];

      snapshot.forEach((doc) => {
        const exercise = { id: doc.id, ...doc.data() } as Exercise;
        if (exercise.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          exercises.push(exercise);
        }
      });

      return exercises;
    } catch (error) {
      console.error('Error searching exercises:', error);
      throw error;
    }
  }
}