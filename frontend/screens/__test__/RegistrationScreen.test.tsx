import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import RegisterScreen from '@/app/(auth)/registration';

const mockRegister = jest.fn();
jest.mock('@/context/AuthProvider', () => ({
  useAuth: () => ({ register: mockRegister }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRegister.mockResolvedValue(undefined);
});

const fillIn = (screen: ReturnType<typeof renderWithTheme>, values: { name: string; email: string; password: string }) => {
  fireEvent.changeText(screen.getByLabelText('Name'), values.name);
  fireEvent.changeText(screen.getByLabelText('Email'), values.email);
  fireEvent.changeText(screen.getByLabelText('Password'), values.password);
  fireEvent.press(screen.getByText('Register'));
};

describe('RegisterScreen', () => {
  it('registers with the entered details', async () => {
    const screen = renderWithTheme(<RegisterScreen />);

    fillIn(screen, { name: 'Ann', email: 'ann@example.com', password: 'secret123' });

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith('Ann', 'ann@example.com', 'secret123'));
  });

  it('asks for at least 8 characters before sending, like the server', async () => {
    const screen = renderWithTheme(<RegisterScreen />);

    fillIn(screen, { name: 'Ann', email: 'ann@example.com', password: 'short' });

    expect(await screen.findByText('Password must be at least 8 characters long')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows the server's message when registering fails", async () => {
    mockRegister.mockRejectedValue({ response: { data: { message: 'Please enter a valid email address' } } });
    const screen = renderWithTheme(<RegisterScreen />);

    fillIn(screen, { name: 'Ann', email: 'ann@example', password: 'secret123' });

    expect(await screen.findByText('Please enter a valid email address')).toBeTruthy();
  });
});
