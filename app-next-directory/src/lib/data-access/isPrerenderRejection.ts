export const isPrerenderRejection = (error: unknown): boolean => {
  if (!error) return false;
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown; }).message ?? '')
      : '';
  if (message.includes('During prerendering')) return true;
  if (typeof error === 'object' && 'digest' in error) {
    const digest = (error as { digest?: unknown }).digest;
    return digest === 'HANGING_PROMISE_REJECTION' || digest === 'DYNAMIC_SERVER_USAGE';
  }
  return false;
};
