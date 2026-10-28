import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { render, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/context/AuthProvider';
import RootLayout from '@/app/_layout';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-router', () => ({
  Slot: () => {
    const { Text } = jest.requireActual('react-native');
    return <Text>App screens</Text>;
  },
}));
jest.mock('@/context/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}));
jest.mock('@/services/walkLocationTask', () => ({}));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()) },
}));

const auth = useAuth as jest.Mock;
// Called when the layout module loads, before any test (and before clearAllMocks)
const splashKeptAtStart = (SplashScreen.preventAutoHideAsync as jest.Mock).mock.calls.length > 0;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RootLayout', () => {
  it('keeps the splash screen up at start, so there is no blank flash', () => {
    expect(splashKeptAtStart).toBe(true);
  });

  it('shows a loading screen while the login state is read', () => {
    auth.mockReturnValue({ token: null, loading: true });

    const { getByLabelText, queryByText } = render(<RootLayout />);

    expect(getByLabelText('Loading WalkIt')).toBeTruthy();
    expect(queryByText('App screens')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('hides the splash screen and shows the app once ready', async () => {
    auth.mockReturnValue({ token: 'jwt', loading: false });

    const { getByText } = render(<RootLayout />);

    expect(getByText('App screens')).toBeTruthy();
    await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalled());
  });
});
