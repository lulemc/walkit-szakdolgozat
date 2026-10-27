import { useCallback, useEffect, useMemo, useState } from 'react';
import { RouteSummary, routeService } from '@/services/routeService';
import { apiErrorMessage } from '@/utils/apiError';

/** How many of the newest routes are offered besides the favourites */
export const RECENT_ROUTE_LIMIT = 10;
/** How many of the newest routes are loaded to find them (some may be favourites) */
export const RECENT_PAGE_SIZE = 20;

export type SavedRoutesStatus = 'loading' | 'ready' | 'error';

const byFavoritedAtDesc = (a: RouteSummary, b: RouteSummary) =>
  (b.favoritedAt ?? '').localeCompare(a.favoritedAt ?? '');

/**
 * My saved routes, split into favourites and the newest other routes, plus
 * the actions on them. Actions resolve with true when they worked, or false
 * with actionError set.
 */
export const useSavedRoutes = () => {
  // The newest routes (by creation) followed by the favourites that aren't among them
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [status, setStatus] = useState<SavedRoutesStatus>('loading');
  const [actionError, setActionError] = useState<string | null>(null);

  // State is only updated in the promise callbacks, after the requests finished
  const load = useCallback(
    () =>
      Promise.all([
        routeService.getUserRoutes({ limit: RECENT_PAGE_SIZE }),
        routeService.getFavoriteRoutes(),
      ]).then(
        ([newest, favourites]) => {
          const newestIds = new Set(newest.map((route) => route._id));
          setRoutes([...newest, ...favourites.filter((route) => !newestIds.has(route._id))]);
          setStatus('ready');
        },
        () => setStatus('error'),
      ),
    [],
  );

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
  const replace = (updated: RouteSummary) =>
    setRoutes((current) => current.map((route) => (route._id === updated._id ? updated : route)));

  const toggleFavorite = useCallback(
    (route: RouteSummary) =>
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
