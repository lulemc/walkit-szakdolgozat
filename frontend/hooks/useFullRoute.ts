import { useCallback, useEffect, useState } from 'react';
import { Route, routeService } from '@/services/routeService';

export type FullRouteStatus = 'loading' | 'ready' | 'error';

/** The whole route with its coordinates; lists only have a summary */
export const useFullRoute = (routeId: string) => {
  const [route, setRoute] = useState<Route | null>(null);
  const [status, setStatus] = useState<FullRouteStatus>('loading');

  // State is only updated in the promise callbacks, after the request finished
  const load = useCallback(
    () =>
      routeService.getRoute(routeId).then(
        (loaded) => {
          setRoute(loaded);
          setStatus('ready');
        },
        () => setStatus('error'),
      ),
    [routeId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const retry = useCallback(() => {
    setStatus('loading');
    return load();
  }, [load]);

  return { route, status, retry };
};
