import api from '../api';
import { routeService, Route } from '../routeService';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

const route = (overrides: Partial<Route> = {}): Route => ({
  _id: 'r1',
  userId: 'u1',
  name: 'Riverside loop',
  type: 'circular',
  startLocation: { latitude: 47.5, longitude: 19.04, address: 'Start' },
  endLocation: { latitude: 47.5, longitude: 19.04, address: 'Start' },
  coordinates: [{ latitude: 47.5, longitude: 19.04 }],
  totalDistance: 5200,
  estimatedDuration: 65,
  preferenceScore: 70,
  preferences: {
    parks: true,
    waterfront: false,
    avoidHighways: true,
    scenic: false,
    uphill: false,
    mountain: false,
    quietStreets: false,
    beach: false,
  },
  elevationGain: 10,
  elevationLoss: 10,
  maxElevation: 120,
  minElevation: 100,
  isFavorite: false,
  favoritedAt: null,
  lastWalkedAt: null,
  walkCount: 0,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

describe('routeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generateRoute returns the route from { success, data }', async () => {
    const generated = route();
    mockedApi.post.mockResolvedValue({ data: { success: true, data: generated } });
    const request = {
      startLocation: { latitude: 47.5, longitude: 19.04 },
      distance: 5,
      routeType: 'circular' as const,
      preferences: generated.preferences,
    };

    await expect(routeService.generateRoute(request)).resolves.toEqual(generated);
    expect(mockedApi.post).toHaveBeenCalledWith('/routes/generate', request);
  });

  it("getUserRoutes returns my routes from GET /routes", async () => {
    const routes = [route(), route({ _id: 'r2' })];
    mockedApi.get.mockResolvedValue({ data: { success: true, data: routes } });

    await expect(routeService.getUserRoutes({ limit: 20 })).resolves.toEqual(routes);
    expect(mockedApi.get).toHaveBeenCalledWith('/routes', { params: { limit: 20 } });
  });

  it('getRoute returns one route from { success, data }', async () => {
    const saved = route();
    mockedApi.get.mockResolvedValue({ data: { success: true, data: saved } });

    await expect(routeService.getRoute('r1')).resolves.toEqual(saved);
    expect(mockedApi.get).toHaveBeenCalledWith('/routes/r1');
  });

  it('getFavoriteRoutes returns a page of favourite routes from { success, data }', async () => {
    const favorites = [route({ isFavorite: true, favoritedAt: '2026-10-02T10:00:00.000Z' })];
    mockedApi.get.mockResolvedValue({ data: { success: true, data: favorites } });

    await expect(routeService.getFavoriteRoutes()).resolves.toEqual(favorites);
    expect(mockedApi.get).toHaveBeenCalledWith('/routes/favorites/list', { params: {} });
  });

  it('deleteRoute deletes the route', async () => {
    mockedApi.delete.mockResolvedValue({ data: { success: true } });

    await routeService.deleteRoute('r1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/routes/r1');
  });

  it('addFavorite favourites the route and returns it', async () => {
    mockedApi.post.mockResolvedValue({ data: { success: true, data: route({ isFavorite: true }) } });

    const result = await routeService.addFavorite('r1');

    expect(mockedApi.post).toHaveBeenCalledWith('/routes/r1/favorite', {});
    expect(result.isFavorite).toBe(true);
  });

  it('removeFavorite takes the route out of the favourites and returns it', async () => {
    mockedApi.delete.mockResolvedValue({ data: { success: true, data: route({ isFavorite: false }) } });

    const result = await routeService.removeFavorite('r1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/routes/r1/favorite');
    expect(result.isFavorite).toBe(false);
  });

  it('renameRoute renames the route and returns it', async () => {
    mockedApi.patch.mockResolvedValue({ data: { success: true, data: route({ name: 'Hill loop' }) } });

    const result = await routeService.renameRoute('r1', 'Hill loop');

    expect(mockedApi.patch).toHaveBeenCalledWith('/routes/r1/name', { name: 'Hill loop' });
    expect(result.name).toBe('Hill loop');
  });

  it('passes request errors on to the caller', async () => {
    mockedApi.get.mockRejectedValue(new Error('Network Error'));

    await expect(routeService.getUserRoutes()).rejects.toThrow('Network Error');
  });
});
