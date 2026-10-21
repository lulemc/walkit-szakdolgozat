import React from 'react';
import { RefreshControl } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { useWalkHistory } from '@/hooks/useWalkHistory';
import { useWalkStats } from '@/hooks/useWalkStats';
import { WalkHistorySection } from '../WalkHistorySection';

jest.mock('@/hooks/useWalkHistory', () => ({ useWalkHistory: jest.fn() }));
jest.mock('@/hooks/useWalkStats', () => ({ useWalkStats: jest.fn() }));

const history = {
  walks: [
    {
      _id: 'w1',
      routeId: 'r1',
      groupWalkId: null,
      name: 'Riverside loop',
      // 09:00 in São Paulo, where the tests run
      startedAt: '2030-01-02T12:00:00.000Z',
      endedAt: '2030-01-02T13:00:00.000Z',
      durationSec: 3000,
      distanceM: 4200,
    },
    {
      _id: 'w2',
      routeId: null,
      groupWalkId: 'g1',
      name: null,
      startedAt: '2030-01-01T12:00:00.000Z',
      endedAt: '2030-01-01T12:30:00.000Z',
      durationSec: 1500,
      distanceM: 900,
    },
  ],
  status: 'ready',
  hasMore: false,
  refreshing: false,
  loadingMore: false,
  refresh: jest.fn(),
  loadMore: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useWalkHistory as jest.Mock).mockReturnValue(history);
  (useWalkStats as jest.Mock).mockReturnValue({
    stats: { walkCount: 2, totalDistanceM: 5100, totalDurationSec: 4500 },
  });
});

const renderSection = () => {
  const onOpenWalk = jest.fn();
  return { ...renderWithTheme(<WalkHistorySection onOpenWalk={onOpenWalk} />), onOpenWalk };
};

describe('WalkHistorySection', () => {
  it("shows this week's totals", () => {
    const { getByLabelText } = renderSection();

    expect(getByLabelText('This week: 2 walks, 5.10km, 1h 15m 0s')).toBeTruthy();
  });

  it('lists my walks with their name, local time, distance and time', () => {
    const { getByLabelText } = renderSection();

    expect(getByLabelText('Riverside loop, Wed, Jan 2, 2030 · 9:00 AM, 4.20km, 50m 0s')).toBeTruthy();
    // Walks without a name, and group walks, are labelled as such
    expect(getByLabelText(/^Walk, Tue, Jan 1, 2030 · 9:00 AM, 900m, 25m 0s, Group walk/)).toBeTruthy();
  });

  it('opens a walk', () => {
    const { getByLabelText, onOpenWalk } = renderSection();

    fireEvent.press(getByLabelText(/^Riverside loop/));

    expect(onOpenWalk).toHaveBeenCalledWith('w1');
  });

  it('loads more when there are older walks', () => {
    (useWalkHistory as jest.Mock).mockReturnValue({ ...history, hasMore: true });
    const { getByText } = renderSection();

    fireEvent.press(getByText('Load more'));

    expect(history.loadMore).toHaveBeenCalled();
  });

  it('explains how walks get here when there are none', () => {
    (useWalkHistory as jest.Mock).mockReturnValue({ ...history, walks: [] });

    const { getByText } = renderSection();

    expect(getByText(/No walks yet/)).toBeTruthy();
  });

  it('offers a retry when the walks fail to load', () => {
    (useWalkHistory as jest.Mock).mockReturnValue({ ...history, walks: [], status: 'error' });
    const { getByText } = renderSection();

    fireEvent.press(getByText('Try again'));

    expect(history.refresh).toHaveBeenCalled();
  });

  it('reloads on pull-to-refresh', async () => {
    const { UNSAFE_getByType } = renderSection();

    await act(async () => UNSAFE_getByType(RefreshControl).props.onRefresh());

    expect(history.refresh).toHaveBeenCalled();
  });
});
