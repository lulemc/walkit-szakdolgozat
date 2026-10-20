import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { pickDate } from '@/components/Inputs/__test__/pickDate';
import { friendService } from '@/services/friendService';
import { groupWalkService } from '@/services/groupWalkService';
import { CreateGroupWalkForm } from '../CreateGroupWalkForm';
import { makeRoute } from './routeFixtures';

jest.mock('@/services/friendService', () => ({
  friendService: { listFriends: jest.fn() },
}));
jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: { create: jest.fn() },
}));

const listFriends = friendService.listFriends as jest.Mock;
const create = groupWalkService.create as jest.Mock;
const route = makeRoute({ _id: 'r1', name: 'Riverside loop' });

beforeEach(() => {
  jest.clearAllMocks();
  listFriends.mockResolvedValue([
    { friendshipId: 'f1', user: { _id: 'u2', name: 'Ann' }, since: '2026-10-01T10:00:00Z' },
    { friendshipId: 'f2', user: { _id: 'u3', name: 'Bob' }, since: '2026-10-01T10:00:00Z' },
  ]);
  create.mockResolvedValue({ _id: 'w1' });
});

const renderForm = async (props: Partial<React.ComponentProps<typeof CreateGroupWalkForm>> = {}) => {
  const onCreated = jest.fn();
  const screen = renderWithTheme(
    <CreateGroupWalkForm route={route} onCreated={onCreated} onCancel={jest.fn()} {...props} />,
  );
  await screen.findByRole('checkbox', { name: 'Invite Ann' });
  return { ...screen, onCreated };
};

describe('CreateGroupWalkForm', () => {
  it('shows the chosen route', async () => {
    const { getByText } = await renderForm();

    expect(getByText('Riverside loop')).toBeTruthy();
  });

  it('creates the walk with the time in UTC, then hands it back', async () => {
    const { getByTestId, getByRole, getByLabelText, onCreated } = await renderForm();

    fireEvent.changeText(getByLabelText('Title (optional)'), '  Sunday stroll  ');
    fireEvent.changeText(getByLabelText('Note (optional)'), 'Meet at the bridge');
    pickDate(getByTestId('group-walk-date'), new Date(2030, 0, 2));
    // The time picker's own date part is ignored; only its time is used
    pickDate(getByTestId('group-walk-time'), new Date(2020, 5, 5, 10, 30));
    fireEvent.press(getByRole('checkbox', { name: 'Invite Ann' }));
    fireEvent.press(getByRole('checkbox', { name: 'Invite Bob' }));
    fireEvent.press(getByRole('button', { name: 'Create group walk' }));

    // Tests run in America/Sao_Paulo (UTC-3), so 10:30 local is 13:30 UTC
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        routeId: 'r1',
        scheduledAt: '2030-01-02T13:30:00.000Z',
        title: 'Sunday stroll',
        note: 'Meet at the bridge',
        inviteeIds: ['u2', 'u3'],
      }),
    );
    expect(onCreated).toHaveBeenCalledWith({ _id: 'w1' });
  });

  it('leaves out an empty title and note', async () => {
    const { getByTestId, getByRole } = await renderForm();

    pickDate(getByTestId('group-walk-date'), new Date(2030, 0, 2));
    fireEvent.press(getByRole('checkbox', { name: 'Invite Ann' }));
    fireEvent.press(getByRole('button', { name: 'Create group walk' }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).not.toHaveProperty('title');
    expect(create.mock.calls[0][0]).not.toHaveProperty('note');
  });

  it("can't be submitted for a time in the past", async () => {
    const { getByTestId, getByRole, findByText } = await renderForm();

    pickDate(getByTestId('group-walk-date'), new Date(2020, 0, 2));
    fireEvent.press(getByRole('checkbox', { name: 'Invite Ann' }));
    fireEvent.press(getByRole('button', { name: 'Create group walk' }));

    expect(await findByText('Pick a time in the future.')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it("can't be submitted without inviting anyone", async () => {
    const { getByTestId, getByRole, findByText } = await renderForm();

    pickDate(getByTestId('group-walk-date'), new Date(2030, 0, 2));
    fireEvent.press(getByRole('button', { name: 'Create group walk' }));

    expect(await findByText('Invite at least one friend.')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it("shows the backend's message when creating fails", async () => {
    create.mockRejectedValue({ response: { data: { message: 'You can only invite friends' } } });
    const { getByTestId, getByRole, findByText, onCreated } = await renderForm();

    pickDate(getByTestId('group-walk-date'), new Date(2030, 0, 2));
    fireEvent.press(getByRole('checkbox', { name: 'Invite Ann' }));
    fireEvent.press(getByRole('button', { name: 'Create group walk' }));

    expect(await findByText('You can only invite friends')).toBeTruthy();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('lets me choose a different route', async () => {
    const onChangeRoute = jest.fn();
    const { getByText } = await renderForm({ onChangeRoute });

    fireEvent.press(getByText('Change route'));

    expect(onChangeRoute).toHaveBeenCalled();
  });
});
