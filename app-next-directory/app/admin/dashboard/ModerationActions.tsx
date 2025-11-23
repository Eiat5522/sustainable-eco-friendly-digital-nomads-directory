'use client';

import { type FormEvent, useState, useTransition } from 'react';
import type { ModerationAction } from '@/lib/admin/analytics';
import {
  extractErrorMessage,
  fetchWithTimeout,
  getDefaultTimeout,
  RequestTimeoutError,
} from '@/lib/http/request';

type ModerationActionsProps = {
  moderationId: string;
  itemName: string;
};

type ActionType = ModerationAction;

async function postModerationAction({
  moderationId,
  action,
  notes,
}: {
  moderationId: string;
  action: ActionType;
  notes?: string;
}) {
  const response = await fetchWithTimeout(
    '/api/admin/moderation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moderationId, action, notes }),
    },
    getDefaultTimeout()
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error ?? 'Failed to perform moderation action');
  }

  return response.json();
}

export function ModerationActions({ moderationId, itemName }: ModerationActionsProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = (action: ActionType, customNotes?: string) => {
    startTransition(async () => {
      setFeedback(null);
      try {
        const payloadNotes = customNotes ?? notes;
        const result = await postModerationAction({ moderationId, action, notes: payloadNotes });
        setFeedback(result?.message ?? `Action "${action}" applied`);
        setNotes('');
        if (action === 'dismiss') {
          setNotesOpen(false);
        }
        if (action === 'saveNote') {
          setNotesOpen(false);
        }
      } catch (error) {
        const message =
          error instanceof RequestTimeoutError
            ? 'Moderation action timed out. Please try again.'
            : extractErrorMessage(error, 'Action failed');
        setFeedback(message);
      }
    });
  };

  const handleNotesSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runAction('saveNote', notes);
  };

  return (
    <div className="flex flex-col space-y-2" data-testid={`moderation-actions-${moderationId}`}>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          disabled={isPending}
          aria-disabled={isPending}
          aria-label={`View notes for ${itemName}`}
          className="text-sm text-gray-700 hover:text-gray-900 disabled:text-gray-400"
          onClick={() => setNotesOpen(open => !open)}
        >
          Notes
        </button>
        <button
          type="button"
          disabled={isPending}
          aria-disabled={isPending}
          aria-label={`Approve ${itemName}`}
          className="text-sm text-emerald-600 hover:text-emerald-700 disabled:text-emerald-300"
          onClick={() => runAction('approve')}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isPending}
          aria-disabled={isPending}
          aria-label={`Restrict ${itemName}`}
          className="text-sm text-rose-600 hover:text-rose-700 disabled:text-rose-300"
          onClick={() => runAction('restrict')}
        >
          Restrict
        </button>
      </div>
      {notesOpen && (
        <form
          onSubmit={handleNotesSubmit}
          className="flex flex-col space-y-2 text-xs text-gray-600"
        >
          <label htmlFor={`moderation-notes-${moderationId}`} className="font-medium text-gray-700">
            Moderator notes
          </label>
          <textarea
            id={`moderation-notes-${moderationId}`}
            value={notes}
            onChange={event => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded border border-gray-200 p-2 focus:outline-none focus:ring focus:ring-emerald-200"
            placeholder="Document context or next steps"
          />
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={isPending}
              aria-label={`Save note for ${itemName}`}
              className="inline-flex items-center rounded bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-300"
            >
              Save note
            </button>
            <button
              type="button"
              disabled={isPending}
              aria-label={`Save note and dismiss ${itemName}`}
              className="inline-flex items-center rounded bg-rose-600 px-3 py-1 font-medium text-white hover:bg-rose-700 disabled:bg-rose-300"
              onClick={() => runAction('dismiss', notes)}
            >
              Save & Dismiss
            </button>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => {
                setNotesOpen(false);
                setNotes('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {feedback && (
        <output
          className="text-xs text-gray-500"
          data-testid={`moderation-feedback-${moderationId}`}
        >
          {feedback}
        </output>
      )}
    </div>
  );
}
