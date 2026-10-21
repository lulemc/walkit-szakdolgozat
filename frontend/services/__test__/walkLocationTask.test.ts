import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  WALK_LOCATION_OPTIONS,
  WALK_LOCATION_TASK,
  handleWalkLocations,
  startWalkLocationUpdates,
} from '../walkLocationTask';

jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  ActivityType: { Fitness: 3 },
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  hasStartedLocationUpdatesAsync: jest.fn(),
}));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));

const location = Location as jest.Mocked<typeof Location>;
const point = { latitude: 47.5, longitude: 19.04 };
const delivery = (locations: object[]) =>
  ({ data: { locations }, error: null, executionInfo: {} }) as never;

beforeEach(() => {
  location.startLocationUpdatesAsync.mockClear().mockResolvedValue(undefined);
  location.stopLocationUpdatesAsync.mockClear().mockResolvedValue(undefined);
  location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
});

describe('walk location task', () => {
  it('is defined when the module loads, so the OS can wake it', () => {
    expect(TaskManager.defineTask).toHaveBeenCalledWith(WALK_LOCATION_TASK, handleWalkLocations);
  });

  it('passes delivered locations to the walk, then stops', async () => {
    const listener = jest.fn();
    const stop = await startWalkLocationUpdates(listener);

    handleWalkLocations(delivery([{ coords: { ...point, accuracy: 5 } }]));
    expect(listener).toHaveBeenCalledWith([point]);
    expect(location.startLocationUpdatesAsync).toHaveBeenCalledWith(WALK_LOCATION_TASK, WALK_LOCATION_OPTIONS);

    await stop();
    handleWalkLocations(delivery([{ coords: point }]));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(location.stopLocationUpdatesAsync).toHaveBeenCalledWith(WALK_LOCATION_TASK);
  });

  it('uses battery-friendly settings and an Android tracking notification', () => {
    expect(WALK_LOCATION_OPTIONS).toEqual(
      expect.objectContaining({
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        foregroundService: expect.objectContaining({ notificationTitle: 'Tracking your walk' }),
      }),
    );
  });

  it("doesn't keep the listener when starting fails", async () => {
    const listener = jest.fn();
    location.startLocationUpdatesAsync.mockRejectedValue(new Error('not configured'));

    await expect(startWalkLocationUpdates(listener)).rejects.toThrow('not configured');
    handleWalkLocations(delivery([{ coords: point }]));

    expect(listener).not.toHaveBeenCalled();
  });

  it('ignores task errors', () => {
    const listener = jest.fn();
    startWalkLocationUpdates(listener);

    handleWalkLocations({
      data: { locations: [{ coords: point }] },
      error: { message: 'x', code: 0 },
      executionInfo: {},
    } as never);

    expect(listener).not.toHaveBeenCalled();
  });
});
