import { act, renderHook, waitFor } from '@testing-library/react-native';
import { walkService } from '@/services/walkService';
import { useWalkStats } from '../useWalkStats';

jest.mock('@/services/walkService', () => ({
  walkService: { stats: jest.fn(), onWalkSaved: jest.fn() },
}));

const service = walkService as jest.Mocked<typeof walkService>;
const stats = { walkCount: 2, totalDistanceM: 5000, totalDurationSec: 3600 };
let notifySaved: () => void;

beforeEach(() => {
  jest.clearAllMocks();
  service.stats.mockResolvedValue(stats);
  service.onWalkSaved.mockImplementation((listener) => {
    notifySaved = () => listener({} as never);
    return jest.fn();
  });
});

describe('useWalkStats', () => {
  it("loads this week's totals, counted from Monday", async () => {
    const { result } = renderHook(() => useWalkStats(new Date(2030, 0, 2, 12, 0)));

    await waitFor(() => expect(result.current.stats).toEqual(stats));
    expect(service.stats).toHaveBeenCalledWith({ from: new Date(2029, 11, 31).toISOString() });
  });

  it('reloads when a walk is saved', async () => {
    const { result } = renderHook(() => useWalkStats(new Date(2030, 0, 2, 12, 0)));
    await waitFor(() => expect(result.current.stats).toEqual(stats));
    service.stats.mockResolvedValue({ ...stats, walkCount: 3 });

    await act(async () => notifySaved());

    expect(result.current.stats?.walkCount).toBe(3);
  });

  it('stays empty when the totals fail to load', async () => {
    service.stats.mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useWalkStats(new Date(2030, 0, 2, 12, 0)));

    await waitFor(() => expect(service.stats).toHaveBeenCalled());
    expect(result.current.stats).toBeNull();
  });
});
