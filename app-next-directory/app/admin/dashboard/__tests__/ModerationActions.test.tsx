import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ModerationActions } from '../ModerationActions';

declare global {
  // eslint-disable-next-line no-var
  var fetch: jest.Mock;
}

describe('ModerationActions', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(<ModerationActions moderationId="mod-1" itemName="Eco Retreat" />);

  it('submits an approve action and shows feedback from the server', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: 'Approved!' }),
    });

    renderComponent();

    await user.click(
      screen.getByRole('button', { name: /Approve Eco Retreat/i })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/moderation',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ moderationId: 'mod-1', action: 'approve', notes: '' }),
      })
    );

    expect(await screen.findByTestId('moderation-feedback-mod-1')).toHaveTextContent(
      'Approved!'
    );
  });

  it('allows moderators to save notes and closes the form afterwards', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: 'Saved' }),
    });

    renderComponent();

    await user.click(screen.getByRole('button', { name: /View notes/i }));
    const textarea = screen.getByRole('textbox', { name: /Moderator notes/i });
    await user.type(textarea, 'Please follow up with the host');

    await user.click(screen.getByRole('button', { name: 'Save note for Eco Retreat' }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/moderation',
      expect.objectContaining({
        body: JSON.stringify({
          moderationId: 'mod-1',
          action: 'saveNote',
          notes: 'Please follow up with the host',
        }),
      })
    );

    expect(await screen.findByTestId('moderation-feedback-mod-1')).toHaveTextContent('Saved');
    expect(
      screen.queryByRole('textbox', { name: /Moderator notes/i })
    ).not.toBeInTheDocument();
  });

  it('sends dismiss actions with existing notes and clears them afterwards', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: 'Dismissed' }),
    });

    renderComponent();

    await user.click(screen.getByRole('button', { name: /View notes/i }));
    const textarea = screen.getByRole('textbox', { name: /Moderator notes/i });
    await user.type(textarea, 'No action needed');

    await user.click(screen.getByRole('button', { name: 'Save note and dismiss Eco Retreat' }));

    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/admin/moderation',
      expect.objectContaining({
        body: JSON.stringify({ moderationId: 'mod-1', action: 'dismiss', notes: 'No action needed' }),
      })
    );

    expect(await screen.findByTestId('moderation-feedback-mod-1')).toHaveTextContent(
      'Dismissed'
    );
    expect(
      screen.queryByRole('textbox', { name: /Moderator notes/i })
    ).not.toBeInTheDocument();
  });

  it('shows error feedback when the action request fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Network failure' }),
    });

    renderComponent();

    await user.click(screen.getByRole('button', { name: /Approve Eco Retreat/i }));

    expect(await screen.findByTestId('moderation-feedback-mod-1')).toHaveTextContent(
      'Network failure'
    );
  });
});
