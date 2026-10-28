import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  THEME_PREFERENCE_KEY,
  ThemePreferenceProvider,
  useThemePreference,
} from '../ThemePreferenceProvider';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemePreferenceProvider>{children}</ThemePreferenceProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ThemePreferenceProvider', () => {
  it('follows the phone until something else is chosen', async () => {
    storage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => useThemePreference(), { wrapper });

    await waitFor(() => expect(storage.getItem).toHaveBeenCalledWith(THEME_PREFERENCE_KEY));
    expect(result.current.preference).toBe('system');
  });

  it('remembers the choice on the phone', async () => {
    storage.getItem.mockResolvedValue(null);
    const { result } = renderHook(() => useThemePreference(), { wrapper });

    await act(async () => result.current.setPreference('dark'));

    expect(result.current.preference).toBe('dark');
    expect(storage.setItem).toHaveBeenCalledWith(THEME_PREFERENCE_KEY, 'dark');
  });

  it('starts with the remembered choice', async () => {
    storage.getItem.mockResolvedValue('light');

    const { result } = renderHook(() => useThemePreference(), { wrapper });

    await waitFor(() => expect(result.current.preference).toBe('light'));
  });

  it('ignores a stored value it doesn\'t know', async () => {
    storage.getItem.mockResolvedValue('purple');

    const { result } = renderHook(() => useThemePreference(), { wrapper });

    await waitFor(() => expect(storage.getItem).toHaveBeenCalled());
    expect(result.current.preference).toBe('system');
  });
});
