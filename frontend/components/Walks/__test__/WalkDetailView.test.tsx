import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { useWalkDetail } from '@/hooks/useWalkDetail';
import { WalkDetailView } from '../WalkDetailView';

jest.mock('@/hooks/useWalkDetail', () => ({ useWalkDetail: jest.fn() }));

const walk = {
  _id: 'w1',
  routeId: 'r1',
  groupWalkId: null,
  name: 'Riverside loop',
  startedAt: '2030-01-02T12:00:00.000Z',
  endedAt: '2030-01-02T13:00:00.000Z',
  durationSec: 3000,
  distanceM: 4200,
  path: [
    [
      { latitude: 47.5, longitude: 19.04 },
      { latitude: 47.51, longitude: 19.05 },
    ],
  ],
};

const retry = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useWalkDetail as jest.Mock).mockReturnValue({ walk, status: 'ready', retry });
});

describe('WalkDetailView', () => {
  it('shows the walk: name, local time, distance, time, pace and the path on a map', () => {
    const { getByText, getByLabelText } = renderWithTheme(<WalkDetailView walkId="w1" onBack={jest.fn()} />);

    expect(useWalkDetail).toHaveBeenCalledWith('w1');
    expect(getByText('Riverside loop')).toBeTruthy();
    expect(getByText('Wed, Jan 2, 2030 · 9:00 AM')).toBeTruthy();
    expect(getByText('4.20km')).toBeTruthy();
    expect(getByText('50m 0s')).toBeTruthy();
    expect(getByText('11:54')).toBeTruthy();
    expect(getByLabelText('Map of the walk')).toBeTruthy();
  });

  it('says when no path was recorded', () => {
    (useWalkDetail as jest.Mock).mockReturnValue({ walk: { ...walk, path: [] }, status: 'ready', retry });

    const { getByText, queryByLabelText } = renderWithTheme(<WalkDetailView walkId="w1" onBack={jest.fn()} />);

    expect(getByText('No path was recorded for this walk.')).toBeTruthy();
    expect(queryByLabelText('Map of the walk')).toBeNull();
  });

  it('goes back', () => {
    const onBack = jest.fn();
    const { getByText } = renderWithTheme(<WalkDetailView walkId="w1" onBack={onBack} />);

    fireEvent.press(getByText('Back'));

    expect(onBack).toHaveBeenCalled();
  });

  it('offers a retry when the walk fails to load', () => {
    (useWalkDetail as jest.Mock).mockReturnValue({ walk: null, status: 'error', retry });
    const { getByText } = renderWithTheme(<WalkDetailView walkId="w1" onBack={jest.fn()} />);

    fireEvent.press(getByText('Try again'));

    expect(retry).toHaveBeenCalled();
  });
});
