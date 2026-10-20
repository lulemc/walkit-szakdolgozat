const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

/** The backend's `{ message }` from a failed request, or a generic message */
export const apiErrorMessage = (error: unknown, fallback = FALLBACK_MESSAGE): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === 'string' && message.length > 0 ? message : fallback;
};
