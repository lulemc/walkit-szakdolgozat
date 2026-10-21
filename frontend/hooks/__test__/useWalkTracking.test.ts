import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { startWalkLocationUpdates } from '@/services/walkLocationTask';
import { MOCK_STEP_MS, useWalkTracking } from '../useWalkTracking';

jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));
jest.mock('@/services/walkLocationTask', () => ({
  startWalkLocationUpdates: jest.fn(),
}));

const location = Location as jest.Mocked<typeof Location>;
const startBackground = startWalkLocationUpdates as jest.Mock;

// Each step is about 111 m north
const route = {
  coordinates: [
    { latitude: 47.5, longitude: 19.04 },
    { latitude: 47.501, longitude: 19.04 },
    { latitude: 47.502, longitude: 19.04 },
    { latitude: 47.503, longitude: 19.04 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useWalkTracking with simulated GPS', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const step = (times = 1) =>
    act(() => {
      jest.advanceTimersByTime(MOCK_STEP_MS * times);
    });

  it('walks along the route, counting distance and time', () => {
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: true }));
    expect(result.current.status).toBe('tracking');

    step(3);

    expect(result.current.position).toEqual(route.coordinates[2]);
    expect(result.current.distanceM).toBeCloseTo(222.4, 0);
    expect(result.current.elapsedSec).toBe((3 * MOCK_STEP_MS) / 1000);
    expect(location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it("doesn't count time or distance while paused", () => {
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: true }));
    step(2);
    act(() => result.current.pause());
    const before = { distance: result.current.distanceM, time: result.current.elapsedSec };

    step(5);

    expect(result.current.isPaused).toBe(true);
    expect(result.current.distanceM).toBe(before.distance);
    expect(result.current.elapsedSec).toBe(before.time);
  });

  it('starts a new path segment after resuming', () => {
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: true }));
    step(2);
    act(() => result.current.pause());
    act(() => result.current.resume());

    step(1);

    expect(result.current.segments).toHaveLength(2);
    expect(result.current.isPaused).toBe(false);
  });

  it('continues from where it paused, without skipping points', () => {
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: true }));
    step(1);
    act(() => result.current.pause());
    step(2);
    act(() => result.current.resume());

    step(1);

    expect(result.current.position).toEqual(route.coordinates[1]);
  });

  it('tells when the end of the route is reached, once', () => {
    const onReachedEnd = jest.fn();
    renderHook(() => useWalkTracking({ route, mockGps: true, onReachedEnd }));

    step(route.coordinates.length + 3);

    expect(onReachedEnd).toHaveBeenCalledTimes(1);
  });

  it('stop() tells when the walk started and ended', () => {
    jest.setSystemTime(new Date('2030-01-02T09:00:00.000Z'));
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: true }));
    step(30);

    let times: { startedAt: Date; endedAt: Date } | undefined;
    act(() => {
      times = result.current.stop();
    });

    expect(times).toEqual({
      startedAt: new Date('2030-01-02T09:00:00.000Z'),
      endedAt: new Date('2030-01-02T09:01:00.000Z'),
    });
  });

  it('stops counting after stop()', () => {
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: true }));
    step(1);
    act(() => result.current.stop());
    const time = result.current.elapsedSec;

    step(3);

    expect(result.current.elapsedSec).toBe(time);
  });
});

describe('useWalkTracking with real GPS', () => {
  const granted = { status: 'granted' } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>;
  const denied = { status: 'denied' } as typeof granted;

  it('tracks in the background when allowed', async () => {
    const stopBackground = jest.fn();
    location.requestForegroundPermissionsAsync.mockResolvedValue(granted);
    location.requestBackgroundPermissionsAsync.mockResolvedValue(granted);
    startBackground.mockResolvedValue(stopBackground);
    const { result, unmount } = renderHook(() => useWalkTracking({ route, mockGps: false }));

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(result.current.backgroundTracking).toBe(true);

    const deliver = startBackground.mock.calls[0][0];
    act(() => deliver([route.coordinates[0], route.coordinates[1]]));

    expect(result.current.position).toEqual(route.coordinates[1]);
    expect(result.current.distanceM).toBeCloseTo(111.2, 0);

    unmount();
    expect(stopBackground).toHaveBeenCalled();
  });

  it('falls back to foreground tracking without background permission', async () => {
    const remove = jest.fn();
    location.requestForegroundPermissionsAsync.mockResolvedValue(granted);
    location.requestBackgroundPermissionsAsync.mockResolvedValue(denied);
    location.watchPositionAsync.mockResolvedValue({ remove } as never);
    const { result, unmount } = renderHook(() => useWalkTracking({ route, mockGps: false }));

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(result.current.backgroundTracking).toBe(false);
    expect(startBackground).not.toHaveBeenCalled();
    // Battery-friendly settings: high (not navigation) accuracy, a point every 5 m
    expect(location.watchPositionAsync).toHaveBeenCalledWith(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      expect.any(Function),
    );

    const onLocation = location.watchPositionAsync.mock.calls[0][1];
    act(() => onLocation({ coords: route.coordinates[1] } as Location.LocationObject));
    expect(result.current.position).toEqual(route.coordinates[1]);

    unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('falls back to foreground tracking when background tracking fails to start (e.g. Expo Go)', async () => {
    location.requestForegroundPermissionsAsync.mockResolvedValue(granted);
    location.requestBackgroundPermissionsAsync.mockResolvedValue(granted);
    startBackground.mockRejectedValue(new Error('Background location has not been configured'));
    location.watchPositionAsync.mockResolvedValue({ remove: jest.fn() } as never);
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: false }));

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(result.current.backgroundTracking).toBe(false);
    expect(location.watchPositionAsync).toHaveBeenCalled();
  });

  it('reports a denied location permission', async () => {
    location.requestForegroundPermissionsAsync.mockResolvedValue(denied);
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: false }));

    await waitFor(() => expect(result.current.status).toBe('permission-denied'));
    expect(location.watchPositionAsync).not.toHaveBeenCalled();
  });

  it("ignores points while paused, but still shows where I am", async () => {
    location.requestForegroundPermissionsAsync.mockResolvedValue(granted);
    location.requestBackgroundPermissionsAsync.mockResolvedValue(denied);
    location.watchPositionAsync.mockResolvedValue({ remove: jest.fn() } as never);
    const { result } = renderHook(() => useWalkTracking({ route, mockGps: false }));
    await waitFor(() => expect(result.current.status).toBe('tracking'));
    const onLocation = location.watchPositionAsync.mock.calls[0][1];
    act(() => onLocation({ coords: route.coordinates[0] } as Location.LocationObject));

    act(() => result.current.pause());
    act(() => onLocation({ coords: route.coordinates[3] } as Location.LocationObject));

    expect(result.current.position).toEqual(route.coordinates[3]);
    expect(result.current.distanceM).toBe(0);
  });
});
