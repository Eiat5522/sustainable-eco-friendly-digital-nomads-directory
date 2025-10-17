import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenueListingManagement } from '../VenueListingManagement';

type FetchMock = jest.MockedFunction<typeof fetch>;

describe('VenueListingManagement', () => {
  const fetchMock = jest.fn() as FetchMock;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading indicator before data resolves and displays add listing link afterwards', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ listings: [] }),
    } as Response);

    render(<VenueListingManagement />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(await screen.findByRole('link', { name: /add new listing/i })).toHaveAttribute(
      'href',
      '/dashboard/listings/new'
    );
  });

  it('renders listings from a successful fetch response while filtering invalid entries', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        listings: [
          { _id: '1', name: 'Eco Hub', city: 'Lisbon', status: 'published' },
          null,
          { _id: '2', name: 'Incomplete' },
          'string',
        ],
      }),
    } as Response);

    render(<VenueListingManagement />);

    const row = await screen.findByRole('row', { name: /eco hub lisbon published/i });
    const cells = within(row).getAllByRole('cell');

    expect(cells[0]).toHaveTextContent('Eco Hub');
    expect(cells[1]).toHaveTextContent('Lisbon');
    expect(cells[2]).toHaveTextContent('published');
    expect(screen.getAllByRole('link', { name: /edit/i })[0]).toHaveAttribute('href', '/dashboard/listings/edit/1');
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
  });

  it('shows an error message when the fetch call rejects with a non-error value', async () => {
    fetchMock.mockRejectedValueOnce('network down');

    render(<VenueListingManagement />);

    expect(await screen.findByText('Error: Failed to fetch listings')).toBeInTheDocument();
  });

  it('shows an error message when the initial fetch response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'not used' }),
    } as Response);

    render(<VenueListingManagement />);

    expect(await screen.findByText('Error: Failed to fetch listings')).toBeInTheDocument();
  });

  it('treats non-array listing payloads as empty results', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ listings: { id: 'not-array' } }),
    } as Response);

    render(<VenueListingManagement />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('row', { name: /not-array/i })).not.toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /add new listing/i })).toBeInTheDocument();
  });

  it('confirms before deleting a listing and removes it when the request succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          listings: [
            { _id: '1', name: 'Nomad Base', city: 'Porto', status: 'draft' },
            { _id: '2', name: 'Solar Workspace', city: 'Berlin', status: 'published' },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<VenueListingManagement />);

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });

    await userEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this listing?');
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith('/api/listings/manage/1', { method: 'DELETE' })
    );
    await waitFor(() => expect(screen.queryByText('Nomad Base')).not.toBeInTheDocument());
    expect(screen.getByText('Solar Workspace')).toBeInTheDocument();
  });

  it('does nothing when delete confirmation is cancelled', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        listings: [{ _id: '1', name: 'Eco Retreat', city: 'Lisbon', status: 'draft' }],
      }),
    } as Response);

    jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<VenueListingManagement />);

    const deleteButton = await screen.findByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Eco Retreat')).toBeInTheDocument();
  });

  it('shows an error message when deleting a listing fails with an Error', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          listings: [{ _id: '1', name: 'Ocean Office', city: 'Nice', status: 'published' }],
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<VenueListingManagement />);

    const deleteButton = await screen.findByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith('/api/listings/manage/1', { method: 'DELETE' })
    );
    expect(await screen.findByText('Error: Failed to delete listing')).toBeInTheDocument();
  });

  it('falls back to a default error message when deletion rejects with a non-error value', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          listings: [{ _id: '1', name: 'Forest Hub', city: 'Tallinn', status: 'draft' }],
        }),
      } as Response)
      .mockRejectedValueOnce('nope');

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<VenueListingManagement />);

    const deleteButton = await screen.findByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Error: Failed to delete listing')).toBeInTheDocument();
  });
});
