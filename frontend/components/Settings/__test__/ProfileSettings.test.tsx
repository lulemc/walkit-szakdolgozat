import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import UserService from '@/services/userService';
import { userStorage } from '@/utils/userStorage';
import ProfileSettings from '../ProfileSettings';
import i18n from '@/i18n';
import type { User } from '@/types/User';

jest.mock('@/services/userService', () => ({ __esModule: true, default: { updateUserProfile: jest.fn(), changePassword: jest.fn() } }));
jest.mock('@/utils/userStorage', () => ({ userStorage: { setUser: jest.fn() } }));

const updateUserProfile = UserService.updateUserProfile as jest.Mock;
const alert = jest.spyOn(Alert, 'alert');
const mockShowMessage = jest.fn();
jest.mock('@/context/SnackbarProvider', () => ({
  useSnackbar: () => ({ showMessage: mockShowMessage }),
}));

const user = {
  _id: 'u1',
  name: 'Ann',
  email: 'ann@example.com',
  dateOfBirth: '1990-05-06T00:00:00.000Z',
  sex: 'female',
  height: 170,
  weight: 60,
  activityLevel: 'active',
} as const;

beforeEach(() => {
  jest.clearAllMocks();
  alert.mockImplementation(() => {});
});

const renderProfile = () => {
  const onProfileUpdate = jest.fn();
  const screen = renderWithTheme(<ProfileSettings {...(user as unknown as User)} onProfileUpdate={onProfileUpdate} />);
  return { ...screen, onProfileUpdate };
};

describe('ProfileSettings', () => {
  it('starts with my current profile', () => {
    const { getByLabelText } = renderProfile();

    expect(getByLabelText('Username').props.value).toBe('Ann');
    expect(getByLabelText('Height (cm)').props.value).toBe('170');
    expect(getByLabelText('Weight (kg)').props.value).toBe('60');
  });

  it('saves the changed profile, stores it and tells the settings screen', async () => {
    const saved = { ...user, name: 'Anna', height: 172 };
    updateUserProfile.mockResolvedValue(saved);
    const { getByLabelText, getByText, onProfileUpdate } = renderProfile();

    fireEvent.changeText(getByLabelText('Username'), 'Anna');
    fireEvent.changeText(getByLabelText('Height (cm)'), '172');
    fireEvent.press(getByText('Save Profile'));

    await waitFor(() => expect(onProfileUpdate).toHaveBeenCalledWith(saved));
    expect(updateUserProfile).toHaveBeenCalledWith('u1', {
      name: 'Anna',
      dateOfBirth: '1990-05-06T00:00:00.000Z',
      sex: 'female',
      height: 172,
      weight: 60,
      activityLevel: 'active',
    });
    expect(userStorage.setUser).toHaveBeenCalledWith(saved);
    expect(mockShowMessage).toHaveBeenCalledWith('Profile saved');
    expect(alert).not.toHaveBeenCalled();
  });

  it('leaves out an empty height', async () => {
    updateUserProfile.mockResolvedValue(user);
    const { getByLabelText, getByText } = renderProfile();

    fireEvent.changeText(getByLabelText('Height (cm)'), '');
    fireEvent.press(getByText('Save Profile'));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalled());
    expect(updateUserProfile.mock.calls[0][1].height).toBeUndefined();
  });

  it("shows the server's message when saving fails", async () => {
    updateUserProfile.mockRejectedValue({ response: { data: { message: 'Height must be between 50 and 300 cm' } } });
    const { getByText, onProfileUpdate } = renderProfile();

    fireEvent.press(getByText('Save Profile'));

    await waitFor(() =>
      expect(mockShowMessage).toHaveBeenCalledWith('Height must be between 50 and 300 cm', { type: 'error' }),
    );
    expect(onProfileUpdate).not.toHaveBeenCalled();
  });

  it('asks before opening the password change', async () => {
    const { getByText, findByText, findByLabelText } = renderProfile();

    fireEvent.press(getByText('Change Password'));
    fireEvent.press(await findByText('Yes, change password'));

    expect(await findByLabelText('Current Password')).toBeTruthy();
  });
});

describe('ProfileSettings in Hungarian', () => {
  beforeEach(() => i18n.changeLanguage('hu'));
  // Inside act: the change re-renders what is still on screen
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('labels the form and its options in Hungarian', () => {
    const { getByText, getByLabelText } = renderProfile();

    expect(getByText('Profilbeállítások')).toBeTruthy();
    expect(getByLabelText('Felhasználónév')).toBeTruthy();
    expect(getByText('Nő')).toBeTruthy();
    expect(getByText('Nagyon aktív')).toBeTruthy();
    expect(getByText('Profil mentése')).toBeTruthy();
  });
});
