import React from 'react';
import { Alert, Text } from 'react-native';
import { act, fireEvent, renderHook } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { SNACKBAR_DURATION_MS, SnackbarProvider, useSnackbar } from '../SnackbarProvider';

const Shows = ({ message, type }: { message: string; type?: 'info' | 'error' }) => {
  const { showMessage } = useSnackbar();
  return <Text onPress={() => showMessage(message, { type })}>show</Text>;
};

describe('SnackbarProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a short message, then hides it', () => {
    const { getByText, queryByText } = renderWithTheme(
      <SnackbarProvider>
        <Shows message="Start location set" />
      </SnackbarProvider>,
    );

    fireEvent.press(getByText('show'));
    expect(getByText('Start location set')).toBeTruthy();

    // Paper starts the timer once the show animation is done, then animates out
    for (const ms of [300, SNACKBAR_DURATION_MS, 300]) {
      act(() => {
        jest.advanceTimersByTime(ms);
      });
    }
    expect(queryByText('Start location set')).toBeNull();
  });

  it('marks errors so screen readers announce them', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <SnackbarProvider>
        <Shows message="Could not load place details" type="error" />
      </SnackbarProvider>,
    );

    fireEvent.press(getByText('show'));

    expect(getByLabelText('Error: Could not load place details')).toBeTruthy();
  });

  it('can be dismissed', () => {
    const { getByText, queryByText } = renderWithTheme(
      <SnackbarProvider>
        <Shows message="Saved" />
      </SnackbarProvider>,
    );
    fireEvent.press(getByText('show'));

    fireEvent.press(getByText('OK'));
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(queryByText('Saved')).toBeNull();
  });

  it('falls back to an alert outside the provider', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useSnackbar());

    act(() => result.current.showMessage('Hello', { type: 'error' }));

    expect(alert).toHaveBeenCalledWith('Error', 'Hello');
  });
});
