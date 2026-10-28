import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import i18n from '@/i18n';
import {
  LANGUAGE_PREFERENCE_KEY,
  LanguagePreferenceProvider,
  useLanguagePreference,
} from '../LanguagePreferenceProvider';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'hu' }] }));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguagePreferenceProvider>{children}</LanguagePreferenceProvider>
);

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('en');
});

afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('LanguagePreferenceProvider', () => {
  it("uses the phone's language until something else is chosen", async () => {
    storage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => useLanguagePreference(), { wrapper });

    await waitFor(() => expect(i18n.language).toBe('hu'));
    expect(result.current.preference).toBe('system');
  });

  it('switches the language and remembers the choice', async () => {
    storage.getItem.mockResolvedValue(null);
    const { result } = renderHook(() => useLanguagePreference(), { wrapper });
    await waitFor(() => expect(storage.getItem).toHaveBeenCalledWith(LANGUAGE_PREFERENCE_KEY));

    await act(async () => result.current.setPreference('en'));

    expect(result.current.preference).toBe('en');
    expect(i18n.language).toBe('en');
    expect(storage.setItem).toHaveBeenCalledWith(LANGUAGE_PREFERENCE_KEY, 'en');
  });

  it('starts with the remembered choice', async () => {
    storage.getItem.mockResolvedValue('en');

    const { result } = renderHook(() => useLanguagePreference(), { wrapper });

    await waitFor(() => expect(result.current.preference).toBe('en'));
    expect(i18n.language).toBe('en');
  });

  it("ignores a stored value it doesn't know", async () => {
    storage.getItem.mockResolvedValue('klingon');

    const { result } = renderHook(() => useLanguagePreference(), { wrapper });

    await waitFor(() => expect(i18n.language).toBe('hu'));
    expect(result.current.preference).toBe('system');
  });
});
