import { act, renderHook, waitFor } from '@testing-library/react-native';
import { walkService } from '@/services/walkService';
import { WALK_PAGE_SIZE, useWalkHistory } from '../useWalkHistory';

jest.mock('@/services/walkService', () => ({
  walkService: { list: jest.fn(), onWalkSaved: jest.fn() },
}));

const service = walkService as jest.Mocked<typeof walkService>;
const walk = (n: number) => ({
  _id: `w${n}`,
  routeId: null,
  groupWalkId: null,
  name: `Walk ${n}`,
  // A higher n is newer
  startedAt: new Date(Date.UTC(2030, 0, 1, 0, n)).toISOString(),
  endedAt: new Date(Date.UTC(2030, 0, 1, 1, n)).toISOString(),
  durationSec: 600,
  distanceM: 1000,
});
/** Newest first, as the server sends them */
const page = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => walk(to - i));
let notifySaved: () => void;
const unsubscribe = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  service.list.mockResolvedValue(page(1, 3));
  service.onWalkSaved.mockImplementation((listener) => {
    notifySaved = () => listener({} as never);
    return unsubscribe;
  });
});

const loaded = async () => {
  const hook = renderHook(() => useWalkHistory());
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
};

describe('useWalkHistory', () => {
  it('loads my newest walks', async () => {
    const { result } = await loaded();

    expect(service.list).toHaveBeenCalledWith({ limit: WALK_PAGE_SIZE });
    expect(result.current.walks.map((w) => w._id)).toEqual(['w3', 'w2', 'w1']);
    expect(result.current.hasMore).toBe(false);
  });

  it('loads older walks after the oldest one shown', async () => {
    service.list.mockResolvedValueOnce(page(21, 20 + WALK_PAGE_SIZE));
    const { result } = await loaded();
    expect(result.current.hasMore).toBe(true);

    service.list.mockResolvedValueOnce(page(19, 20));
    await act(async () => result.current.loadMore());

    expect(service.list).toHaveBeenLastCalledWith({ before: walk(21).startedAt, limit: WALK_PAGE_SIZE });
    expect(result.current.walks.at(-1)?._id).toBe('w19');
    expect(result.current.hasMore).toBe(false);
  });

  it('reloads when a walk is saved, and stops listening when unmounted', async () => {
    const { result, unmount } = await loaded();
    service.list.mockResolvedValue(page(1, 4));

    await act(async () => notifySaved());

    expect(result.current.walks[0]._id).toBe('w4');
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('shows the error state when the first load fails, and keeps the list when a reload fails', async () => {
    service.list.mockRejectedValueOnce(new Error('Network Error'));
    const { result } = renderHook(() => useWalkHistory());
    await waitFor(() => expect(result.current.status).toBe('error'));

    await act(async () => result.current.refresh());
    expect(result.current.status).toBe('ready');

    service.list.mockRejectedValueOnce(new Error('Network Error'));
    await act(async () => result.current.refresh());
    expect(result.current.status).toBe('ready');
    expect(result.current.walks).toHaveLength(3);
  });
});
