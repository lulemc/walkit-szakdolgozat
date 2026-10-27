import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import LoginScreen from '@/app/(auth)/login';

const mockLogin = jest.fn();
const mockReplace = jest.fn();
jest.mock('@/context/AuthProvider', () => ({ useAuth: () => ({ login: mockLogin }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockLogin.mockResolvedValue(undefined);
});

const fillIn = (screen: ReturnType<typeof renderWithTheme>, email: string, password: string) => {
  fireEvent.changeText(screen.getByLabelText('Email'), email);
  fireEvent.changeText(screen.getByLabelText('Password'), password);
  fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));
};

describe('LoginScreen', () => {
  it('logs in with the entered details', async () => {
    const screen = renderWithTheme(<LoginScreen />);

    fillIn(screen, 'ann@example.com', 'secret123');

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('ann@example.com', 'secret123'));
  });

  it('asks for both fields', async () => {
    const screen = renderWithTheme(<LoginScreen />);

    fillIn(screen, 'ann@example.com', '');

    expect(await screen.findByText('All fields are required')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows the server's message when logging in fails", async () => {
    mockLogin.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
    const screen = renderWithTheme(<LoginScreen />);

    fillIn(screen, 'ann@example.com', 'wrong');

    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
  });

  it('goes to registration', () => {
    const screen = renderWithTheme(<LoginScreen />);

    fireEvent.press(screen.getByText('Register'));

    expect(mockReplace).toHaveBeenCalledWith('/registration');
  });
});
