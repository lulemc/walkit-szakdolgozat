import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { ThemePreferenceContext } from '@/context/ThemePreferenceProvider';
import AppSettings from '../AppSettings';

describe('AppSettings', () => {
  it('lets me choose System, Light or Dark', () => {
    const setPreference = jest.fn();
    const { getByRole } = renderWithTheme(
      <ThemePreferenceContext.Provider value={{ preference: 'system', setPreference }}>
        <AppSettings />
      </ThemePreferenceContext.Provider>,
    );

    // Paper's segmented buttons report the chosen one as "checked"
    expect(getByRole('button', { name: 'System' }).props.accessibilityState).toMatchObject({ checked: true });
    expect(getByRole('button', { name: 'Dark' }).props.accessibilityState).toMatchObject({ checked: false });
    fireEvent.press(getByRole('button', { name: 'Dark' }));

    expect(setPreference).toHaveBeenCalledWith('dark');
  });
});
