export const isPrerenderRejection = (error: unknown): boolean => {
  if (!error) return false;
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown; }).message ?? '')
      : '';
  if (message.includes('During prerendering')) return true;
  if (typeof error === 'object' && 'digest' in error) {
    return (error as { digest?: unknown; }).digest === 'HANGING_PROMISE_REJECTION';
  }
  return false;
};
