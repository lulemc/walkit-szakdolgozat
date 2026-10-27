import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import PreferencesSelector from '../PreferencesSelector';

const none = {
  parks: false,
  waterfront: false,
  avoidHighways: false,
  scenic: false,
  uphill: false,
  mountain: false,
  quietStreets: false,
  beach: false,
};

describe('PreferencesSelector', () => {
  it('turns a preference on, and an active one off', () => {
    const onChange = jest.fn();
    const { getByRole } = renderWithTheme(
      <PreferencesSelector preferences={{ ...none, beach: true }} onChange={onChange} />,
    );

    fireEvent.press(getByRole('switch', { name: 'Parks' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...none, beach: true, parks: true });

    fireEvent.press(getByRole('switch', { name: 'Beach' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...none, beach: false });
  });

  it('says how many preferences are on', () => {
    const { getByText, queryByText } = renderWithTheme(
      <PreferencesSelector preferences={{ ...none, parks: true, beach: true }} onChange={jest.fn()} />,
    );

    expect(getByText(/2 preferences\s+active/)).toBeTruthy();
    expect(queryByText(/1 preference /)).toBeNull();
  });

  it('shows each preference as a switch with its state', () => {
    const { getByRole } = renderWithTheme(
      <PreferencesSelector preferences={{ ...none, waterfront: true }} onChange={jest.fn()} />,
    );

    expect(getByRole('switch', { name: 'Waterfront' })).toBeChecked();
    expect(getByRole('switch', { name: 'Avoid Highways' })).not.toBeChecked();
  });
});
