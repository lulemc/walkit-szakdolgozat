import React from 'react';
import { BackHandler } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import { friendService } from '@/services/friendService';
import { groupWalkService } from '@/services/groupWalkService';
import { routeService } from '@/services/routeService';
import SocialScreen from '../SocialScreen';
import type { Route } from '@/services/routeService';

jest.mock('@/context/AuthProvider', () => ({
  useAuth: () => ({ user: { _id: 'u1', name: 'Me' } }),
}));
jest.mock('@/services/friendService', () => ({
  friendService: { listFriends: jest.fn() },
}));
jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: { create: jest.fn() },
}));
const getUserRoutes = jest.spyOn(routeService, 'getUserRoutes');
const getFavoriteRoutes = jest.spyOn(routeService, 'getFavoriteRoutes');
const riverside = makeRoute({ _id: 'r1', name: 'Riverside loop' });

const mockActiveWalk = jest.fn();
jest.mock('@/screens/ActiveWalkScreen', () => ({
  __esModule: true,
  default: (props: { route: Route; onEndWalk: () => void }) => {
    mockActiveWalk(props);
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText onPress={props.onEndWalk}>Active walk</MockText>;
  },
}));

// The Friends section has its own tests; here it only needs to show up
jest.mock('@/components/Social/FriendsSection', () => ({
  FriendsSection: ({ header }: { header?: React.ReactNode }) => {
    const { Text: MockText, View: MockView } = jest.requireActual('react-native');
    return (
      <MockView>
        {header}
        <MockText>Friends section</MockText>
      </MockView>
    );
  },
}));

let backHandler: () => boolean;
const removeBackHandler = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  getFavoriteRoutes.mockResolvedValue([]);
  getUserRoutes.mockResolvedValue([riverside]);
  (friendService.listFriends as jest.Mock).mockResolvedValue([
    { friendshipId: 'f1', user: { _id: 'u2', name: 'Ann' }, since: '2026-10-01T10:00:00Z' },
  ]);
  (groupWalkService.create as jest.Mock).mockResolvedValue({ _id: 'w9' });
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    backHandler = handler as () => boolean;
    return { remove: removeBackHandler };
  });
});

describe('SocialScreen', () => {
  it('opens on the Walks view and switches to Friends', () => {
    const { getByText, queryByText } = renderWithTheme(<SocialScreen />);

    expect(getByText('Your group walks will appear here.')).toBeTruthy();

    fireEvent.press(getByText('Friends'));

    expect(getByText('Friends section')).toBeTruthy();
    expect(queryByText('Your group walks will appear here.')).toBeNull();
    // The hub's title and switch stay visible above the section
    expect(getByText('Social')).toBeTruthy();
    expect(getByText('Walks')).toBeTruthy();
  });

  it('shows a walk detail view with a way back to the hub', () => {
    const { getByText, queryByText } = renderWithTheme(
      <SocialScreen initialView={{ screen: 'walkDetail', walkId: 'w1' }} />,
    );

    expect(getByText('Group walk')).toBeTruthy();

    fireEvent.press(getByText('Back'));

    expect(getByText('Your group walks will appear here.')).toBeTruthy();
    expect(queryByText('Group walk')).toBeNull();
  });

  it("goes back to the hub on Android's back button", async () => {
    const { getByText, findByText } = renderWithTheme(
      <SocialScreen initialView={{ screen: 'createWalk' }} />,
    );
    expect(await findByText('Choose a route')).toBeTruthy();

    let handled = false;
    act(() => {
      handled = backHandler();
    });

    expect(handled).toBe(true);
    expect(getByText('Your group walks will appear here.')).toBeTruthy();
  });

  it("leaves Android's back button to the system on the hub", () => {
    renderWithTheme(<SocialScreen />);

    expect(backHandler()).toBe(false);
  });

  it('walks a route in the existing walk screen and returns to the hub afterwards', () => {
    const route = { _id: 'w1', coordinates: [] } as unknown as Route;
    const { getByText } = renderWithTheme(
      <SocialScreen initialView={{ screen: 'activeWalk', route }} />,
    );

    expect(mockActiveWalk).toHaveBeenCalledWith(expect.objectContaining({ route }));

    fireEvent.press(getByText('Active walk'));

    expect(getByText('Your group walks will appear here.')).toBeTruthy();
  });

  it('stops listening to the back button on unmount', () => {
    const { unmount } = renderWithTheme(<SocialScreen />);

    unmount();

    expect(removeBackHandler).toHaveBeenCalled();
  });

  describe('planning a group walk', () => {
    it('starts from the Walks view by choosing a saved route', async () => {
      const { getByText, findByText } = renderWithTheme(<SocialScreen />);

      fireEvent.press(getByText('New group walk'));

      expect(await findByText('Choose a route')).toBeTruthy();
      expect(await findByText('Riverside loop')).toBeTruthy();
    });

    it('fills in the form after a route is chosen, and can change it again', async () => {
      const { findByLabelText, findByText, getByText } = renderWithTheme(
        <SocialScreen initialView={{ screen: 'createWalk' }} />,
      );

      fireEvent.press(await findByLabelText('Choose Riverside loop'));
      expect(await findByText('Plan a group walk')).toBeTruthy();
      expect(getByText('Riverside loop')).toBeTruthy();

      fireEvent.press(getByText('Change route'));
      expect(await findByText('Choose a route')).toBeTruthy();
    });

    it('goes straight to the form with a route from the planner, then opens the new walk', async () => {
      const { findByRole, getByTestId, getByRole, findByText } = renderWithTheme(
        <SocialScreen initialView={{ screen: 'createWalk', route: riverside }} />,
      );

      fireEvent(getByTestId('group-walk-date'), 'change', {
        type: 'set',
        nativeEvent: { timestamp: new Date(2030, 0, 2).getTime() },
      });
      fireEvent.press(await findByRole('checkbox', { name: 'Invite Ann' }));
      fireEvent.press(getByRole('button', { name: 'Create group walk' }));

      expect(await findByText('Group walk')).toBeTruthy();
      expect(groupWalkService.create).toHaveBeenCalledWith(
        expect.objectContaining({ routeId: 'r1', inviteeIds: ['u2'] }),
      );
    });

    it('cancels back to the hub', async () => {
      const { findByText, getByText } = renderWithTheme(
        <SocialScreen initialView={{ screen: 'createWalk', route: riverside }} />,
      );

      fireEvent.press(await findByText('Cancel'));

      expect(getByText('New group walk')).toBeTruthy();
    });
  });
});
