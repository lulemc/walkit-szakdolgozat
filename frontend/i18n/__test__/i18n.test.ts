import { getLocales } from 'expo-localization';
import i18n, { deviceLanguage, resources } from '..';

jest.mock('expo-localization', () => ({ getLocales: jest.fn(() => [{ languageCode: 'en' }]) }));

const phoneLanguages = (...codes: (string | null)[]) =>
  (getLocales as jest.Mock).mockReturnValue(codes.map((languageCode) => ({ languageCode })));

// Every text as "namespace:path.to.key" -> text
const flatten = (tree: object, prefix = ''): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? { ...all, [path]: value } : { ...all, ...flatten(value, path) };
  }, {});

const placeholders = (text: string) => (text.match(/{{\s*\w+\s*}}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort();

describe('deviceLanguage', () => {
  it('uses Hungarian on a Hungarian phone', () => {
    phoneLanguages('hu');
    expect(deviceLanguage()).toBe('hu');
  });

  it('uses the first of the phone languages that the app has', () => {
    phoneLanguages('de', null, 'hu', 'en');
    expect(deviceLanguage()).toBe('hu');
  });

  it('falls back to English', () => {
    phoneLanguages('de');
    expect(deviceLanguage()).toBe('en');
  });

  it('falls back to English when the phone languages cannot be read', () => {
    (getLocales as jest.Mock).mockImplementation(() => {
      throw new Error('no native module');
    });
    expect(deviceLanguage()).toBe('en');
  });
});

describe('translations', () => {
  const english = flatten(resources.en);
  const hungarian = flatten(resources.hu);

  it('has a Hungarian text for every English one, and nothing extra', () => {
    expect(Object.keys(hungarian).sort()).toEqual(Object.keys(english).sort());
  });

  it.each(Object.keys(english))('%s keeps the same {{placeholders}} in Hungarian', (key) => {
    expect(placeholders(hungarian[key] ?? '')).toEqual(placeholders(english[key]));
  });

  it('runs the tests in English', () => {
    expect(i18n.language).toBe('en');
    expect(i18n.t('common:languageName')).toBe('English');
    expect(i18n.t('common:languageName', { lng: 'hu' })).toBe('Magyar');
  });
});
