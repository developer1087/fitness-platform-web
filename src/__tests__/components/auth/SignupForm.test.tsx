import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '../../../components/auth/SignupForm';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('SignupForm', () => {
  const mockSignUp = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      clearError: mockClearError,
    });
  });

  it('should render signup form with all fields', () => {
    render(<SignupForm />);

    expect(screen.getByText('Join Fitness Platform')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('should validate all required fields', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Submit empty form
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const toggleButton = screen.getByRole('button', { name: '👁️' }); // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Toggle password visibility
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle back
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue(undefined);

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
    });
  });

  it('should show loading state during submission', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      clearError: mockClearError,
    });

    render(<SignupForm />);

    const submitButton = screen.getByRole('button', { name: /creating account/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
  });

  it('should display error message', () => {
    const errorMessage = 'Email already in use';
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: errorMessage,
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      clearError: mockClearError,
    });

    render(<SignupForm />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it.skip('should handle form submission error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Weak password';
    mockSignUp.mockRejectedValue(new Error(errorMessage));

    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<SignupForm />);

    // Fill form with valid data
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'weak');
    await user.type(screen.getByLabelText(/confirm password/i), 'weak');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Signup failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should validate name fields length', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Test minimum length
    await user.type(firstNameInput, 'A');
    await user.type(lastNameInput, 'B');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/last name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('should prevent multiple submissions', async () => {
    const user = userEvent.setup();
    let resolveSignUp: () => void;
    const signUpPromise = new Promise<void>((resolve) => {
      resolveSignUp = resolve;
    });
    mockSignUp.mockReturnValue(signUpPromise);

    render(<SignupForm />);

    // Fill form with valid data
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /create account/i });

    // First submission
    await user.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();

    // Try to submit again - should not call signUp again
    await user.click(submitButton);
    expect(mockSignUp).toHaveBeenCalledTimes(1);

    // Resolve the first submission
    resolveSignUp!();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it.skip('should trim whitespace from input fields', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue(undefined);

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/first name/i), '  John  ');
    await user.type(screen.getByLabelText(/last name/i), '  Doe  ');
    await user.type(screen.getByLabelText(/email address/i), '  john@example.com  ');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
    });
  });
});