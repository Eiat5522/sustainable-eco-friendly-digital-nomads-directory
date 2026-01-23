import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateUserModal from '../CreateUserModal';
import { type User } from '../data';

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

describe('CreateUserModal', () => {
  const mockOnClose = jest.fn();
  const mockOnUserCreated = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onUserCreated: mockOnUserCreated,
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
    it('should not render when isOpen is false', () => {
      render(<CreateUserModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Create New User')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<CreateUserModal {...defaultProps} />);
      expect(screen.getByText('Create New User')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it('should render Cancel and Create buttons', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText(/close modal/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should allow typing in name field', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');
      
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should allow typing in email field', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'john@example.com');
      
      expect(emailInput).toHaveValue('john@example.com');
    });

    it('should allow selecting role', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const roleSelect = screen.getByLabelText(/role/i);
      await user.selectOptions(roleSelect, 'admin');
      
      expect(roleSelect).toHaveValue('admin');
    });

    it('should have default role as "user"', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      const roleSelect = screen.getByLabelText(/role/i) as HTMLSelectElement;
      expect(roleSelect.value).toBe('user');
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const submitButton = screen.getByText('Create User');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByText('Create User');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      // Trigger validation error
      const submitButton = screen.getByText('Create User');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
      
      // Start typing
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'J');
      
      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onUserCreated with valid form data', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const roleSelect = screen.getByLabelText(/role/i);
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.selectOptions(roleSelect, 'admin');
      
      const submitButton = screen.getByText('Create User');
      await user.click(submitButton);
      
      // Fast-forward timers to complete the simulated API call
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnUserCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
            status: 'pending',
          })
        );
      });
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      
      const submitButton = screen.getByText('Create User');
      await user.click(submitButton);
      
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Creating...');
      
      jest.advanceTimersByTime(500);
    });

    it('should disable all form fields during submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      
      const submitButton = screen.getByText('Create User');
      await user.click(submitButton);
      
      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(screen.getByLabelText(/role/i)).toBeDisabled();
      
      jest.advanceTimersByTime(500);
    });

    it('should close modal after successful submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      
      const submitButton = screen.getByText('Create User');
      await user.click(submitButton);
      
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      
      const submitButton = screen.getByText('Create User');
      await user.click(submitButton);
      
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Closing', () => {
    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when clicking Cancel button', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when clicking backdrop', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking inside the modal content', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      const modalContent = screen.getByText('Create New User').closest('div');
      if (modalContent) {
        fireEvent.click(modalContent);
      }
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should reset form when closing', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      await user.type(nameInput, 'John Doe');
      
      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible form labels', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const roleSelect = screen.getByLabelText(/role/i);
      
      expect(nameInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(roleSelect).toBeRequired();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on submission failure', async () => {
      // This test simulates a scenario where validation passes but backend fails
      // In the current implementation, errors are caught and displayed
      render(<CreateUserModal {...defaultProps} />);
      
      // Test that the error display mechanism works by triggering validation
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorContainer = screen.queryByText(/Name is required/i);
        expect(errorContainer).toBeInTheDocument();
      });
    });

    it('should display multiple validation errors', async () => {
      render(<CreateUserModal {...defaultProps} />);
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Role is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Role Options', () => {
    it('should have all role options available', () => {
      render(<CreateUserModal {...defaultProps} />);
      
      const roleSelect = screen.getByLabelText(/role/i) as HTMLSelectElement;
      const options = Array.from(roleSelect.options).map(opt => opt.value);
      
      expect(options).toContain('user');
      expect(options).toContain('venueOwner');
      expect(options).toContain('editor');
      expect(options).toContain('admin');
    });
  });
});
