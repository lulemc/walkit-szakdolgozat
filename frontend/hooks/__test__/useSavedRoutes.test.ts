import { act, renderHook, waitFor } from '@testing-library/react-native';
import { routeService } from '@/services/routeService';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import { RECENT_PAGE_SIZE, RECENT_ROUTE_LIMIT, useSavedRoutes } from '../useSavedRoutes';

const getUserRoutes = jest.spyOn(routeService, 'getUserRoutes');
const getFavoriteRoutes = jest.spyOn(routeService, 'getFavoriteRoutes');
const addFavorite = jest.spyOn(routeService, 'addFavorite');
const removeFavorite = jest.spyOn(routeService, 'removeFavorite');
const renameRoute = jest.spyOn(routeService, 'renameRoute');
const deleteRoute = jest.spyOn(routeService, 'deleteRoute');

// Favourites come from their own list; the newest routes from a page of all routes
const older = makeRoute({ _id: 'old', isFavorite: true, favoritedAt: '2030-01-01T10:00:00.000Z' });
const newer = makeRoute({ _id: 'new', isFavorite: true, favoritedAt: '2030-01-05T10:00:00.000Z' });
const plain = makeRoute({ _id: 'plain' });

beforeEach(() => {
  jest.clearAllMocks();
  getFavoriteRoutes.mockResolvedValue([newer, older]);
  // The newest routes, by creation: the favourite `newer` is older than this page
  getUserRoutes.mockResolvedValue([plain, older]);
});

const loaded = async () => {
  const hook = renderHook(() => useSavedRoutes());
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
};
const ids = (routes: { _id: string }[]) => routes.map((route) => route._id);

describe('useSavedRoutes', () => {
  it('loads my routes: favourites (most recently favourited first) and the other recent routes', async () => {
    const { result } = await loaded();

    expect(getFavoriteRoutes).toHaveBeenCalled();
    expect(getUserRoutes).toHaveBeenCalledWith({ limit: RECENT_PAGE_SIZE });
    // Also favourites that aren't among the newest routes
    expect(ids(result.current.favourites)).toEqual(['new', 'old']);
    expect(ids(result.current.recent)).toEqual(['plain']);
  });

  it(`keeps only the ${RECENT_ROUTE_LIMIT} newest non-favourite routes`, async () => {
    getFavoriteRoutes.mockResolvedValue([]);
    getUserRoutes.mockResolvedValue(Array.from({ length: 12 }, (_, i) => makeRoute({ _id: `r${i}` })));

    const { result } = await loaded();

    expect(ids(result.current.recent)).toEqual(Array.from({ length: 10 }, (_, i) => `r${i}`));
  });

  it('moves a route into the favourites, and back out', async () => {
    addFavorite.mockResolvedValue({ ...plain, isFavorite: true, favoritedAt: '2030-01-09T10:00:00.000Z' });
    removeFavorite.mockResolvedValue({ ...newer, isFavorite: false, favoritedAt: null });
    const { result } = await loaded();

    await act(async () => {
      await result.current.toggleFavorite(plain);
    });
    expect(addFavorite).toHaveBeenCalledWith('plain');
    expect(ids(result.current.favourites)).toEqual(['plain', 'new', 'old']);

    await act(async () => {
      await result.current.toggleFavorite(newer);
    });
    expect(removeFavorite).toHaveBeenCalledWith('new');
    expect(ids(result.current.favourites)).toEqual(['plain', 'old']);
    expect(ids(result.current.recent)).toEqual(['new']);
  });

  it('renames a route', async () => {
    renameRoute.mockResolvedValue({ ...plain, name: 'Hill loop' });
    const { result } = await loaded();

    let ok = false;
    await act(async () => {
      ok = await result.current.rename('plain', 'Hill loop');
    });

    expect(ok).toBe(true);
    expect(renameRoute).toHaveBeenCalledWith('plain', 'Hill loop');
    expect(result.current.recent[0].name).toBe('Hill loop');
  });

  it('deletes a route', async () => {
    deleteRoute.mockResolvedValue(undefined);
    const { result } = await loaded();

    await act(async () => {
      await result.current.remove('old');
    });

    expect(deleteRoute).toHaveBeenCalledWith('old');
    expect(ids(result.current.favourites)).toEqual(['new']);
  });

  it("shows the backend's message when an action fails, and keeps the lists", async () => {
    renameRoute.mockRejectedValue({ response: { data: { message: 'Route name is required' } } });
    const { result } = await loaded();

    let ok = true;
    await act(async () => {
      ok = await result.current.rename('plain', ' ');
    });

    expect(ok).toBe(false);
    expect(result.current.actionError).toBe('Route name is required');
    expect(ids(result.current.recent)).toEqual(['plain']);
  });

  it('shows the error state when loading fails, and can retry', async () => {
    getUserRoutes.mockRejectedValueOnce(new Error('Network Error'));
    const { result } = renderHook(() => useSavedRoutes());
    await waitFor(() => expect(result.current.status).toBe('error'));

    await act(async () => result.current.reload());

    expect(result.current.status).toBe('ready');
  });
});
