import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useAuth, AuthProvider } from '../../hooks/useAuth';
import { authService } from '../../lib/auth';
import { onAuthStateChanged } from 'firebase/auth';

// Mock the auth service
jest.mock('../../lib/auth');
jest.mock('firebase/auth');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;

// Wrapper component for testing hooks that use context
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth service mocks
    mockAuthService.createUserObject.mockImplementation(async (firebaseUser) => ({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      createdAt: '2023-01-01T00:00:00.000Z',
      lastLoginAt: '2023-01-01T00:00:00.000Z',
      role: 'trainer',
      profile: {
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
      },
    }));

    // Mock onAuthStateChanged to immediately call the callback with null (no user)
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });
  });

  it('should initialize with no user and not loading', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should sign in user successfully', async () => {
    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true,
    };

    const expectedUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      lastLoginAt: '2023-01-01T00:00:00.000Z',
      role: 'trainer',
      profile: expect.any(Object),
    };

    mockAuthService.signIn.mockResolvedValue(expectedUser);

    // Mock onAuthStateChanged to return the firebase user after sign in
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockFirebaseUser as any), 0);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    await act(async () => {
      await result.current.signIn(credentials);
    });

    expect(mockAuthService.signIn).toHaveBeenCalledWith(credentials);

    await waitFor(() => {
      expect(result.current.user).toEqual(expect.objectContaining({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        role: 'trainer',
      }));
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle sign in error', async () => {
    const errorMessage = 'Invalid credentials';
    mockAuthService.signIn.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuth(), { wrapper });

    const credentials = {
      email: 'wrong@example.com',
      password: 'wrongpassword',
    };

    await act(async () => {
      try {
        await result.current.signIn(credentials);
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it('should sign up user successfully', async () => {
    const mockFirebaseUser = {
      uid: 'new-user-uid',
      email: 'newuser@example.com',
      displayName: 'John Doe',
      photoURL: null,
      emailVerified: false,
    };

    const expectedUser = {
      uid: 'new-user-uid',
      email: 'newuser@example.com',
      displayName: 'John Doe',
      photoURL: null,
      emailVerified: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      lastLoginAt: '2023-01-01T00:00:00.000Z',
      role: 'trainer',
      profile: expect.any(Object),
    };

    mockAuthService.signUp.mockResolvedValue(expectedUser);

    // Mock onAuthStateChanged to return the firebase user after sign up
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockFirebaseUser as any), 0);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const credentials = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      confirmPassword: 'password123',
    };

    await act(async () => {
      await result.current.signUp(credentials);
    });

    expect(mockAuthService.signUp).toHaveBeenCalledWith(credentials);

    await waitFor(() => {
      expect(result.current.user).toEqual(expect.objectContaining({
        uid: 'new-user-uid',
        email: 'newuser@example.com',
        displayName: 'John Doe',
        emailVerified: false,
        role: 'trainer',
      }));
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle sign up error', async () => {
    const errorMessage = 'Email already in use';
    mockAuthService.signUp.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuth(), { wrapper });

    const credentials = {
      email: 'existing@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      confirmPassword: 'password123',
    };

    await act(async () => {
      try {
        await result.current.signUp(credentials);
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it('should sign out user successfully', async () => {
    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true,
    };

    // Start with a signed-in user
    let authCallback: ((user: any) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      callback(mockFirebaseUser as any);
      return jest.fn();
    });

    mockAuthService.signOut.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial user state
    await waitFor(() => {
      expect(result.current.user).toEqual(expect.objectContaining({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      }));
    });

    await act(async () => {
      await result.current.signOut();
      // Simulate Firebase auth state change after sign out
      if (authCallback) {
        authCallback(null);
      }
    });

    expect(mockAuthService.signOut).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle sign out error', async () => {
    const errorMessage = 'Sign out failed';
    mockAuthService.signOut.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.signOut();
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should clear error when clearError is called', async () => {
    const errorMessage = 'Test error';
    mockAuthService.signIn.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Trigger an error
    await act(async () => {
      try {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'wrong',
        });
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should handle auth state changes', async () => {
    let authStateCallback: ((user: any) => void) | null = null;

    // Capture the callback function
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      authStateCallback = callback;
      callback(null); // Initial state
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially no user
    await waitFor(() => {
      expect(result.current.user).toBe(null);
    });

    // Simulate user sign in
    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true,
    };

    act(() => {
      if (authStateCallback) {
        authStateCallback(mockFirebaseUser);
      }
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(expect.objectContaining({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        role: 'trainer',
      }));
    });

    // Simulate user sign out
    act(() => {
      if (authStateCallback) {
        authStateCallback(null);
      }
    });

    await waitFor(() => {
      expect(result.current.user).toBe(null);
    });
  });

  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});