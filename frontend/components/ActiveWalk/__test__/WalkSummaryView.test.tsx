import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { shareWalkImage, SharingUnavailableError } from '@/services/shareWalk';
import { WalkSummaryView } from '../WalkSummaryView';

jest.mock('@/services/shareWalk', () => ({
  ...jest.requireActual('@/services/shareWalk'),
  shareWalkImage: jest.fn(),
}));

const share = shareWalkImage as jest.Mock;
const props = {
  distanceM: 1234,
  elapsedSec: 3725,
  saving: false,
  error: null,
  favorite: 'hidden' as const,
  onSave: jest.fn(),
  onDiscard: jest.fn(),
  onFavorite: jest.fn(),
  segments: [
    [
      { latitude: 47.5, longitude: 19.04 },
      { latitude: 47.501, longitude: 19.041 },
    ],
  ],
  endedAt: new Date(2030, 0, 2, 10, 30),
};

beforeEach(() => {
  jest.clearAllMocks();
  share.mockResolvedValue(undefined);
});

describe('WalkSummaryView sharing', () => {
  it('shows the walked path and the date on the card that is shared', () => {
    const { getByTestId, getByText } = renderWithTheme(<WalkSummaryView {...props} />);

    expect(getByTestId('walk-path')).toBeTruthy();
    expect(getByText('WalkIt')).toBeTruthy();
    expect(getByText('January 2, 2030')).toBeTruthy();
  });

  it('shares a picture of the card', async () => {
    const { getByText } = renderWithTheme(<WalkSummaryView {...props} />);

    await act(async () => fireEvent.press(getByText('Share')));

    expect(share).toHaveBeenCalledWith(expect.objectContaining({ current: expect.anything() }), 'Share your walk');
  });

  it("says when sharing didn't work", async () => {
    share.mockRejectedValue(new Error('capture failed'));
    const { getByText } = renderWithTheme(<WalkSummaryView {...props} />);

    await act(async () => fireEvent.press(getByText('Share')));

    expect(getByText("Couldn't share the walk. Please try again.")).toBeTruthy();
  });

  it("says when the phone can't share at all", async () => {
    share.mockRejectedValue(new SharingUnavailableError());
    const { getByText } = renderWithTheme(<WalkSummaryView {...props} />);

    await act(async () => fireEvent.press(getByText('Share')));

    expect(getByText("Sharing isn't available on this phone.")).toBeTruthy();
  });

  it('leaves the path out when nothing was recorded', () => {
    const { queryByTestId, getByText } = renderWithTheme(<WalkSummaryView {...props} segments={[]} />);

    expect(queryByTestId('walk-path')).toBeNull();
    expect(getByText('Share')).toBeTruthy();
  });
});
