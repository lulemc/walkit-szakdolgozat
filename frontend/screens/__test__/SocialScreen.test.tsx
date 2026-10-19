import React from 'react';
import { BackHandler } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import SocialScreen from '../SocialScreen';
import type { Route } from '@/services/routeService';

const mockActiveWalk = jest.fn();
jest.mock('@/screens/ActiveWalkScreen', () => ({
  __esModule: true,
  default: (props: { route: Route; onEndWalk: () => void }) => {
    mockActiveWalk(props);
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText onPress={props.onEndWalk}>Active walk</MockText>;
  },
}));

let backHandler: () => boolean;
const removeBackHandler = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
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

    expect(getByText('Your friends will appear here.')).toBeTruthy();
    expect(queryByText('Your group walks will appear here.')).toBeNull();
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

  it("goes back to the hub on Android's back button", () => {
    const { getByText } = renderWithTheme(
      <SocialScreen initialView={{ screen: 'createWalk' }} />,
    );
    expect(getByText('Plan a group walk')).toBeTruthy();

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
});

