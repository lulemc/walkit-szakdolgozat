import api from '../api';
import { walkService } from '../walkService';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;
const ok = (data: unknown) => ({ data: { success: true, data } });

const request = {
  routeId: 'r1',
  startedAt: '2030-01-02T09:00:00.000Z',
  endedAt: '2030-01-02T10:00:00.000Z',
  durationSec: 3000,
  distanceM: 4200,
  path: [[{ latitude: 47.5, longitude: 19.04 }]],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('walkService', () => {
  it('saves a walk', async () => {
    mockedApi.post.mockResolvedValue(ok({ _id: 'w1' }));

    await expect(walkService.record(request)).resolves.toEqual({ _id: 'w1' });
    expect(mockedApi.post).toHaveBeenCalledWith('/walks', request);
  });

  it('tells listeners when a walk was saved, until they unsubscribe', async () => {
    mockedApi.post.mockResolvedValue(ok({ _id: 'w1' }));
    const listener = jest.fn();
    const unsubscribe = walkService.onWalkSaved(listener);

    await walkService.record(request);
    unsubscribe();
    await walkService.record(request);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ _id: 'w1' });
  });

  it("doesn't tell listeners when saving fails", async () => {
    mockedApi.post.mockRejectedValue(new Error('Network Error'));
    const listener = jest.fn();
    walkService.onWalkSaved(listener);

    await expect(walkService.record(request)).rejects.toThrow('Network Error');
    expect(listener).not.toHaveBeenCalled();
  });

  it('lists a page of walks', async () => {
    mockedApi.get.mockResolvedValue(ok([{ _id: 'w1' }]));

    await expect(walkService.list({ before: '2030-01-01T00:00:00.000Z', limit: 10 })).resolves.toEqual([{ _id: 'w1' }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/walks', {
      params: { before: '2030-01-01T00:00:00.000Z', limit: 10 },
    });
  });

  it('gets one walk', async () => {
    mockedApi.get.mockResolvedValue(ok({ _id: 'w1', path: [] }));

    await expect(walkService.get('w1')).resolves.toEqual({ _id: 'w1', path: [] });
    expect(mockedApi.get).toHaveBeenCalledWith('/walks/w1');
  });

  it('gets the totals for a range', async () => {
    const stats = { walkCount: 2, totalDistanceM: 5000, totalDurationSec: 3600 };
    mockedApi.get.mockResolvedValue(ok(stats));

    await expect(walkService.stats({ from: '2030-01-01T00:00:00.000Z' })).resolves.toEqual(stats);
    expect(mockedApi.get).toHaveBeenCalledWith('/walks/stats', { params: { from: '2030-01-01T00:00:00.000Z' } });
  });
});
