import i18n from '@/i18n';

type RequestError = {
  code?: string;
  request?: unknown;
  response?: { data?: { message?: unknown } };
};

/**
 * What to tell the user about a failed request: the backend's `{ message }`,
 * or that the server couldn't be reached or took too long, or a generic message.
 */
export const apiErrorMessage = (error: unknown, fallback?: string): string => {
  const failure = error as RequestError | undefined;
  // The server's own message stays as it is; only the app's texts are translated
  const message = failure?.response?.data?.message;
  if (typeof message === 'string' && message.length > 0) return message;

  // A request that got no answer at all
  if (failure?.request && !failure.response) {
    return i18n.t(failure.code === 'ECONNABORTED' ? 'common:errors.timeout' : 'common:errors.unreachable');
  }
  return fallback ?? i18n.t('common:errors.generic');
};
