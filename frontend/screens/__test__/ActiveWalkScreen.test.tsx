import React from 'react';
import { Alert, AlertButton, BackHandler } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import { routeService } from '@/services/routeService';
import { useWalkTracking } from '@/hooks/useWalkTracking';
import ActiveWalkScreen from '../ActiveWalkScreen';

jest.mock('@/hooks/useWalkTracking', () => ({ useWalkTracking: jest.fn() }));

const useTracking = useWalkTracking as jest.Mock;
const addFavorite = jest.spyOn(routeService, 'addFavorite');
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
  segments: [[]],
  distanceM: 1234,
  elapsedSec: 600,
  isPaused: false,
  backgroundTracking: true,
  pause: jest.fn(),
  resume: jest.fn(),
  stop: jest.fn(),
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
const alertButtons = () => (alert.mock.calls.at(-1)?.[2] as AlertButton[]).map((b) => b.text);

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
    it('shows a summary, then ends the walk', async () => {
      const { getByText, onEndWalk } = renderWalk();

      fireEvent.press(getByText('Finish Walk'));
      expect(alert.mock.calls.at(-1)?.[1]).toBe('Distance: 1.23km\nTime: 10m 0s');
      await pressAlertButton('Finish');

      expect(tracking.stop).toHaveBeenCalled();
      expect(onEndWalk).toHaveBeenCalled();
    });

    it('really saves the route as a favourite', async () => {
      addFavorite.mockResolvedValue(makeRoute({ isFavorite: true }));
      const { getByText, onEndWalk } = renderWalk();

      fireEvent.press(getByText('Finish Walk'));
      await pressAlertButton('Save as Favorite');

      expect(addFavorite).toHaveBeenCalledWith('r1');
      expect(alert).toHaveBeenLastCalledWith('Saved', 'The route is in your favourites now.', expect.any(Array));
      await pressAlertButton('OK');
      expect(onEndWalk).toHaveBeenCalled();
    });

    it('says so when saving the favourite fails', async () => {
      addFavorite.mockRejectedValue({ response: { data: { message: 'Route not found' } } });
      const { getByText, onEndWalk } = renderWalk();

      fireEvent.press(getByText('Finish Walk'));
      await pressAlertButton('Save as Favorite');

      expect(alert).toHaveBeenLastCalledWith("Couldn't save the favourite", 'Route not found', expect.any(Array));
      await pressAlertButton('OK');
      expect(onEndWalk).toHaveBeenCalled();
    });

    it("doesn't offer favourites for a group walk's route, which isn't my saved route", () => {
      const { getByText } = renderWalk({ groupWalkId: 'w1' });

      fireEvent.press(getByText('Finish Walk'));

      expect(alertButtons()).toEqual(['Finish']);
    });

    it("doesn't offer favourites for a route that already is one", () => {
      const { getByText } = renderWalk({ route: { ...route, isFavorite: true } });

      fireEvent.press(getByText('Finish Walk'));

      expect(alertButtons()).toEqual(['Finish']);
    });

    it('shows the summary when the simulated walk reaches the end', () => {
      renderWalk();
      const { onReachedEnd } = useTracking.mock.calls.at(-1)[0];

      act(() => onReachedEnd());

      expect(alert.mock.calls.at(-1)?.[0]).toBe('Walk complete! 🎉');
    });
  });

  describe("Android's back button", () => {
    it('asks before ending the walk', async () => {
      const { onEndWalk } = renderWalk();

      let handled = false;
      act(() => {
        handled = backHandler();
      });

      expect(handled).toBe(true);
      expect(alert.mock.calls.at(-1)?.[0]).toBe('End this walk?');
      await pressAlertButton('Keep walking');
      expect(onEndWalk).not.toHaveBeenCalled();

      act(() => {
        backHandler();
      });
      await pressAlertButton('End walk');
      await waitFor(() => expect(onEndWalk).toHaveBeenCalled());
      expect(tracking.stop).toHaveBeenCalled();
    });
  });
});
