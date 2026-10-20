import React from 'react';
import { Platform } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { CustomDatePicker } from '../CustomDatePicker';
import { pickDate as pick } from './pickDate';

describe('CustomDatePicker', () => {
  it('picks a date by default', () => {
    const { getByTestId } = renderWithTheme(
      <CustomDatePicker testID="picker" label="Date" value={new Date(2030, 0, 1)} onChange={jest.fn()} />,
    );

    expect(getByTestId('picker').props.mode).toBe('date');
  });

  it('can pick a time', () => {
    const { getByTestId } = renderWithTheme(
      <CustomDatePicker
        testID="picker"
        mode="time"
        label="Time"
        value={new Date(2030, 0, 1)}
        onChange={jest.fn()}
      />,
    );

    expect(getByTestId('picker').props.mode).toBe('time');
  });

  it('passes the picked value on', () => {
    const onChange = jest.fn();
    const picked = new Date(2030, 0, 2);
    const { getByTestId } = renderWithTheme(
      <CustomDatePicker testID="picker" label="Date" value={new Date(2030, 0, 1)} onChange={onChange} />,
    );

    pick(getByTestId('picker'), picked);

    expect(onChange).toHaveBeenCalledWith(picked);
  });

  describe('on Android', () => {
    const originalOS = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'android';
    });
    afterEach(() => {
      Platform.OS = originalOS;
    });

    // The Android picker is a dialog that opens as soon as it is rendered
    it('opens the dialog only when the button is pressed, and closes it after picking', () => {
      const onChange = jest.fn();
      const { getByLabelText, queryByTestId, getByTestId } = renderWithTheme(
        <CustomDatePicker testID="picker" label="Date" value={new Date(2030, 0, 1)} onChange={onChange} />,
      );
      expect(queryByTestId('picker')).toBeNull();

      fireEvent.press(getByLabelText('Date: 1/1/2030'));
      pick(getByTestId('picker'), new Date(2030, 0, 2));

      expect(onChange).toHaveBeenCalledWith(new Date(2030, 0, 2));
      expect(queryByTestId('picker')).toBeNull();
    });
  });
});
