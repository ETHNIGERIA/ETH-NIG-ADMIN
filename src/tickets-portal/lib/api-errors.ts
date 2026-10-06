export function isNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /not found/i.test(message) && !/timed out/i.test(message);
}

export function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; code?: string; cause?: { code?: string; name?: string } };
  if (err.name === 'AbortError' || err.name === 'TimeoutError') return true;
  if (err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') return true;
  const message = error instanceof Error ? error.message : '';
  return /timeout/i.test(message);
}

export function errorMessage(error: unknown, fallback: string): string {
  if (isTimeoutError(error)) return 'Tickets API timed out. Try again.';
  return error instanceof Error && error.message ? error.message : fallback;
}
