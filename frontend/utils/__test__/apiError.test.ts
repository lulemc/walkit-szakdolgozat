import { apiErrorMessage } from '../apiError';

describe('apiErrorMessage', () => {
  it("uses the server's message", () => {
    expect(apiErrorMessage({ response: { data: { message: 'Route not found' } } })).toBe('Route not found');
  });

  it("says when WalkIt can't be reached", () => {
    expect(apiErrorMessage({ request: {}, message: 'Network Error' })).toBe(
      "Can't reach WalkIt. Check your internet connection and try again.",
    );
  });

  it('says when the server took too long', () => {
    expect(apiErrorMessage({ code: 'ECONNABORTED', request: {}, message: 'timeout of 15000ms exceeded' })).toBe(
      'WalkIt is taking too long to answer. Please try again.',
    );
  });

  it('falls back to the given message, or a generic one', () => {
    expect(apiErrorMessage({ response: { status: 500, data: {} } }, 'Failed to save')).toBe('Failed to save');
    expect(apiErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});
