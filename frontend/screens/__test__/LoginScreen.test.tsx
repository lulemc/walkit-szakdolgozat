import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import LoginScreen from '@/app/(auth)/login';
import i18n from '@/i18n';

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

describe('LoginScreen in Hungarian', () => {
  beforeEach(() => i18n.changeLanguage('hu'));
  // Inside act: the change re-renders what is still on screen
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('shows the form and its errors in Hungarian', async () => {
    const screen = renderWithTheme(<LoginScreen />);

    expect(screen.getByText('Még nincs fiókod?')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('E-mail'), 'ann@example.com');
    fireEvent.press(screen.getByRole('button', { name: 'Bejelentkezés' }));

    expect(await screen.findByText('Minden mezőt ki kell tölteni')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("keeps the app's own fallback in Hungarian when the server can't be reached", async () => {
    mockLogin.mockRejectedValue({ request: {} });
    const screen = renderWithTheme(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('E-mail'), 'ann@example.com');
    fireEvent.changeText(screen.getByLabelText('Jelszó'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'Bejelentkezés' }));

    expect(await screen.findByText(/^A WalkIt nem érhető el\./)).toBeTruthy();
  });
});
