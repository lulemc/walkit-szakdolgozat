import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import { ThemePreferenceContext } from '@/context/ThemePreferenceProvider';
import type { ThemePreference } from '@/context/ThemePreferenceProvider';
import { darkTheme, lightTheme } from '@/theme/paperTheme';
import { useAppTheme } from '../useAppTheme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: jest.fn() }));

const scheme = useColorScheme as jest.Mock;
const withPreference = (preference: ThemePreference) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemePreferenceContext.Provider value={{ preference, setPreference: jest.fn() }}>
        {children}
      </ThemePreferenceContext.Provider>
    );
  };

describe('useAppTheme', () => {
  it.each([
    ['dark', darkTheme],
    ['light', lightTheme],
    [null, lightTheme],
  ])('follows the phone (%s) by default', (phoneScheme, expected) => {
    scheme.mockReturnValue(phoneScheme);

    const { result } = renderHook(() => useAppTheme());

    expect(result.current).toBe(expected);
  });

  it('uses dark or light when chosen, whatever the phone says', () => {
    scheme.mockReturnValue('light');
    expect(renderHook(() => useAppTheme(), { wrapper: withPreference('dark') }).result.current).toBe(darkTheme);

    scheme.mockReturnValue('dark');
    expect(renderHook(() => useAppTheme(), { wrapper: withPreference('light') }).result.current).toBe(lightTheme);
  });

  it('follows the phone when "system" is chosen', () => {
    scheme.mockReturnValue('dark');

    expect(renderHook(() => useAppTheme(), { wrapper: withPreference('system') }).result.current).toBe(darkTheme);
  });
});
