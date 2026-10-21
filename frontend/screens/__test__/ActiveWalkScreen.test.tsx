import React from 'react';
import { Alert, AlertButton, BackHandler } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import { routeService } from '@/services/routeService';
import { walkService } from '@/services/walkService';
import { useWalkTracking } from '@/hooks/useWalkTracking';
import ActiveWalkScreen from '../ActiveWalkScreen';

jest.mock('@/hooks/useWalkTracking', () => ({ useWalkTracking: jest.fn() }));

const useTracking = useWalkTracking as jest.Mock;
const addFavorite = jest.spyOn(routeService, 'addFavorite');
const recordWalk = jest.spyOn(walkService, 'record');
const alert = jest.spyOn(Alert, 'alert');

const route = makeRoute({
  _id: 'r1',
  totalDistance: 5200,
  coordinates: [
    { latitude: 47.5, longitude: 19.04 },
    { latitude: 47.51, longitude: 19.05 },
  ],
});

const tracking = {
  status: 'tracking',
  position: route.coordinates[0],
  segments: [[route.coordinates[0], route.coordinates[1]], []],
  distanceM: 1234,
  elapsedSec: 600,
  isPaused: false,
  backgroundTracking: true,
  pause: jest.fn(),
  resume: jest.fn(),
  stop: jest.fn(() => ({
    startedAt: new Date('2030-01-02T09:00:00.000Z'),
    endedAt: new Date('2030-01-02T09:10:00.000Z'),
  })),
};

let backHandler: () => boolean;
const originalMockGps = process.env.EXPO_PUBLIC_USE_MOCK_GPS;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.EXPO_PUBLIC_USE_MOCK_GPS;
  useTracking.mockReturnValue(tracking);
  alert.mockImplementation(() => {});
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    backHandler = handler as () => boolean;
    return { remove: jest.fn() };
  });
});

afterAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCK_GPS = originalMockGps;
});

const renderWalk = (props: Partial<React.ComponentProps<typeof ActiveWalkScreen>> = {}) => {
  const onEndWalk = jest.fn();
  const screen = renderWithTheme(<ActiveWalkScreen route={route} onEndWalk={onEndWalk} {...props} />);
  return { ...screen, onEndWalk };
};

/** Presses a button of the last Alert shown */
const pressAlertButton = async (text: string) => {
  const buttons = alert.mock.calls.at(-1)?.[2] as AlertButton[];
  const button = buttons.find((b) => b.text === text);
  if (!button) throw new Error(`No "${text}" button in ${JSON.stringify(buttons?.map((b) => b.text))}`);
  await act(async () => button.onPress?.());
};

describe('ActiveWalkScreen', () => {
  it('uses the real GPS unless simulated GPS is switched on', () => {
    const { queryByText } = renderWalk();

    expect(useTracking).toHaveBeenCalledWith(expect.objectContaining({ route, mockGps: false }));
    expect(queryByText(/Simulated GPS/)).toBeNull();
  });

  it('walks with simulated GPS when EXPO_PUBLIC_USE_MOCK_GPS is "true"', () => {
    process.env.EXPO_PUBLIC_USE_MOCK_GPS = 'true';

    const { getByText } = renderWalk();

    expect(useTracking).toHaveBeenCalledWith(expect.objectContaining({ mockGps: true }));
    expect(getByText(/Simulated GPS/)).toBeTruthy();
  });

  it('shows distance, time and pace', () => {
    const { getByText } = renderWalk();

    expect(getByText('1.23km')).toBeTruthy();
    expect(getByText('/ 5.20km')).toBeTruthy();
    expect(getByText('10m 0s')).toBeTruthy();
    // 10 minutes for 1.234 km
    expect(getByText('8:06')).toBeTruthy();
  });

  it('warns that tracking stops with the screen locked when only foreground tracking works', () => {
    useTracking.mockReturnValue({ ...tracking, backgroundTracking: false });

    const { getByText } = renderWalk();

    expect(getByText(/Keep the screen on/)).toBeTruthy();
  });

  it('explains a denied location permission and lets me go back', () => {
    useTracking.mockReturnValue({ ...tracking, status: 'permission-denied' });
    const { getByText, onEndWalk } = renderWalk();

    expect(getByText('Location permission is needed to track your walk.')).toBeTruthy();
    fireEvent.press(getByText('Back'));

    expect(onEndWalk).toHaveBeenCalled();
  });

  it('pauses', () => {
    const { getByText } = renderWalk();

    fireEvent.press(getByText('Pause'));

    expect(tracking.pause).toHaveBeenCalled();
  });

  it('resumes while paused', () => {
    useTracking.mockReturnValue({ ...tracking, isPaused: true });
    const { getByText } = renderWalk();

    fireEvent.press(getByText('Resume'));

    expect(tracking.resume).toHaveBeenCalled();
  });

  describe('finishing', () => {
    const finish = async (screen: ReturnType<typeof renderWalk>) => {
      fireEvent.press(screen.getByText('Finish Walk'));
      return screen.findByText('Walk complete! 🎉');
    };

    it('stops tracking and shows a summary of the walk', async () => {
      const screen = renderWalk();

      await finish(screen);

      expect(tracking.stop).toHaveBeenCalled();
      expect(screen.getByText('1.23km')).toBeTruthy();
      expect(screen.getByText('10m 0s')).toBeTruthy();
      expect(screen.getByText('8:06')).toBeTruthy();
      expect(screen.queryByText('Pause')).toBeNull();
    });

    it('saves the walk on my route, then ends the walk', async () => {
      recordWalk.mockResolvedValue({ _id: 'walk1' } as never);
      const screen = renderWalk();
      await finish(screen);

      fireEvent.press(screen.getByText('Save walk'));

      await waitFor(() => expect(screen.onEndWalk).toHaveBeenCalled());
      expect(recordWalk).toHaveBeenCalledWith({
        routeId: 'r1',
        startedAt: '2030-01-02T09:00:00.000Z',
        endedAt: '2030-01-02T09:10:00.000Z',
        durationSec: 600,
        distanceM: 1234,
        // Empty segments (e.g. a resume right before finishing) are left out
        path: [[route.coordinates[0], route.coordinates[1]]],
      });
    });

    it("saves a group walk with its id, not as one of my routes", async () => {
      recordWalk.mockResolvedValue({ _id: 'walk1' } as never);
      const screen = renderWalk({ groupWalkId: 'w1' });
      await finish(screen);

      fireEvent.press(screen.getByText('Save walk'));

      await waitFor(() => expect(recordWalk).toHaveBeenCalled());
      expect(recordWalk.mock.calls[0][0]).toEqual(expect.objectContaining({ groupWalkId: 'w1' }));
      expect(recordWalk.mock.calls[0][0]).not.toHaveProperty('routeId');
    });

    it('shows the problem and stays when saving fails, so I can try again', async () => {
      recordWalk.mockRejectedValueOnce({ response: { data: { message: 'endedAt can\'t be in the future' } } });
      const screen = renderWalk();
      await finish(screen);

      fireEvent.press(screen.getByText('Save walk'));

      expect(await screen.findByText("endedAt can't be in the future")).toBeTruthy();
      expect(screen.onEndWalk).not.toHaveBeenCalled();
      expect(screen.getByText('Save walk')).toBeTruthy();
    });

    it('discards the walk after confirming', async () => {
      const screen = renderWalk();
      await finish(screen);

      fireEvent.press(screen.getByText('Discard'));
      expect(alert.mock.calls.at(-1)?.[0]).toBe('Discard this walk?');
      await pressAlertButton('Keep');
      expect(screen.onEndWalk).not.toHaveBeenCalled();

      fireEvent.press(screen.getByText('Discard'));
      await pressAlertButton('Discard');

      expect(screen.onEndWalk).toHaveBeenCalled();
      expect(recordWalk).not.toHaveBeenCalled();
    });

    it('adds the route to my favourites', async () => {
      addFavorite.mockResolvedValue(makeRoute({ isFavorite: true }));
      const screen = renderWalk();
      await finish(screen);

      fireEvent.press(screen.getByText('Add route to favourites'));

      expect(await screen.findByText('In your favourites')).toBeTruthy();
      expect(addFavorite).toHaveBeenCalledWith('r1');
    });

    it('says so when adding the favourite fails', async () => {
      addFavorite.mockRejectedValue({ response: { data: { message: 'Route not found' } } });
      const screen = renderWalk();
      await finish(screen);

      fireEvent.press(screen.getByText('Add route to favourites'));

      expect(await screen.findByText('Route not found')).toBeTruthy();
    });

    it("doesn't offer favourites for a group walk's route, which isn't my saved route", async () => {
      const screen = renderWalk({ groupWalkId: 'w1' });
      await finish(screen);

      expect(screen.queryByText('Add route to favourites')).toBeNull();
    });

    it("doesn't offer favourites for a route that already is one", async () => {
      const screen = renderWalk({ route: { ...route, isFavorite: true } });
      await finish(screen);

      expect(screen.queryByText('Add route to favourites')).toBeNull();
    });

    it('shows the summary when the simulated walk reaches the end', async () => {
      const screen = renderWalk();
      const { onReachedEnd } = useTracking.mock.calls.at(-1)[0];

      act(() => onReachedEnd());

      expect(await screen.findByText('Walk complete! 🎉')).toBeTruthy();
    });
  });

  describe("Android's back button", () => {
    it('asks before ending the walk, then shows the summary', async () => {
      const screen = renderWalk();

      let handled = false;
      act(() => {
        handled = backHandler();
      });

      expect(handled).toBe(true);
      expect(alert.mock.calls.at(-1)?.[0]).toBe('End this walk?');
      await pressAlertButton('Keep walking');
      expect(tracking.stop).not.toHaveBeenCalled();

      act(() => {
        backHandler();
      });
      await pressAlertButton('End walk');

      expect(await screen.findByText('Walk complete! 🎉')).toBeTruthy();
      expect(tracking.stop).toHaveBeenCalled();
    });

    it('asks before discarding on the summary', async () => {
      const screen = renderWalk();
      fireEvent.press(screen.getByText('Finish Walk'));
      await screen.findByText('Walk complete! 🎉');

      act(() => {
        backHandler();
      });
      expect(alert.mock.calls.at(-1)?.[0]).toBe('Discard this walk?');
      await pressAlertButton('Discard');

      expect(screen.onEndWalk).toHaveBeenCalled();
    });
  });
});
