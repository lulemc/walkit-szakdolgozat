import { fireEvent } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

/** Simulates the user confirming a value in the native date/time picker */
export const pickDate = (picker: ReactTestInstance, date: Date) =>
  fireEvent(picker, 'change', { type: 'set', nativeEvent: { timestamp: date.getTime() } }, date);
