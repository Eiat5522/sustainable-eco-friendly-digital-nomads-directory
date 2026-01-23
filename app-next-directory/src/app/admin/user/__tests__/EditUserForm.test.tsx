import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditUserForm from '../EditUserForm';
import { type User } from '../../users/data';

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Input component
jest.mock('@/components/ui/Input', () => ({
  Input: (props: any) => <input {...props} />,
}));

describe('EditUserForm', () => {
  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-12-20T14:30:00Z',
    listingsCount: 3,
    reviewsCount: 12,
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    user: mockUser,
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the form title', () => {
      render(<EditUserForm {...defaultProps} />);
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    it('should render all form fields with user data', () => {
      render(<EditUserForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const roleSelect = screen.getByLabelText(/role/i) as HTMLSelectElement;
      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
      
      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(roleSelect.value).toBe('user');
      expect(statusSelect.value).toBe('active');
    });

    it('should render all action buttons', () => {
      render(<EditUserForm {...defaultProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should render user information section', () => {
      render(<EditUserForm {...defaultProps} />);
      
      expect(screen.getByText('User Information')).toBeInTheDocument();
      expect(screen.getByText(/User ID:/i)).toBeInTheDocument();
      expect(screen.getByText(/Created:/i)).toBeInTheDocument();
      expect(screen.getByText(/Listings:/i)).toBeInTheDocument();
      expect(screen.getByText(/Reviews:/i)).toBeInTheDocument();
      expect(screen.getByText(/Last Login:/i)).toBeInTheDocument();
    });

    it('should display user statistics correctly', () => {
      render(<EditUserForm {...defaultProps} />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // listingsCount
      expect(screen.getByText('12')).toBeInTheDocument(); // reviewsCount
    });
  });

  describe('Form Interaction', () => {
    it('should allow editing name field', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');
      
      expect(nameInput).toHaveValue('Jane Smith');
    });

    it('should allow editing email field', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'jane@example.com');
      
      expect(emailInput).toHaveValue('jane@example.com');
    });

    it('should allow changing role', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const roleSelect = screen.getByLabelText(/role/i);
      await user.selectOptions(roleSelect, 'admin');
      
      expect(roleSelect).toHaveValue('admin');
    });

    it('should allow changing status', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'suspended');
      
      expect(statusSelect).toHaveValue('suspended');
    });
  });

  describe('Dirty State Detection', () => {
    it('should disable Save button when form is not dirty', () => {
      render(<EditUserForm {...defaultProps} />);
      
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when form is dirty', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'X');
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should disable Reset button when form is not dirty', () => {
      render(<EditUserForm {...defaultProps} />);
      
      const resetButton = screen.getByText('Reset');
      expect(resetButton).toBeDisabled();
    });

    it('should enable Reset button when form is dirty', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'X');
      
      await waitFor(() => {
        const resetButton = screen.getByText('Reset');
        expect(resetButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty name', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      
      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should show error when submitting without changes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      // Make a change first to enable the button
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'X');
      
      // Reset to original
      await user.clear(nameInput);
      await user.type(nameInput, 'John Doe');
      
      // Try to submit
      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/No changes detected/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      // Trigger validation error
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      
      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
      
      // Start typing
      await user.type(nameInput, 'J');
      
      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with updated data', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');
      
      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);
      
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Jane Smith',
            email: 'john@example.com',
            role: 'user',
            status: 'active',
          })
        );
      });
    });

    it('should disable all fields during submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'X');
      
      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);
      
      expect(nameInput).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/role/i)).toBeDisabled();
      expect(screen.getByLabelText(/status/i)).toBeDisabled();
      
      jest.advanceTimersByTime(500);
    });

    it('should show "Saving..." text during submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'X');
      
      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);
      
      expect(submitButton).toHaveTextContent('Saving...');
      
      jest.advanceTimersByTime(500);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset form to original values', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      // Make changes
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');
      
      // Reset
      const resetButton = screen.getByText('Reset');
      await user.click(resetButton);
      
      await waitFor(() => {
        expect(nameInput.value).toBe('John Doe');
      });
    });

    it('should clear errors when resetting', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      // Create error
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      
      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
      
      // Reset
      const resetButton = screen.getByText('Reset');
      await user.click(resetButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EditUserForm {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('User Information Display', () => {
    it('should display user ID', () => {
      render(<EditUserForm {...defaultProps} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should format and display creation date', () => {
      render(<EditUserForm {...defaultProps} />);
      // Date should be formatted as locale date string
      const dateText = new Date('2024-01-15T10:30:00Z').toLocaleDateString();
      expect(screen.getByText(dateText)).toBeInTheDocument();
    });

    it('should display last login date when available', () => {
      render(<EditUserForm {...defaultProps} />);
      const dateText = new Date('2024-12-20T14:30:00Z').toLocaleDateString();
      expect(screen.getByText(dateText)).toBeInTheDocument();
    });

    it('should not show last login section when unavailable', () => {
      const userWithoutLogin = { ...mockUser, lastLogin: undefined };
      render(<EditUserForm {...defaultProps} user={userWithoutLogin} />);
      
      const lastLoginTexts = screen.queryAllByText(/Last Login:/i);
      expect(lastLoginTexts).toHaveLength(0);
    });
  });

  describe('Role and Status Options', () => {
    it('should have all role options', () => {
      render(<EditUserForm {...defaultProps} />);
      
      const roleSelect = screen.getByLabelText(/role/i) as HTMLSelectElement;
      const options = Array.from(roleSelect.options).map(opt => opt.value);
      
      expect(options).toContain('user');
      expect(options).toContain('venueOwner');
      expect(options).toContain('editor');
      expect(options).toContain('admin');
    });

    it('should have all status options', () => {
      render(<EditUserForm {...defaultProps} />);
      
      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
      const options = Array.from(statusSelect.options).map(opt => opt.value);
      
      expect(options).toContain('active');
      expect(options).toContain('pending');
      expect(options).toContain('suspended');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<EditUserForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('should mark fields as required', () => {
      render(<EditUserForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/name/i)).toBeRequired();
      expect(screen.getByLabelText(/email/i)).toBeRequired();
      expect(screen.getByLabelText(/role/i)).toBeRequired();
      expect(screen.getByLabelText(/status/i)).toBeRequired();
    });
  });
});
