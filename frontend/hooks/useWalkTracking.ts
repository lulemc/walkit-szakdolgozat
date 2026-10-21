import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '@/services/routeService';
import { startWalkLocationUpdates } from '@/services/walkLocationTask';
import { segmentsDistance } from '@/utils/walkMetrics';

/** How often the simulated GPS moves to the next point of the route */
export const MOCK_STEP_MS = 2000;
const TICK_MS = 1000;

export type WalkTrackingStatus = 'starting' | 'tracking' | 'permission-denied' | 'error';

interface Options {
  route: { coordinates: Coordinates[] };
  /** Walk the route with simulated positions instead of the GPS */
  mockGps: boolean;
  /** Called once when the simulated walk reaches the end of the route */
  onReachedEnd?: () => void;
}

/**
 * Tracks an active walk: position, the walked path, distance and time.
 * While paused, neither time nor distance counts; each resume starts a new
 * path segment so the gap isn't counted as walked. Real GPS keeps tracking
 * with the screen locked when background location is allowed.
 */
export const useWalkTracking = ({ route, mockGps, onReachedEnd }: Options) => {
  const [status, setStatus] = useState<WalkTrackingStatus>(mockGps ? 'tracking' : 'starting');
  const [position, setPosition] = useState<Coordinates>(route.coordinates[0]);
  const [segments, setSegments] = useState<Coordinates[][]>([[]]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [backgroundTracking, setBackgroundTracking] = useState(false);

  // Active time so far, and when the current running stretch started (null while paused/stopped)
  const activeMs = useRef(0);
  const runningSince = useRef<number | null>(null);
  const paused = useRef(false);
  const stopSource = useRef<(() => void) | null>(null);
  const reachedEnd = useRef(onReachedEnd);
  useEffect(() => {
    reachedEnd.current = onReachedEnd;
  }, [onReachedEnd]);

  const currentElapsedSec = () =>
    Math.floor((activeMs.current + (runningSince.current ? Date.now() - runningSince.current : 0)) / 1000);

  const addPoints = useCallback((points: Coordinates[]) => {
    if (points.length === 0) return;
    setPosition(points[points.length - 1]);
    if (paused.current) return;
    setSegments((current) => [...current.slice(0, -1), [...current[current.length - 1], ...points]]);
  }, []);

  // The clock, running from when the walk screen opens
  useEffect(() => {
    runningSince.current = Date.now();
    const timer = setInterval(() => setElapsedSec(currentElapsedSec()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // The position source: simulated or GPS
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    if (mockGps) {
      let index = 0;
      const timer = setInterval(() => {
        if (paused.current) return;
        if (index < route.coordinates.length) {
          addPoints([route.coordinates[index]]);
          index += 1;
        } else {
          clearInterval(timer);
          reachedEnd.current?.();
        }
      }, MOCK_STEP_MS);
      cleanup = () => clearInterval(timer);
    } else {
      const startGps = async () => {
        const foreground = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (foreground.status !== 'granted') {
          setStatus('permission-denied');
          return;
        }

        // With background permission the walk keeps recording with the screen locked
        const background = await Location.requestBackgroundPermissionsAsync().catch(() => null);
        if (cancelled) return;
        if (background?.status === 'granted') {
          try {
            const stop = await startWalkLocationUpdates(addPoints);
            if (cancelled) return void stop();
            cleanup = () => void stop();
            setBackgroundTracking(true);
            setStatus('tracking');
            return;
          } catch {
            // e.g. Expo Go, which can't track in the background: use foreground tracking
          }
        }

        const subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          ({ coords }) => addPoints([{ latitude: coords.latitude, longitude: coords.longitude }]),
        );
        if (cancelled) return void subscription.remove();
        cleanup = () => subscription.remove();
        setStatus('tracking');
      };
      startGps().catch(() => {
        if (!cancelled) setStatus('error');
      });
    }

    const stop = () => {
      cancelled = true;
      cleanup?.();
      cleanup = null;
    };
    stopSource.current = stop;
    return stop;
  }, [mockGps, route, addPoints]);

  const pause = useCallback(() => {
    if (paused.current) return;
    paused.current = true;
    if (runningSince.current) activeMs.current += Date.now() - runningSince.current;
    runningSince.current = null;
    setIsPaused(true);
    setElapsedSec(Math.floor(activeMs.current / 1000));
  }, []);

  const resume = useCallback(() => {
    if (!paused.current) return;
    paused.current = false;
    runningSince.current = Date.now();
    setIsPaused(false);
    setSegments((current) => [...current, []]);
  }, []);

  /** Ends tracking: stops the position source and the clock */
  const stop = useCallback(() => {
    if (runningSince.current) activeMs.current += Date.now() - runningSince.current;
    runningSince.current = null;
    paused.current = true;
    stopSource.current?.();
    setElapsedSec(Math.floor(activeMs.current / 1000));
  }, []);

  return {
    status,
    position,
    segments,
    distanceM: segmentsDistance(segments),
    elapsedSec,
    isPaused,
    backgroundTracking,
    pause,
    resume,
    stop,
  };
};
