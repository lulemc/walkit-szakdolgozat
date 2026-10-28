import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import { act } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { OfflineBanner } from '../OfflineBanner';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn() },
}));

const addEventListener = NetInfo.addEventListener as jest.Mock;
let report: (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void;
const unsubscribe = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  addEventListener.mockImplementation((listener) => {
    report = listener;
    return unsubscribe;
  });
});

describe('OfflineBanner', () => {
  it('shows nothing while online or still unknown', () => {
    const { queryByText } = renderWithTheme(<OfflineBanner />);

    act(() => report({ isConnected: true, isInternetReachable: null }));

    expect(queryByText(/offline/)).toBeNull();
  });

  it('says when there is no connection, and goes away when it is back', () => {
    const { getByText, queryByText } = renderWithTheme(<OfflineBanner />);

    act(() => report({ isConnected: false, isInternetReachable: false }));
    expect(getByText("You're offline. Planning routes and social features need the internet.")).toBeTruthy();

    act(() => report({ isConnected: true, isInternetReachable: true }));
    expect(queryByText(/offline/)).toBeNull();
  });

  it('counts a network without internet as offline', () => {
    const { getByText } = renderWithTheme(<OfflineBanner />);

    act(() => report({ isConnected: true, isInternetReachable: false }));

    expect(getByText(/You're offline/)).toBeTruthy();
  });

  it('stops listening when it goes away', () => {
    const { unmount } = renderWithTheme(<OfflineBanner />);

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
