import React from 'react';
import { act, waitFor } from '@testing-library/react-native';
import { BottomNavigation } from 'react-native-paper';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { groupWalkService } from '@/services/groupWalkService';
import { Navigation } from '../Navigation';

// The tab screens themselves aren't under test here
jest.mock('@/app/(app)/home', () => () => null);
jest.mock('@/app/(app)/statistics', () => () => null);
jest.mock('@/app/(app)/settings', () => () => null);
jest.mock('@/app/(app)/social', () => () => null);

jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: { getSummary: jest.fn() },
}));

const getSummary = groupWalkService.getSummary as jest.Mock;

const renderNavigation = () =>
  renderWithTheme(
    <Navigation>
      <></>
    </Navigation>,
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Navigation', () => {
  it('has a Social tab', async () => {
    getSummary.mockResolvedValue({ pendingFriendRequests: 0, pendingInvitations: 0 });

    const { findByRole } = renderNavigation();

    expect(await findByRole('button', { name: 'Social' })).toBeTruthy();
  });

  it("shows the number of pending requests and invitations on the Social tab's badge", async () => {
    getSummary.mockResolvedValue({ pendingFriendRequests: 1, pendingInvitations: 2 });

    const { findByText } = renderNavigation();

    expect(await findByText('3')).toBeTruthy();
  });

  it('hides the badge when nothing is pending', async () => {
    getSummary.mockResolvedValue({ pendingFriendRequests: 0, pendingInvitations: 0 });

    const { queryByText } = renderNavigation();

    await waitFor(() => expect(getSummary).toHaveBeenCalled());
    expect(queryByText('0')).toBeNull();
  });

  it('refreshes the counts when the Social tab is opened, not for other tabs', async () => {
    getSummary.mockResolvedValue({ pendingFriendRequests: 0, pendingInvitations: 0 });
    const { findByRole, UNSAFE_getByType } = renderNavigation();
    await findByRole('button', { name: 'Social' });
    await waitFor(() => expect(getSummary).toHaveBeenCalledTimes(1));

    // Paper's tab buttons don't respond to simulated presses in Jest, so select
    // tabs through the change callback Paper calls when a tab is pressed
    const tabs = UNSAFE_getByType(BottomNavigation);
    const keys = tabs.props.navigationState.routes.map((route: { key: string }) => route.key);

    await act(async () => tabs.props.onIndexChange(keys.indexOf('statistics')));
    expect(getSummary).toHaveBeenCalledTimes(1);

    await act(async () => tabs.props.onIndexChange(keys.indexOf('social')));
    await waitFor(() => expect(getSummary).toHaveBeenCalledTimes(2));
    expect(await findByRole('button', { name: 'Social', selected: true })).toBeTruthy();
  });
});
