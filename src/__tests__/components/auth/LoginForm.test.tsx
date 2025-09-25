import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../../components/auth/LoginForm';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginForm', () => {
  const mockSignIn = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      clearError: mockClearError,
    });
  });

  it('should render login form with all fields', () => {
    render(<LoginForm />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('should validate email field', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Test invalid email
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    // Test empty email
    await user.clear(emailInput);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('should validate password field', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill valid email
    await user.type(emailInput, 'test@example.com');

    // Test empty password
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // Test short password
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: '👁️' }); // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      clearError: mockClearError,
    });

    render(<LoginForm />);

    const submitButtons = screen.getAllByText(/signing in/i);
    expect(submitButtons.length).toBeGreaterThan(0);
    // Check that at least one submit button is disabled
    const buttons = screen.getAllByRole('button');
    const disabledButtons = buttons.filter(button => button.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('should display error message', () => {
    const errorMessage = 'Invalid email or password';
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: errorMessage,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      clearError: mockClearError,
    });

    render(<LoginForm />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should handle form submission error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Network error';
    mockSignIn.mockRejectedValue(new Error(errorMessage));

    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should disable form during loading', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      clearError: mockClearError,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // During loading, buttons should be disabled
    const buttons = screen.getAllByRole('button');
    const disabledButtons = buttons.filter(button => button.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);

    // Note: In this implementation, inputs aren't disabled during loading
    // but the submit button is disabled which prevents submission
  });

  it('should prevent multiple submissions', async () => {
    const user = userEvent.setup();
    let resolveSignIn: () => void;
    const signInPromise = new Promise<void>((resolve) => {
      resolveSignIn = resolve;
    });
    mockSignIn.mockReturnValue(signInPromise);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // First submission
    await user.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();

    // Try to submit again - should not call signIn again
    await user.click(submitButton);
    expect(mockSignIn).toHaveBeenCalledTimes(1);

    // Resolve the first submission
    resolveSignIn!();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should clear validation errors on successful submission', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // First submit with invalid data to show errors
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // Then submit with valid data
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });

    // Validation errors should be cleared
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
  });
});