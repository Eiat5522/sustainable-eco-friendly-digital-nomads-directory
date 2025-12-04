import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { structuredLogger } from '@/lib/logger';
import CommentForm, { resolveCallbackUrl } from '../CommentForm';

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseSession = useSession as unknown as jest.Mock;
const mockSignIn = signIn as unknown as jest.Mock;
const mockUseRouter = useRouter as unknown as jest.Mock;

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    headers: { 'Content-Type': 'application/json' },
  });

describe('resolveCallbackUrl', () => {
  it('returns the current location when available', () => {
    expect(resolveCallbackUrl()).toBe(window.location.href);
  });

  it('falls back to the default login route when href is unavailable', () => {
    expect(resolveCallbackUrl({ href: undefined })).toBe('/auth/login');
  });
});

describe('CommentForm', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    mockUseRouter.mockReturnValue({ refresh: jest.fn() });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const createDeferred = () => {
    let resolve: (value: Response) => void;
    let reject: (reason?: unknown) => void;
    const promise = new Promise<Response>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return {
      promise,
      resolve: resolve!,
      reject: reject!,
    };
  };

  it('renders loading skeleton while session state is loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    render(<CommentForm postId="post-1" />);

    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('prompts unauthenticated users to sign in and forwards the current URL', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    mockSignIn.mockResolvedValue(undefined);

    render(<CommentForm postId="post-1" />);

    const signInButton = await screen.findByRole('button', { name: /sign in to comment/i });
    await userEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(undefined, { callbackUrl: window.location.href });
    });
  });

  it('submits a comment successfully and resets the form', async () => {
    const refreshMock = jest.fn();
    mockUseRouter.mockReturnValue({ refresh: refreshMock });
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      status: 'authenticated',
    });
    fetchMock.mockResolvedValue(jsonResponse({ _id: 'comment-id' }, { status: 200 }));

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    const textarea = screen.getByLabelText('Comment');
    await user.type(textarea, 'This is a wonderful article!');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'This is a wonderful article!', postId: 'post-1' }),
      });
    });

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(textarea).toHaveValue('');
    expect(screen.getByText(/awaits approval/i)).toBeInTheDocument();
  });

  it('clears whitespace-only submissions without calling the API', async () => {
    mockUseRouter.mockReturnValue({ refresh: jest.fn() });
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    const textarea = screen.getByLabelText('Comment');
    await user.type(textarea, '   ');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    await waitFor(() => expect(textarea).toHaveValue(''));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('guards against native submit events with only whitespace content', async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });

    render(<CommentForm postId="post-1" />);

    const textarea = screen.getByLabelText('Comment');
    await userEvent.type(textarea, '   ');

    const form = textarea.closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => expect(textarea).toHaveValue(''));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects to sign in when the API returns 401', async () => {
    const refreshMock = jest.fn();
    mockUseRouter.mockReturnValue({ refresh: refreshMock });
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });
    mockSignIn.mockResolvedValue(undefined);
    fetchMock.mockResolvedValue(
      new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' })
    );

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Comment'), 'Needs auth');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(undefined, { callbackUrl: window.location.href });
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('re-prompts sign-in when the session loses its user identity before submit', async () => {
    mockUseSession.mockReturnValue({ data: { user: {} }, status: 'authenticated' });
    mockSignIn.mockResolvedValue(undefined);

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Comment'), 'Session missing user id');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(undefined, { callbackUrl: window.location.href });
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a permission error when the API responds with 403', async () => {
    mockUseRouter.mockReturnValue({ refresh: jest.fn() });
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' })
    );

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Comment'), 'Hi there');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    expect(
      await screen.findByText('You do not have permission to submit comments.')
    ).toBeInTheDocument();
  });

  it('surfaces API-provided error details on failure', async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'Detailed failure' }, { status: 400, statusText: 'Bad Request' })
    );

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Comment'), 'Issue reproduction');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    expect(await screen.findByText('Detailed failure')).toBeInTheDocument();
  });

  it('uses a fallback message when the API responds without an error field', async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });
    fetchMock.mockResolvedValue(
      jsonResponse(
        { message: 'Server failed' },
        { status: 500, statusText: 'Internal Server Error' }
      )
    );

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Comment'), 'Missing error field');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    expect(await screen.findByText('Failed to submit comment')).toBeInTheDocument();
  });

  it('uses the generic message when the API returns an empty response body', async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });
    fetchMock.mockResolvedValue(
      new Response('', { status: 500, statusText: 'Internal Server Error' })
    );

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Comment'), 'No response body');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    expect(await screen.findByText('Failed to submit comment')).toBeInTheDocument();
  });

  it('normalizes empty API error strings to the default message', async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });
    fetchMock.mockResolvedValue(
      jsonResponse({ error: '   ' }, { status: 500, statusText: 'Internal Server Error' })
    );

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Comment'), 'Empty error string');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    expect(await screen.findByText('Failed to submit comment')).toBeInTheDocument();
  });

  it('displays a fallback error message when the request throws', async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });
    fetchMock.mockRejectedValue(new Error('Network error'));

    try {
      render(<CommentForm postId="post-1" />);

      const user = userEvent.setup();
      await user.type(screen.getByLabelText('Comment'), 'Network issue');
      await user.click(screen.getByRole('button', { name: /submit comment/i }));

      expect(
        await screen.findByText('Failed to submit comment. Please try again.')
      ).toBeInTheDocument();
    } finally {
      jest.clearAllMocks();
    }
  });

  it('ignores duplicate submissions while the first request is pending', async () => {
    const refreshMock = jest.fn();
    mockUseRouter.mockReturnValue({ refresh: refreshMock });
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'slow@example.com' } },
      status: 'authenticated',
    });

    const deferred = createDeferred();
    fetchMock.mockReturnValue(deferred.promise);

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    const textarea = screen.getByLabelText('Comment');
    await user.type(textarea, 'Slow submission in progress');

    const submitButton = screen.getByRole('button', { name: /submit comment/i });
    await user.click(submitButton);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    deferred.resolve(jsonResponse({ _id: 'slow-comment' }, { status: 201, statusText: 'Created' }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('falls back to a generic error message when the API response is not JSON', async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'user-1' } }, status: 'authenticated' });

    fetchMock.mockResolvedValue(
      new Response('Plain failure', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'Content-Type': 'text/plain' },
      })
    );

    render(<CommentForm postId="post-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Comment'), 'Trigger parse failure');
    await user.click(screen.getByRole('button', { name: /submit comment/i }));

    expect(await screen.findByText('Failed to submit comment')).toBeInTheDocument();
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'Failed to submit comment: 502 Bad Gateway',
      undefined,
      { component: 'comments' }
    );
  });
});
