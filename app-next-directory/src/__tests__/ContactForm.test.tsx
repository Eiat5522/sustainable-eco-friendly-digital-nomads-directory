import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type SearchParams = URLSearchParams;

const mockUseSearchParams = jest.fn<SearchParams, []>();

jest.mock('next/navigation', () => ({
  __esModule: true,
  useSearchParams: mockUseSearchParams,
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header" />,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="mock-footer" />,
}));

jest.mock('@/components/ui/select', () => {
  const React = require('react');
  const SelectContext = React.createContext(null);

  const Select = ({ value, onValueChange, children }: any) => (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  );

  const useSelectContext = () => {
    const context = React.useContext(SelectContext);
    if (!context) {
      throw new Error('Select components must be used within the Select provider');
    }
    return context;
  };

  const SelectTrigger = ({ children, ...props }: any) => {
    useSelectContext();
    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  };

  const SelectContent = ({ children, ...props }: any) => (
    <div role="listbox" {...props}>
      {children}
    </div>
  );

  const SelectItem = ({ value, children, ...props }: any) => {
    const { value: selectedValue, onValueChange } = useSelectContext();
    return (
      <button
        type="button"
        role="option"
        aria-selected={selectedValue === value}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  };

  const SelectValue = ({ placeholder }: any) => {
    const { value } = useSelectContext();
    return <span>{value || placeholder}</span>;
  };

  return {
    __esModule: true,
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
  };
});
type ContactUsPageComponent = (typeof import('../../app/contact-us/page'))['default'];
let ContactUsPage: ContactUsPageComponent;

const createSearchParamsMock = (values: Record<string, string | null>): SearchParams => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.set(key, value);
    }
  });
  return params as unknown as SearchParams;
};

describe('Contact Us form', () => {
  beforeAll(async () => {
    ({ default: ContactUsPage } = await import('../../app/contact-us/page'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockImplementation(() => createSearchParamsMock({}));
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('renders general enquiry fields by default and validates required input', async () => {
    const user = userEvent.setup();
    render(<ContactUsPage />);

    expect(screen.getByRole('heading', { name: 'Contact Us' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Enquiry')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Subject must be at least 5 characters')).toBeInTheDocument();
      expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument();
    });
  });

  it('submits a general enquiry successfully and resets the form', async () => {
    const user = userEvent.setup();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Thank you for contacting us!' }),
    } as Response);

    render(<ContactUsPage />);

    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email Address'), 'jane@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Interested in sustainable stays');
    await user.type(screen.getByLabelText('Enquiry'), 'I would love to learn more about eco-friendly housing.');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [endpoint, options] = fetchMock.mock.calls[0];
    expect(endpoint).toBe('/api/contact');
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body as string)).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Interested in sustainable stays',
      message: 'I would love to learn more about eco-friendly housing.',
      type: 'general',
    });

    await waitFor(() => {
      expect(screen.getByText('Thank you for contacting us!')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toHaveValue('');
      expect(screen.getByLabelText('Email Address')).toHaveValue('');
      expect(screen.getByLabelText('Subject')).toHaveValue('');
      expect(screen.getByLabelText('Enquiry')).toHaveValue('');
    });
  });

  it('prefills the newsletter form from query params and handles API errors gracefully', async () => {
    mockUseSearchParams.mockImplementation(() =>
      createSearchParamsMock({ type: 'newsletter', email: 'subscriber@example.com' })
    );

    const user = userEvent.setup();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Rate limit exceeded' }),
    } as Response);

    render(<ContactUsPage />);

    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveValue('subscriber@example.com');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [newsletterEndpoint, newsletterOptions] = fetchMock.mock.calls[0];
    expect(newsletterEndpoint).toBe('/api/newsletter/subscribe');
    expect(newsletterOptions?.method).toBe('POST');
    expect(JSON.parse(newsletterOptions?.body as string)).toEqual({ email: 'subscriber@example.com' });

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toHaveValue('subscriber@example.com');
    });
  });

  it('allows switching between enquiry types with the select control', async () => {
    const user = userEvent.setup();
    render(<ContactUsPage />);

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Newsletter' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    });

    const newsletterEmail = screen.getByLabelText('Email Address');
    await user.clear(newsletterEmail);
    await user.type(newsletterEmail, 'news@example.com');
    expect(newsletterEmail).toHaveValue('news@example.com');

    await user.click(screen.getByRole('option', { name: 'General Enquiry' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      expect(screen.getByLabelText('Enquiry')).toBeInTheDocument();
    });
  });
});
