import React from 'react';
import { RefreshControl } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import i18n from '@/i18n';
import { groupWalkService } from '@/services/groupWalkService';
import { GroupWalksSection } from '../GroupWalksSection';
import { makeWalkSummary } from './groupWalkFixtures';

jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: { list: jest.fn() },
}));
jest.mock('@/context/AuthProvider', () => ({
  useAuth: () => ({ user: { _id: 'u2', name: 'Ann' } }),
}));

const list = groupWalkService.list as jest.Mock;

const invitation = makeWalkSummary({ _id: 'w1', title: 'Sunday stroll' });
const mine = makeWalkSummary({
  _id: 'w2',
  title: undefined,
  organiser: { _id: 'u2', name: 'Ann' },
  myStatus: 'accepted',
  counts: { accepted: 2, invited: 1, declined: 0 },
});
const cancelled = makeWalkSummary({ _id: 'w3', title: 'Called off', status: 'cancelled', myStatus: 'accepted' });
const past = makeWalkSummary({ _id: 'w4', title: 'Last summer', scheduledAt: '2020-07-01T15:00:00.000Z', myStatus: 'accepted' });

const setLists = (lists: { invitations?: unknown[]; upcoming?: unknown[]; past?: unknown[] }) =>
  list.mockImplementation(async (scope: 'invitations' | 'upcoming' | 'past') => lists[scope] ?? []);

beforeEach(() => {
  jest.clearAllMocks();
  setLists({ invitations: [invitation], upcoming: [mine, cancelled], past: [past] });
});

const renderSection = async (props: Partial<React.ComponentProps<typeof GroupWalksSection>> = {}) => {
  const handlers = { onOpenWalk: jest.fn(), onNewWalk: jest.fn() };
  const screen = renderWithTheme(<GroupWalksSection {...handlers} {...props} />);
  await screen.findByText('Sunday stroll');
  return { ...screen, ...handlers };
};

describe('GroupWalksSection', () => {
  it('shows invitations, upcoming and past walks in their own sections', async () => {
    const { getByText } = await renderSection();

    expect(getByText('Invitations')).toBeTruthy();
    expect(getByText('Upcoming')).toBeTruthy();
    expect(getByText('Past')).toBeTruthy();
    expect(getByText('Last summer')).toBeTruthy();
  });

  it('describes each walk: local time, organiser, who is coming and my status', async () => {
    const { getByLabelText } = await renderSection();

    // 13:30 UTC is 10:30 in São Paulo, where the tests run
    expect(getByLabelText(/^Sunday stroll, Wed, Jan 2, 2030 · 10:30 AM/)).toBeTruthy();
    expect(getByLabelText(/Sunday stroll.*Organised by Olga.*Invited/)).toBeTruthy();
    // Untitled walks are named after their route; I organise this one
    expect(getByLabelText(/^Riverside loop.*You're organising.*2 going · 1 invited.*Going/)).toBeTruthy();
    expect(getByLabelText(/^Called off.*Cancelled/)).toBeTruthy();
  });

  it('opens a walk', async () => {
    const { getByLabelText, onOpenWalk } = await renderSection();

    fireEvent.press(getByLabelText(/^Sunday stroll/));

    expect(onOpenWalk).toHaveBeenCalledWith('w1');
  });

  it('starts planning a new walk', async () => {
    const { getByText, onNewWalk } = await renderSection();

    fireEvent.press(getByText('New group walk'));

    expect(onNewWalk).toHaveBeenCalled();
  });

  it('says when a section is empty', async () => {
    setLists({ invitations: [invitation] });
    const { getByText } = await renderSection();

    expect(getByText('No upcoming walks. Plan one or accept an invitation.')).toBeTruthy();
    expect(getByText('No past walks yet.')).toBeTruthy();
  });

  it('hides the invitations section when there are none', async () => {
    setLists({ upcoming: [makeWalkSummary({ title: 'Sunday stroll', myStatus: 'accepted' })] });
    const { queryByText } = await renderSection();

    expect(queryByText('Invitations')).toBeNull();
  });

  it('offers a retry when the walks fail to load', async () => {
    list.mockRejectedValueOnce(new Error('Network Error'));
    const { findByText, getByText } = renderWithTheme(
      <GroupWalksSection onOpenWalk={jest.fn()} onNewWalk={jest.fn()} />,
    );

    expect(await findByText("Couldn't load your group walks")).toBeTruthy();
    fireEvent.press(getByText('Try again'));

    expect(await findByText('Sunday stroll')).toBeTruthy();
  });

  it('reloads on pull-to-refresh', async () => {
    const { UNSAFE_getByType } = await renderSection();
    list.mockClear();

    await act(async () => UNSAFE_getByType(RefreshControl).props.onRefresh());

    expect(list).toHaveBeenCalledTimes(3);
  });

  it('shows extra content above the lists, like the hub header', async () => {
    const { Text } = jest.requireActual('react-native');
    const { getByText } = await renderSection({ header: <Text>Header</Text> });

    expect(getByText('Header')).toBeTruthy();
  });
});

describe('GroupWalksSection in Hungarian', () => {
  beforeEach(() => i18n.changeLanguage('hu'));
  // Switching back re-renders the screen still on show
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('shows the sections, the walks and their dates in Hungarian', async () => {
    const { getByText, getByLabelText } = await renderSection();

    expect(getByText('Meghívások')).toBeTruthy();
    expect(getByText('Közelgő')).toBeTruthy();
    expect(getByText('Korábbi')).toBeTruthy();
    expect(getByText('Új közös séta')).toBeTruthy();
    // Hungarian date order and 24-hour time
    expect(getByLabelText(/^Sunday stroll, 2030\. jan\. 2\.,.* · 10:30, Szervező: Olga.*Meghívva/)).toBeTruthy();
    expect(getByLabelText(/^Riverside loop.*Te szervezed.*2 jön · 1 meghívva.*Jön/)).toBeTruthy();
    expect(getByLabelText(/^Called off.*Lemondva/)).toBeTruthy();
  });
});
