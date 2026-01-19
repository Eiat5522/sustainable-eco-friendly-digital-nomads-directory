import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { structuredLogger } from '@/lib/logger';
import type { ListingFormValues } from '../VenueListingForm';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/components/ui/neo-button', () => ({
  __esModule: true,
  NeoButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@hookform/resolvers/zod', () => {
  const actual = jest.requireActual('@hookform/resolvers/zod');

  return {
    ...actual,
    zodResolver: (schema: unknown, ...rest: unknown[]) => {
      const baseResolver = actual.zodResolver(schema as any, ...rest);
      return async (values: any, context: any, options: any) => {
        const result = await baseResolver(values, context, options);
        return {
          ...result,
          values: { ...values, ...result.values },
        };
      };
    },
  };
});

jest.mock('@/components/ui/select', () => {
  const React = require('react') as typeof import('react');

  const SelectItemComponent = ({ value, children }: any) => (
    <option value={value}>{children}</option>
  );

  const collectOptions = (children: React.ReactNode): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    React.Children.forEach(children, child => {
      if (!child) return;
      if (typeof child === 'string' || typeof child === 'number') {
        result.push(child);
        return;
      }
      if (React.isValidElement(child)) {
        if (child.type === SelectItemComponent) {
          result.push(
            <option key={child.props.value ?? child.props.children} value={child.props.value}>
              {child.props.children}
            </option>
          );
          return;
        }
        if (child.props?.children) {
          result.push(...collectOptions(child.props.children));
        }
      }
    });
    return result;
  };

  const Select = ({ defaultValue, value, onValueChange, children }: any) => {
    const [current, setCurrent] = React.useState(value ?? defaultValue ?? '');

    React.useEffect(() => {
      if (value !== undefined) {
        setCurrent(value);
      }
    }, [value]);

    const options = collectOptions(children);

    return (
      <select
        value={current}
        onChange={event => {
          setCurrent(event.target.value);
          onValueChange?.(event.target.value);
        }}
      >
        {options}
      </select>
    );
  };

  const SelectTrigger = ({ children }: any) => <>{children}</>;
  const SelectContent = ({ children }: any) => <>{children}</>;
  const SelectValue = () => null;

  return {
    __esModule: true,
    Select,
    SelectTrigger,
    SelectContent,
    SelectValue,
    SelectItem: SelectItemComponent,
  };
});

const { VenueListingForm } = require('../VenueListingForm') as typeof import('../VenueListingForm');

const originalFetch = global.fetch;

afterAll(() => {
  global.fetch = originalFetch;
});

describe('VenueListingForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('normalizes API responses into selectable options', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/cities') {
        return {
          ok: true,
          json: async () => ({
            cities: [{ _id: 'city-1', name: 'Bangkok' }, { _id: 'city-2' }, 'ignored'],
          }),
        } as Response;
      }
      if (url === '/api/eco-tags') {
        return {
          ok: true,
          json: async () => ({
            ecoTags: [{ _id: 'eco-1', name: 'Eco Tag Valid' }, { _id: 'eco-2' }, 'skip-tag'],
          }),
        } as Response;
      }
      if (url === '/api/digital-nomad-features') {
        return {
          ok: true,
          json: async () => ({
            features: [
              { _id: 'feature-1', name: 'Feature Valid' },
              { name: 'Missing Id' },
              'skip-feature',
            ],
          }),
        } as Response;
      }
      if (url === '/api/amenities') {
        return {
          ok: true,
          json: async () => ({
            amenities: [{ _id: 'amenity-1', name: 'Amenity Valid' }, null, { _id: 'amenity-2' }],
          }),
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const view = render(
      <VenueListingForm
        listing={
          {
            name: 'Prefilled Venue',
            city: 'city-1',
            type: 'coworking',
            ecoFocusTags: ['eco-1'],
            digitalNomadFeatures: ['feature-1'],
            amenities: ['amenity-1'],
          } satisfies Partial<ListingFormValues>
        }
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

    const cityLabel = screen.getByText('City');
    const cityContainer = cityLabel.closest('div') as HTMLElement;
    const citySelect = within(cityContainer).getByRole('combobox') as HTMLSelectElement;
    await waitFor(() => expect(citySelect).toHaveTextContent('Bangkok'));
    expect(citySelect).not.toHaveTextContent('ignored');

    await waitFor(() => {
      expect(screen.getByText('Eco Tag Valid')).toBeInTheDocument();
      expect(screen.queryByText('skip-tag')).not.toBeInTheDocument();
      expect(screen.getByText('Feature Valid')).toBeInTheDocument();
      expect(screen.queryByText('skip-feature')).not.toBeInTheDocument();
      expect(screen.getByText('Amenity Valid')).toBeInTheDocument();
      expect(screen.queryByText('amenity-2')).not.toBeInTheDocument();
    });

    const toggleCheckbox = (labelText: string, sequence: boolean[]) => {
      const label = screen.getByText(labelText);
      const container = label.closest('div') as HTMLElement;
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      sequence.forEach(checked => {
        fireEvent.click(checkbox, { target: { checked } });
      });
    };

    toggleCheckbox('Eco Tag Valid', [false, true]);
    toggleCheckbox('Feature Valid', [false, true]);
    toggleCheckbox('Amenity Valid', [false, true]);

    view.unmount();
  });

  it('uploads image assets and forwards normalized payload to onSave', async () => {
    let uploadCall = 0;
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/upload') {
        uploadCall += 1;
        const assetId = uploadCall === 1 ? 'upload-primary' : `upload-gallery-${uploadCall - 1}`;
        return {
          ok: true,
          json: async () => ({ asset: { _id: assetId } }),
        } as Response;
      }
      if (url === '/api/cities') {
        return {
          ok: true,
          json: async () => ({ cities: [{ _id: 'city-1', name: 'Bangkok' }] }),
        } as Response;
      }
      if (url === '/api/eco-tags') {
        return { ok: true, json: async () => ({ ecoTags: [] }) } as Response;
      }
      if (url === '/api/digital-nomad-features') {
        return { ok: true, json: async () => ({ features: [] }) } as Response;
      }
      if (url === '/api/amenities') {
        return { ok: true, json: async () => ({ amenities: [] }) } as Response;
      }
      return { json: async () => ({}) } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const onSave = jest.fn();

    const { container } = render(
      <VenueListingForm
        listing={
          {
            name: 'Existing Venue',
            city: 'city-1',
            type: 'coworking',
          } satisfies Partial<ListingFormValues>
        }
        onSave={onSave}
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

    const fileInputs = container.querySelectorAll('input[type="file"]');
    const primaryInput = fileInputs[0] as HTMLInputElement;
    const galleryInput = fileInputs[1] as HTMLInputElement;

    const primaryFile = new File(['primary'], 'primary.png', { type: 'image/png' });
    const user = userEvent.setup();
    await user.upload(primaryInput, primaryFile);
    expect(primaryInput.files?.[0]).toBeInstanceOf(File);

    const galleryFiles = [
      new File(['gallery-1'], 'gallery-1.png', { type: 'image/png' }),
      new File(['gallery-2'], 'gallery-2.png', { type: 'image/png' }),
    ];
    await user.upload(galleryInput, galleryFiles);
    expect(galleryInput.files?.length).toBe(2);

    const emailInput = screen.getByPlaceholderText('contact@venue.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'owner@example.com' } });

    const websiteInput = screen.getByPlaceholderText('https://venue.com') as HTMLInputElement;
    fireEvent.change(websiteInput, { target: { value: 'https://venue.example.com' } });

    const saveButton = screen.getByRole('button', { name: 'Save Listing' });
    fireEvent.click(saveButton);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const calledUrls = fetchMock.mock.calls.map(([request]) =>
      typeof request === 'string' ? request : request.toString()
    );
    const uploadCalls = calledUrls.filter(url => url === '/api/upload');
    expect(uploadCalls).toHaveLength(3);

    const payload = onSave.mock.calls[0][0];
    expect(payload.primaryImage).toEqual({
      _type: 'image',
      asset: { _type: 'reference', _ref: 'upload-primary' },
    });
    expect(payload.galleryImages).toEqual([
      {
        _type: 'image',
        _key: 'upload-gallery-1',
        asset: { _type: 'reference', _ref: 'upload-gallery-1' },
      },
      {
        _type: 'image',
        _key: 'upload-gallery-2',
        asset: { _type: 'reference', _ref: 'upload-gallery-2' },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/upload',
      expect.objectContaining({ method: 'POST' })
    );
  });

const createMockResponse = (data: unknown): Response => ({
  ok: true,
  json: async () => data,
} as Response);

// Then use throughout:
if (url === '/api/cities') {
  return createMockResponse({ cities: [{ _id: 'city-1', name: 'Bangkok' }] });
}

  it('submits without image selections and keeps image fields undefined', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/cities') {
        return { json: async () => ({ cities: [{ _id: 'city-1', name: 'Bangkok' }] }) } as Response;
      }
      if (url === '/api/eco-tags') {
        return { json: async () => ({ ecoTags: [] }) } as Response;
      }
      if (url === '/api/digital-nomad-features') {
        return { json: async () => ({ features: [] }) } as Response;
      }
      if (url === '/api/amenities') {
        return { json: async () => ({ amenities: [] }) } as Response;
      }
      return { json: async () => ({}) } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const onSave = jest.fn();

    const { container } = render(
      <VenueListingForm
        listing={
          {
            name: 'No Images Venue',
            city: 'city-1',
            type: 'cafe',
          } satisfies Partial<ListingFormValues>
        }
        onSave={onSave}
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

    const [primaryInput, galleryInput] = container.querySelectorAll(
      'input[type="file"]'
    ) as NodeListOf<HTMLInputElement>;
    fireEvent.change(primaryInput, { target: { files: null } });
    fireEvent.change(galleryInput, { target: { files: null } });

    const emailInput = screen.getByPlaceholderText('contact@venue.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'owner@example.com' } });
    const websiteInput = screen.getByPlaceholderText('https://venue.com') as HTMLInputElement;
    fireEvent.change(websiteInput, { target: { value: 'https://venue.example.com' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Listing' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const uploadCalls = fetchMock.mock.calls.filter(
      ([request]) => (typeof request === 'string' ? request : request.toString()) === '/api/upload'
    );
    expect(uploadCalls).toHaveLength(0);

    const payload = onSave.mock.calls[0][0];
    expect(payload.primaryImage).toBeUndefined();
    expect(payload.galleryImages).toBeUndefined();
  });

  it('processes pre-populated gallery image arrays without additional user input', async () => {
    let uploadIndex = 0;
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/upload') {
        uploadIndex += 1;
        return { json: async () => ({ asset: { _id: `preloaded-${uploadIndex}` } }) } as Response;
      }
      if (url === '/api/cities') {
        return { json: async () => ({ cities: [{ _id: 'city-1', name: 'Bangkok' }] }) } as Response;
      }
      if (url === '/api/eco-tags') {
        return { json: async () => ({ ecoTags: [] }) } as Response;
      }
      if (url === '/api/digital-nomad-features') {
        return { json: async () => ({ features: [] }) } as Response;
      }
      if (url === '/api/amenities') {
        return { json: async () => ({ amenities: [] }) } as Response;
      }
      return { json: async () => ({}) } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const onSave = jest.fn();
    const galleryArray = [
      new File(['gallery-a'], 'gallery-a.png', { type: 'image/png' }),
      new File(['gallery-b'], 'gallery-b.png', { type: 'image/png' }),
    ];

    render(
      <VenueListingForm
        listing={
          {
            name: 'Gallery Prefill',
            city: 'city-1',
            type: 'coworking',
            contactEmail: 'owner@example.com',
            website: 'https://venue.example.com',
            galleryImages: galleryArray,
          } as unknown as Partial<ListingFormValues>
        }
        onSave={onSave}
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

    fireEvent.click(screen.getByRole('button', { name: 'Save Listing' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const uploadCalls = fetchMock.mock.calls.filter(
      ([request]) => (typeof request === 'string' ? request : request.toString()) === '/api/upload'
    );
    expect(uploadCalls).toHaveLength(2);

    const payload = onSave.mock.calls[0][0];
    expect(payload.primaryImage).toBeUndefined();
    expect(payload.galleryImages).toEqual([
      { _type: 'image', _key: 'preloaded-1', asset: { _type: 'reference', _ref: 'preloaded-1' } },
      { _type: 'image', _key: 'preloaded-2', asset: { _type: 'reference', _ref: 'preloaded-2' } },
    ]);
  });

  it('renders configuration sections for each listing type', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/cities') {
        return { json: async () => ({ cities: [{ _id: 'city-1', name: 'Bangkok' }] }) } as Response;
      }
      if (url === '/api/eco-tags') {
        return { json: async () => ({ ecoTags: [] }) } as Response;
      }
      if (url === '/api/digital-nomad-features') {
        return { json: async () => ({ features: [] }) } as Response;
      }
      if (url === '/api/amenities') {
        return { json: async () => ({ amenities: [] }) } as Response;
      }
      return { json: async () => ({}) } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { container } = render(<VenueListingForm />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

    const typeSelect = container.querySelector('select') as HTMLSelectElement;
    expect(screen.getByText('Coworking Details')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Pricing Plan' }));
    const planTypeInput = container.querySelector(
      'input[name="coworkingDetails.pricingPlans.0.type"]'
    ) as HTMLInputElement;
    const planPriceInput = container.querySelector(
      'input[name="coworkingDetails.pricingPlans.0.price"]'
    ) as HTMLInputElement;
    const planPeriodInput = container.querySelector(
      'input[name="coworkingDetails.pricingPlans.0.period"]'
    ) as HTMLInputElement;
    fireEvent.change(planTypeInput, { target: { value: 'Monthly' } });
    fireEvent.change(planPriceInput, { target: { value: '1200' } });
    fireEvent.change(planPeriodInput, { target: { value: 'month' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    fireEvent.change(typeSelect, { target: { value: 'accommodation' } });
    const accommodationSection = await screen.findByText('Accommodation Details');
    const accommodationContainer = accommodationSection.closest('div') as HTMLElement;
    const accommodationTypeSelect = accommodationContainer.querySelector(
      'select'
    ) as HTMLSelectElement;
    fireEvent.change(accommodationTypeSelect, { target: { value: 'hotel' } });
    const minStayInput = accommodationContainer.querySelector(
      'input[name="accommodationDetails.minimumStay"]'
    ) as HTMLInputElement;
    fireEvent.change(minStayInput, { target: { value: '3' } });

    fireEvent.change(typeSelect, { target: { value: 'activities' } });
    const activitiesSection = await screen.findByText('Activities Details');
    const getCheckboxWithin = (root: HTMLElement, text: string) => {
      const label = within(root).getByText(text);
      const parent = label.closest('div') as HTMLElement;
      return parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
    };
    const zeroWasteCheckbox = getCheckboxWithin(
      activitiesSection.closest('div') as HTMLElement,
      'Zero Waste'
    );
    fireEvent.click(zeroWasteCheckbox, { target: { checked: true } });
    fireEvent.click(zeroWasteCheckbox, { target: { checked: false } });
    const englishCheckbox = getCheckboxWithin(
      activitiesSection.closest('div') as HTMLElement,
      'English'
    );
    fireEvent.click(englishCheckbox, { target: { checked: true } });
    fireEvent.click(englishCheckbox, { target: { checked: false } });

    fireEvent.change(typeSelect, { target: { value: 'cafe' } });
    const cafeSection = await screen.findByText('Cafe Details');
    const cafeContainer = cafeSection.closest('div') as HTMLElement;
    const priceIndicationSelect = cafeContainer.querySelector('select') as HTMLSelectElement;
    fireEvent.change(priceIndicationSelect, { target: { value: '$$' } });
    const specialtyCheckbox = getCheckboxWithin(cafeContainer, 'Specialty Coffee Beans');
    fireEvent.click(specialtyCheckbox, { target: { checked: true } });
    fireEvent.click(specialtyCheckbox, { target: { checked: false } });
    const workspaceAmenityCheckbox = getCheckboxWithin(cafeContainer, 'Fast WiFi');
    fireEvent.click(workspaceAmenityCheckbox, { target: { checked: true } });
    fireEvent.click(workspaceAmenityCheckbox, { target: { checked: false } });

    fireEvent.change(typeSelect, { target: { value: 'restaurant' } });
    const restaurantSection = await screen.findByText('Restaurant Details');
    const restaurantContainer = restaurantSection.closest('div') as HTMLElement;
    const priceRangeSelect = restaurantContainer.querySelector('select') as HTMLSelectElement;
    fireEvent.change(priceRangeSelect, { target: { value: 'moderate' } });
    const cuisineCheckbox = getCheckboxWithin(restaurantContainer, 'Thai');
    fireEvent.click(cuisineCheckbox, { target: { checked: true } });
    fireEvent.click(cuisineCheckbox, { target: { checked: false } });
    const sustainabilityCheckbox = getCheckboxWithin(restaurantContainer, 'Local Sourcing');
    fireEvent.click(sustainabilityCheckbox, { target: { checked: true } });
    fireEvent.click(sustainabilityCheckbox, { target: { checked: false } });
    const dietaryCheckbox = getCheckboxWithin(restaurantContainer, 'Vegan');
    fireEvent.click(dietaryCheckbox, { target: { checked: true } });
    fireEvent.click(dietaryCheckbox, { target: { checked: false } });
    const seatingCheckbox = getCheckboxWithin(restaurantContainer, 'Bar Seating');
    fireEvent.click(seatingCheckbox, { target: { checked: true } });
    fireEvent.click(seatingCheckbox, { target: { checked: false } });
    const wifiCheckbox = getCheckboxWithin(restaurantContainer, 'WiFi');
    fireEvent.click(wifiCheckbox, { target: { checked: true } });
    fireEvent.click(wifiCheckbox, { target: { checked: false } });
  });

  it('indicates saving state on the submit button', async () => {
    const fetchMock = jest.fn(async () => ({ json: async () => ({}) }) as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <VenueListingForm
        saving
        listing={
          {
            name: 'Saving Venue',
            city: 'city-1',
            type: 'cafe',
          } satisfies Partial<ListingFormValues>
        }
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

    const button = screen.getByRole('button', { name: 'Saving...' });
    expect(button).toBeDisabled();
  });

  it('logs an error when an upload request fails', async () => {
    const uploadError = new Error('upload-failed');
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/upload') {
        throw uploadError;
      }
      if (url === '/api/cities') {
        return {
          ok: true,
          json: async () => ({ cities: [{ _id: 'city-1', name: 'Bangkok' }] }),
        } as Response;
      }
      if (url === '/api/eco-tags') {
        return { ok: true, json: async () => ({ ecoTags: [] }) } as Response;
      }
      if (url === '/api/digital-nomad-features') {
        return { ok: true, json: async () => ({ features: [] }) } as Response;
      }
      if (url === '/api/amenities') {
        return { ok: true, json: async () => ({ amenities: [] }) } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const loggerError = jest.spyOn(structuredLogger, 'error').mockImplementation(() => {});
    const onSave = jest.fn();
    const user = userEvent.setup();

    const { container } = render(
      <VenueListingForm
        listing={
          {
            name: 'Venue Error',
            city: 'city-1',
            type: 'coworking',
          } satisfies Partial<ListingFormValues>
        }
        onSave={onSave}
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

    const [primaryInput] = container.querySelectorAll(
      'input[type="file"]'
    ) as NodeListOf<HTMLInputElement>;
    await user.upload(primaryInput, new File(['primary'], 'primary.png', { type: 'image/png' }));

    const emailInput = screen.getByPlaceholderText('contact@venue.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'owner@example.com' } });
    const websiteInput = screen.getByPlaceholderText('https://venue.com') as HTMLInputElement;
    fireEvent.change(websiteInput, { target: { value: 'https://example.com' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Listing' }));

    await waitFor(() =>
      expect(loggerError).toHaveBeenCalledWith('Failed to save listing', uploadError, {
        component: 'VenueListingForm',
      })
    );
    expect(onSave).not.toHaveBeenCalled();

    loggerError.mockRestore();
  });
});
