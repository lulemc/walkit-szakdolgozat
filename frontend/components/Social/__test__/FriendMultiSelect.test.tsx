import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { friendService } from '@/services/friendService';
import { FriendMultiSelect } from '../FriendMultiSelect';

jest.mock('@/services/friendService', () => ({
  friendService: { listFriends: jest.fn() },
}));

const listFriends = friendService.listFriends as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  listFriends.mockResolvedValue([
    { friendshipId: 'f1', user: { _id: 'u2', name: 'Ann' }, since: '2026-10-01T10:00:00Z' },
    { friendshipId: 'f2', user: { _id: 'u3', name: 'Bob' }, since: '2026-10-01T10:00:00Z' },
    { friendshipId: 'f3', user: { _id: null, name: 'Deleted user' }, since: '2026-10-01T10:00:00Z' },
  ]);
});

describe('FriendMultiSelect', () => {
  it('lists my friends to invite, showing who is selected', async () => {
    const { findByRole, getByRole, queryByText } = renderWithTheme(
      <FriendMultiSelect selectedIds={['u3']} onChange={jest.fn()} />,
    );

    expect(await findByRole('checkbox', { name: 'Invite Ann' })).not.toBeChecked();
    expect(getByRole('checkbox', { name: 'Invite Bob' })).toBeChecked();
    expect(queryByText('Deleted user')).toBeNull();
  });

  it('adds and removes friends from the selection', async () => {
    const onChange = jest.fn();
    const { findByRole, getByRole } = renderWithTheme(
      <FriendMultiSelect selectedIds={['u3']} onChange={onChange} />,
    );

    fireEvent.press(await findByRole('checkbox', { name: 'Invite Ann' }));
    expect(onChange).toHaveBeenLastCalledWith(['u3', 'u2']);

    fireEvent.press(getByRole('checkbox', { name: 'Invite Bob' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('says how to get friends when there are none', async () => {
    listFriends.mockResolvedValue([]);
    const { findByText } = renderWithTheme(<FriendMultiSelect selectedIds={[]} onChange={jest.fn()} />);

    expect(await findByText(/Add friends in the Friends section/)).toBeTruthy();
  });

  it('offers a retry when the friends fail to load', async () => {
    listFriends.mockRejectedValueOnce(new Error('Network Error'));
    const { findByText, getByText, findByRole } = renderWithTheme(
      <FriendMultiSelect selectedIds={[]} onChange={jest.fn()} />,
    );

    expect(await findByText("Couldn't load your friends")).toBeTruthy();
    fireEvent.press(getByText('Try again'));

    expect(await findByRole('checkbox', { name: 'Invite Ann' })).toBeTruthy();
  });
});

describe('FriendMultiSelect with excluded friends', () => {
  it('leaves out the excluded friends', async () => {
    const { findByRole, queryByRole } = renderWithTheme(
      <FriendMultiSelect selectedIds={[]} onChange={jest.fn()} excludeIds={['u2']} />,
    );

    expect(await findByRole('checkbox', { name: 'Invite Bob' })).toBeTruthy();
    expect(queryByRole('checkbox', { name: 'Invite Ann' })).toBeNull();
  });

  it('says when every friend is already in', async () => {
    const { findByText } = renderWithTheme(
      <FriendMultiSelect selectedIds={[]} onChange={jest.fn()} excludeIds={['u2', 'u3']} />,
    );

    expect(await findByText('All your friends are already invited.')).toBeTruthy();
  });
});
