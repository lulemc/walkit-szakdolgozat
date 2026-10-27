/**
 * A random UUID v4, e.g. for Google Places session tokens: one token covers
 * the searches and the place picked at the end, which Google bills as one.
 * Not for anything secret; Math.random is enough here.
 */
export const newSessionToken = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    // The variant digit is 8, 9, a or b
    return (char === 'x' ? random : (random % 4) + 8).toString(16);
  });
