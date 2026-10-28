import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import UserService from '@/services/userService';
import { storage } from '@/utils/storage';
import ChangePasswordModal from '../ChangePasswordModal';

jest.mock('@/services/userService', () => ({ __esModule: true, default: { changePassword: jest.fn() } }));
jest.mock('@/utils/storage', () => ({ storage: { setToken: jest.fn() } }));

const changePassword = UserService.changePassword as jest.Mock;
const alert = jest.spyOn(Alert, 'alert');
const mockShowMessage = jest.fn();
jest.mock('@/context/SnackbarProvider', () => ({
  useSnackbar: () => ({ showMessage: mockShowMessage }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  alert.mockImplementation(() => {});
  changePassword.mockResolvedValue({ token: 'new-token' });
});

const renderModal = () => {
  const props = { visible: true, onClose: jest.fn(), userId: 'u1', onPasswordChanged: jest.fn() };
  return { ...renderWithTheme(<ChangePasswordModal {...props} />), props };
};

const fillIn = (
  screen: ReturnType<typeof renderModal>,
  { current, next, confirm }: { current: string; next: string; confirm: string },
) => {
  fireEvent.changeText(screen.getByLabelText('Current Password'), current);
  fireEvent.changeText(screen.getByLabelText('New Password'), next);
  fireEvent.changeText(screen.getByLabelText('Confirm New Password'), confirm);
  fireEvent.press(screen.getByRole('button', { name: 'Change Password' }));
};

describe('ChangePasswordModal', () => {
  it('changes the password and keeps me logged in with the new token', async () => {
    const screen = renderModal();

    fillIn(screen, { current: 'OldPass123', next: 'NewPass456', confirm: 'NewPass456' });

    await waitFor(() => expect(storage.setToken).toHaveBeenCalledWith('new-token'));
    expect(changePassword).toHaveBeenCalledWith('u1', { currentPassword: 'OldPass123', newPassword: 'NewPass456' });
    expect(screen.props.onClose).toHaveBeenCalled();
    expect(screen.props.onPasswordChanged).toHaveBeenCalled();
    expect(mockShowMessage).toHaveBeenCalledWith('Your password has been changed.');
  });

  it.each([
    ['too short', 'Ab1', 'Password must be at least 8 characters long'],
    ['without an uppercase letter', 'newpass456', 'Password must contain at least one uppercase letter'],
    ['without a lowercase letter', 'NEWPASS456', 'Password must contain at least one lowercase letter'],
    ['without a number', 'NewPassword', 'Password must contain at least one number'],
  ])('rejects a new password %s', async (_case, next, message) => {
    const screen = renderModal();

    fillIn(screen, { current: 'OldPass123', next, confirm: next });

    expect(await screen.findByText(message)).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('checks the confirmation and that the password changes', async () => {
    const screen = renderModal();

    fillIn(screen, { current: 'OldPass123', next: 'NewPass456', confirm: 'NewPass457' });
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();

    fillIn(screen, { current: 'SamePass1', next: 'SamePass1', confirm: 'SamePass1' });
    expect(await screen.findByText('New password must be different from current password')).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('asks for every field', async () => {
    const screen = renderModal();

    fillIn(screen, { current: '', next: '', confirm: '' });

    expect(await screen.findByText('Current password is required')).toBeTruthy();
    expect(screen.getByText('New password is required')).toBeTruthy();
    expect(screen.getByText('Please confirm your new password')).toBeTruthy();
  });

  it("shows the server's message when the change fails", async () => {
    changePassword.mockRejectedValue({ response: { data: { message: 'Current password is incorrect' } } });
    const screen = renderModal();

    fillIn(screen, { current: 'WrongPass1', next: 'NewPass456', confirm: 'NewPass456' });

    // Shown in the dialog: a snackbar would be hidden behind it
    expect(await screen.findByText('Current password is incorrect')).toBeTruthy();
    expect(storage.setToken).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
  });
});
