import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Route, routeService } from '@/services/routeService';
import { apiErrorMessage } from '@/utils/apiError';

/** How many of the newest routes are offered besides the favourites */
export const RECENT_ROUTE_LIMIT = 10;

export type SavedRoutesStatus = 'loading' | 'ready' | 'error';

const byFavoritedAtDesc = (a: Route, b: Route) =>
  (b.favoritedAt ?? '').localeCompare(a.favoritedAt ?? '');

/**
 * My saved routes, split into favourites and the newest other routes, plus
 * the actions on them. Actions resolve with true when they worked, or false
 * with actionError set.
 */
export const useSavedRoutes = () => {
  const { user } = useAuth();
  const userId = user?._id;
  // Every route, newest first, as the server lists them (favourites included)
  const [routes, setRoutes] = useState<Route[]>([]);
  const [status, setStatus] = useState<SavedRoutesStatus>('loading');
  const [actionError, setActionError] = useState<string | null>(null);

  // State is only updated in the promise callbacks, after the request finished
  const load = useCallback(() => {
    if (!userId) return Promise.resolve();
    return routeService.getUserRoutes(userId).then(
      (loaded) => {
        setRoutes(loaded);
        setStatus('ready');
      },
      () => setStatus('error'),
    );
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(() => {
    setStatus('loading');
    return load();
  }, [load]);

  const favourites = useMemo(
    () => routes.filter((route) => route.isFavorite).sort(byFavoritedAtDesc),
    [routes],
  );
  const recent = useMemo(
    () => routes.filter((route) => !route.isFavorite).slice(0, RECENT_ROUTE_LIMIT),
    [routes],
  );

  const runAction = useCallback(async (action: () => Promise<void>): Promise<boolean> => {
    setActionError(null);
    try {
      await action();
      return true;
    } catch (error) {
      setActionError(apiErrorMessage(error));
      return false;
    }
  }, []);

  /** Puts the server's updated copy of a route in place of the old one */
  const replace = (updated: Route) =>
    setRoutes((current) => current.map((route) => (route._id === updated._id ? updated : route)));

  const toggleFavorite = useCallback(
    (route: Route) =>
      runAction(async () =>
        replace(
          await (route.isFavorite
            ? routeService.removeFavorite(route._id)
            : routeService.addFavorite(route._id)),
        ),
      ),
    [runAction],
  );

  const rename = useCallback(
    (routeId: string, name: string) =>
      runAction(async () => replace(await routeService.renameRoute(routeId, name))),
    [runAction],
  );

  const remove = useCallback(
    (routeId: string) =>
      runAction(async () => {
        await routeService.deleteRoute(routeId);
        setRoutes((current) => current.filter((route) => route._id !== routeId));
      }),
    [runAction],
  );

  return { favourites, recent, status, actionError, reload, toggleFavorite, rename, remove };
};
