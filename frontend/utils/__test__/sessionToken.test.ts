import { newSessionToken } from '../sessionToken';

describe('newSessionToken', () => {
  it('makes UUID v4 tokens, as Google recommends for session tokens', () => {
    expect(newSessionToken()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('makes a different token each time', () => {
    const tokens = new Set(Array.from({ length: 50 }, newSessionToken));

    expect(tokens.size).toBe(50);
  });
});
