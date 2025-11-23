import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestTimeoutError } from '@/lib/http/request';
import { ModerationActions } from '../ModerationActions';

describe('ModerationActions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockRestore?.();
    global.fetch = originalFetch;
  });

  const mockFetchSuccess = (message = 'ok') => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message }),
    });
  };

  it('submits approve action and renders feedback', async () => {
    mockFetchSuccess('Moderation complete');

    render(<ModerationActions moderationId="mod-1" itemName="Listing A" />);
    const user = userEvent.setup();

    const approveButton = await screen.findByRole('button', { name: /approve listing a/i });
    await user.click(approveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/moderation',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ moderationId: 'mod-1', action: 'approve', notes: '' }),
        })
      );
    });

    expect(await screen.findByTestId('moderation-feedback-mod-1')).toHaveTextContent(
      'Moderation complete'
    );
  });

  it('toggles notes editor and saves a note', async () => {
    mockFetchSuccess('Note saved');

    render(<ModerationActions moderationId="mod-2" itemName="Listing B" />);
    const user = userEvent.setup();

    const notesToggle = await screen.findByRole('button', { name: /view notes for listing b/i });
    await user.click(notesToggle);
    await user.type(await screen.findByLabelText(/moderator notes/i), 'Needs review');
    await user.click(screen.getByRole('button', { name: /save note for listing b/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/moderation',
        expect.objectContaining({
          body: JSON.stringify({
            moderationId: 'mod-2',
            action: 'saveNote',
            notes: 'Needs review',
          }),
        })
      );
    });

    expect(await screen.findByTestId('moderation-feedback-mod-2')).toHaveTextContent('Note saved');
  });

  it('displays error feedback when the request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Request failed' }),
    });

    render(<ModerationActions moderationId="mod-3" itemName="Listing C" />);
    const user = userEvent.setup();

    const restrictButton = await screen.findByRole('button', { name: /restrict listing c/i });
    await user.click(restrictButton);

    expect(await screen.findByTestId('moderation-feedback-mod-3')).toHaveTextContent(
      'Request failed'
    );
  });

  it('handles network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));

    render(<ModerationActions moderationId="mod-4" itemName="Listing D" />);
    const user = userEvent.setup();

    const approveButton = await screen.findByRole('button', { name: /approve listing d/i });
    await user.click(approveButton);

    expect(await screen.findByTestId('moderation-feedback-mod-4')).toHaveTextContent(
      'network down'
    );
  });

  it('surfaces timeout feedback when moderation request times out', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new RequestTimeoutError('Request to /api/admin/moderation timed out')
    );

    render(<ModerationActions moderationId="mod-5" itemName="Listing E" />);
    const user = userEvent.setup();

    const approveButton = await screen.findByRole('button', { name: /approve listing e/i });
    await user.click(approveButton);

    expect(await screen.findByTestId('moderation-feedback-mod-5')).toHaveTextContent(
      'Moderation action timed out. Please try again.'
    );
  });
});
