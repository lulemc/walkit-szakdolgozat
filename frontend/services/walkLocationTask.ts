import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import type { Coordinates } from '@/services/routeService';

/**
 * Background location for an active walk. The OS delivers locations to a
 * task that must be defined at app start (imported in app/_layout.tsx), even
 * while the screen is locked; the walk screen listens to them here.
 */
export const WALK_LOCATION_TASK = 'walkit-walk-location';

type Listener = (points: Coordinates[]) => void;
const listeners = new Set<Listener>();

/** Passes the task's locations to whoever is tracking a walk */
export const handleWalkLocations = async ({
  data,
  error,
}: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
  if (error || !data?.locations) return;
  const points = data.locations.map(({ coords }) => ({
    latitude: coords.latitude,
    longitude: coords.longitude,
  }));
  listeners.forEach((listener) => listener(points));
};

TaskManager.defineTask(WALK_LOCATION_TASK, handleWalkLocations);

export const WALK_LOCATION_OPTIONS: Location.LocationTaskOptions = {
  // High instead of BestForNavigation, and a point every 5 m, to save battery
  accuracy: Location.Accuracy.High,
  distanceInterval: 5,
  activityType: Location.ActivityType.Fitness,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
  // Android: a notification while tracking, required for background location
  foregroundService: {
    notificationTitle: 'Tracking your walk',
    notificationBody: 'WalkIt records your route while the screen is off.',
  },
};

/** Starts background updates; resolves with a function that stops them */
export const startWalkLocationUpdates = async (listener: Listener): Promise<() => Promise<void>> => {
  listeners.add(listener);
  try {
    await Location.startLocationUpdatesAsync(WALK_LOCATION_TASK, WALK_LOCATION_OPTIONS);
  } catch (error) {
    listeners.delete(listener);
    throw error;
  }
  return async () => {
    listeners.delete(listener);
    if (await Location.hasStartedLocationUpdatesAsync(WALK_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(WALK_LOCATION_TASK);
    }
  };
};
