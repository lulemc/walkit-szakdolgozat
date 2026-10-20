import React from 'react';
import { RefreshControl } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { friendService } from '@/services/friendService';
import UserService from '@/services/userService';
import { useSocialSummary } from '@/context/SocialSummaryProvider';
import { SEARCH_DEBOUNCE_MS } from '@/hooks/useUserSearch';
import { FriendsSection } from '../FriendsSection';

jest.mock('@/services/friendService', () => ({
  friendService: {
    listFriends: jest.fn(),
    listRequests: jest.fn(),
    sendRequest: jest.fn(),
    acceptRequest: jest.fn(),
    declineRequest: jest.fn(),
    cancelRequest: jest.fn(),
    unfriend: jest.fn(),
  },
}));
jest.mock('@/services/userService', () => ({
  __esModule: true,
  default: { searchUsers: jest.fn() },
}));
jest.mock('@/context/SocialSummaryProvider', () => ({ useSocialSummary: jest.fn() }));

const service = friendService as jest.Mocked<typeof friendService>;
const searchUsers = UserService.searchUsers as jest.Mock;
const refreshSummary = jest.fn().mockResolvedValue(undefined);

const friends = [{ friendshipId: 'f1', user: { _id: 'u2', name: 'Ann' }, since: '2026-10-01T10:00:00Z' }];
const requests = {
  incoming: [{ _id: 'r1', user: { _id: 'u3', name: 'Bob' }, createdAt: '2026-10-02T10:00:00Z' }],
  outgoing: [{ _id: 'r2', user: { _id: 'u4', name: 'Cid' }, createdAt: '2026-10-03T10:00:00Z' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  (useSocialSummary as jest.Mock).mockReturnValue({ refresh: refreshSummary });
  service.listFriends.mockResolvedValue(friends);
  service.listRequests.mockResolvedValue(requests);
  service.acceptRequest.mockResolvedValue({} as never);
  service.unfriend.mockResolvedValue(undefined);
});

const renderSection = async () => {
  const screen = renderWithTheme(<FriendsSection />);
  await screen.findByText('Ann');
  return screen;
};

describe('FriendsSection', () => {
  it('lists incoming and outgoing requests and friends', async () => {
    const { getByText, getByLabelText } = await renderSection();

    expect(getByText('Bob')).toBeTruthy();
    expect(getByLabelText('Accept friend request from Bob')).toBeTruthy();
    expect(getByLabelText('Decline friend request from Bob')).toBeTruthy();
    expect(getByText('Cid')).toBeTruthy();
    expect(getByLabelText('Cancel friend request to Cid')).toBeTruthy();
    expect(getByLabelText('Remove Ann from friends')).toBeTruthy();
  });

  it('accepts a request and refreshes the badge', async () => {
    const { getByLabelText } = await renderSection();

    fireEvent.press(getByLabelText('Accept friend request from Bob'));

    await waitFor(() => expect(service.acceptRequest).toHaveBeenCalledWith('r1'));
    await waitFor(() => expect(refreshSummary).toHaveBeenCalled());
  });

  it('asks for confirmation before removing a friend', async () => {
    const { getByLabelText, getByText, queryByText } = await renderSection();

    fireEvent.press(getByLabelText('Remove Ann from friends'));
    expect(getByText('Remove Ann from your friends?')).toBeTruthy();
    fireEvent.press(getByText('Keep'));
    expect(service.unfriend).not.toHaveBeenCalled();
    await waitFor(() => expect(queryByText('Remove Ann from your friends?')).toBeNull());

    fireEvent.press(getByLabelText('Remove Ann from friends'));
    fireEvent.press(getByText('Remove'));

    await waitFor(() => expect(service.unfriend).toHaveBeenCalledWith('u2'));
  });

  it('searches as I type and shows the right button for each person', async () => {
    searchUsers.mockResolvedValue([
      { _id: 'u5', name: 'Ann New', relationship: 'none' },
      { _id: 'u4', name: 'Cid', relationship: 'outgoing', friendshipId: 'r2' },
      { _id: 'u3', name: 'Bob', relationship: 'incoming', friendshipId: 'r1' },
      { _id: 'u2', name: 'Ann', relationship: 'friends', friendshipId: 'f1' },
    ]);
    const { getByLabelText, findByLabelText } = await renderSection();
    jest.useFakeTimers();

    fireEvent.changeText(getByLabelText('Search by name or email'), 'an');
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    jest.useRealTimers();

    expect(searchUsers).toHaveBeenCalledWith('an');
    expect(await findByLabelText('Add Ann New as a friend')).toBeTruthy();
    expect(getByLabelText('Friend request to Cid already sent')).toBeDisabled();
    expect(getByLabelText("Accept Bob's friend request")).toBeTruthy();
    expect(getByLabelText('Ann is already your friend')).toBeDisabled();
  });

  it('sends a request from the search results and marks it as requested', async () => {
    searchUsers.mockResolvedValue([{ _id: 'u5', name: 'Dan', relationship: 'none' }]);
    service.sendRequest.mockResolvedValue({ _id: 'r9', status: 'pending' } as never);
    const { getByLabelText, findByLabelText } = await renderSection();
    jest.useFakeTimers();
    fireEvent.changeText(getByLabelText('Search by name or email'), 'dan');
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    jest.useRealTimers();

    fireEvent.press(await findByLabelText('Add Dan as a friend'));

    await waitFor(() => expect(service.sendRequest).toHaveBeenCalledWith('u5'));
    expect(await findByLabelText('Friend request to Dan already sent')).toBeTruthy();
  });

  it('shows friendly empty states', async () => {
    service.listFriends.mockResolvedValue([]);
    service.listRequests.mockResolvedValue({ incoming: [], outgoing: [] });

    const { findByText, getByText } = renderWithTheme(<FriendsSection />);

    expect(await findByText(/No friends yet/)).toBeTruthy();
    expect(getByText('No pending requests.')).toBeTruthy();
  });

  it('offers a retry when the lists fail to load', async () => {
    service.listFriends.mockRejectedValueOnce(new Error('Network Error'));
    const { findByText, getByText } = renderWithTheme(<FriendsSection />);

    expect(await findByText("Couldn't load your friends")).toBeTruthy();
    fireEvent.press(getByText('Try again'));

    expect(await findByText('Ann')).toBeTruthy();
  });

  it('reloads on pull-to-refresh', async () => {
    const { UNSAFE_getByType } = await renderSection();
    service.listFriends.mockClear();

    await act(async () => UNSAFE_getByType(RefreshControl).props.onRefresh());

    expect(service.listFriends).toHaveBeenCalledTimes(1);
  });

  it("shows the backend's message when an action fails", async () => {
    service.acceptRequest.mockRejectedValue({ response: { data: { message: 'Friend request not found' } } });
    const { getByLabelText, findByText } = await renderSection();

    fireEvent.press(getByLabelText('Accept friend request from Bob'));

    expect(await findByText('Friend request not found')).toBeTruthy();
  });

  it('shows extra content above the lists, like the hub header', async () => {
    const { Text } = jest.requireActual('react-native');
    const { findByText } = renderWithTheme(<FriendsSection header={<Text>Header</Text>} />);

    expect(await findByText('Header')).toBeTruthy();
  });
});
