const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const UNREACHABLE_MESSAGE = "Can't reach WalkIt. Check your internet connection and try again.";
const TIMEOUT_MESSAGE = 'WalkIt is taking too long to answer. Please try again.';

type RequestError = {
  code?: string;
  request?: unknown;
  response?: { data?: { message?: unknown } };
};

/**
 * What to tell the user about a failed request: the backend's `{ message }`,
 * or that the server couldn't be reached or took too long, or a generic message.
 */
export const apiErrorMessage = (error: unknown, fallback = FALLBACK_MESSAGE): string => {
  const failure = error as RequestError | undefined;
  const message = failure?.response?.data?.message;
  if (typeof message === 'string' && message.length > 0) return message;

  // A request that got no answer at all
  if (failure?.request && !failure.response) {
    return failure.code === 'ECONNABORTED' ? TIMEOUT_MESSAGE : UNREACHABLE_MESSAGE;
  }
  return fallback;
};
