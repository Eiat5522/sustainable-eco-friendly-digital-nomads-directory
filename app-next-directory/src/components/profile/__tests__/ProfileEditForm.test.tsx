import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileEditForm } from '../ProfileEditForm';

describe('ProfileEditForm', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders with current name pre-filled', () => {
    render(<ProfileEditForm currentName="John Doe" />);
    const input = screen.getByLabelText(/Full Name/i);
    expect(input).toHaveValue('John Doe');
  });

  it('allows name to be changed', () => {
    render(<ProfileEditForm currentName="John Doe" />);
    const input = screen.getByLabelText(/Full Name/i);
    fireEvent.change(input, { target: { value: 'Jane Smith' } });
    expect(input).toHaveValue('Jane Smith');
  });

  it('disables submit button when name is empty', () => {
    render(<ProfileEditForm currentName="" />);
    const input = screen.getByLabelText(/Full Name/i);
    const submitButton = screen.getByText(/Save Changes/i);
    
    expect(submitButton).toBeDisabled();
    
    fireEvent.change(input, { target: { value: '   ' } });
    expect(submitButton).toBeDisabled();
  });

  it('calls onSuccess after successful submission', async () => {
    const mockOnSuccess = jest.fn();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { user: { name: 'Jane Smith' } } }),
    });

    render(<ProfileEditForm currentName="John Doe" onSuccess={mockOnSuccess} />);
    const input = screen.getByLabelText(/Full Name/i);
    const submitButton = screen.getByText(/Save Changes/i);

    fireEvent.change(input, { target: { value: 'Jane Smith' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Jane Smith'),
        })
      );      
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message on failed submission', async () => {
    const mockOnSuccess = jest.fn();
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'Update failed' } }),
    });

    render(<ProfileEditForm currentName="John Doe" onSuccess={mockOnSuccess} />);
    const input = screen.getByLabelText(/Full Name/i);
    const submitButton = screen.getByText(/Save Changes/i);

    fireEvent.change(input, { target: { value: 'Jane Smith' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = jest.fn();
    render(<ProfileEditForm currentName="John Doe" onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
