import { authService } from '../../lib/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Mock Firebase functions
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockSendPasswordResetEmail = sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockDoc.mockReturnValue({} as any);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        firstName: 'Test',
        lastName: 'User',
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
      }),
    } as any);
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockUpdateProfile.mockResolvedValue(undefined);
  });

  describe('signIn', () => {
    it('should sign in user with valid credentials', async () => {
      const mockFirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        metadata: {
          creationTime: '2023-01-01T00:00:00.000Z',
          lastSignInTime: '2023-01-01T00:00:00.000Z',
        },
      };

      const mockUserCredential = {
        user: mockFirebaseUser,
      };

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.signIn(credentials);

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object), // auth instance
        credentials.email,
        credentials.password
      );
      expect(result).toEqual(expect.objectContaining({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        role: 'user',
        profile: expect.any(Object),
      }));
    });

    it('should throw error for invalid credentials', async () => {
      const errorMessage = 'Invalid email or password';
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      const credentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.signIn(credentials)).rejects.toThrow(errorMessage);
    });

    it('should handle Firebase auth errors', async () => {
      const firebaseError = new Error('User not found');
      firebaseError.name = 'FirebaseError';
      (firebaseError as any).code = 'auth/user-not-found';

      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(authService.signIn(credentials)).rejects.toThrow('User not found');
    });
  });

  describe('signUp', () => {
    it('should create user account with valid data', async () => {
      const mockFirebaseUser = {
        uid: 'new-user-uid',
        email: 'newuser@example.com',
        displayName: 'John Doe',
        photoURL: null,
        emailVerified: false,
        metadata: {
          creationTime: '2023-01-01T00:00:00.000Z',
          lastSignInTime: '2023-01-01T00:00:00.000Z',
        },
      };

      const mockUserCredential = {
        user: mockFirebaseUser,
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const credentials = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        confirmPassword: 'password123',
      };

      const result = await authService.signUp(credentials);

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object), // auth instance
        credentials.email,
        credentials.password
      );

      expect(mockUpdateProfile).toHaveBeenCalledWith(
        mockFirebaseUser,
        { displayName: 'John Doe' }
      );

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object), // doc reference
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          role: 'user',
          createdAt: expect.any(String),
          lastLoginAt: expect.any(String),
        })
      );

      expect(result).toEqual(expect.objectContaining({
        uid: 'new-user-uid',
        email: 'newuser@example.com',
        role: 'user',
        profile: expect.any(Object),
      }));
    });

    it('should throw error if email already exists', async () => {
      const firebaseError = new Error('Email already in use');
      firebaseError.name = 'FirebaseError';
      (firebaseError as any).code = 'auth/email-already-in-use';

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      const credentials = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        confirmPassword: 'password123',
      };

      await expect(authService.signUp(credentials)).rejects.toThrow('Email already in use');
    });

    it('should handle weak password errors', async () => {
      const firebaseError = new Error('Password should be at least 6 characters');
      firebaseError.name = 'FirebaseError';
      (firebaseError as any).code = 'auth/weak-password';

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      const credentials = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        confirmPassword: '123',
      };

      await expect(authService.signUp(credentials)).rejects.toThrow('Password should be at least 6 characters');
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await authService.signOut();

      expect(mockSignOut).toHaveBeenCalledWith({});
    });

    it('should handle sign out errors', async () => {
      const errorMessage = 'Sign out failed';
      mockSignOut.mockRejectedValue(new Error(errorMessage));

      await expect(authService.signOut()).rejects.toThrow(errorMessage);
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      const email = 'test@example.com';
      await authService.resetPassword(email);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        {}, // auth instance
        email
      );
    });

    it('should throw error for invalid email', async () => {
      const firebaseError = new Error('User not found');
      firebaseError.name = 'FirebaseError';
      (firebaseError as any).code = 'auth/user-not-found';

      mockSendPasswordResetEmail.mockRejectedValue(firebaseError);

      const email = 'nonexistent@example.com';

      await expect(authService.resetPassword(email)).rejects.toThrow('User not found');
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile in Firestore', async () => {
      mockSetDoc.mockResolvedValue(undefined);

      const userId = 'test-uid';
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
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

      await authService.createUserProfile(userId, userData);

      expect(mockSetDoc).toHaveBeenCalledWith(
        {}, // doc reference
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          role: 'user',
          createdAt: expect.any(String),
          lastLoginAt: expect.any(String),
        })
      );
    });

    it('should handle Firestore errors', async () => {
      const errorMessage = 'Failed to create profile';
      mockSetDoc.mockRejectedValue(new Error(errorMessage));

      const userId = 'test-uid';
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      await expect(authService.createUserProfile(userId, userData)).rejects.toThrow(errorMessage);
    });
  });
});