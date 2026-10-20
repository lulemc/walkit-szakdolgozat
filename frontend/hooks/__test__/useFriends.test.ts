import { act, renderHook, waitFor } from '@testing-library/react-native';
import { friendService } from '@/services/friendService';
import { useSocialSummary } from '@/context/SocialSummaryProvider';
import { useFriends } from '../useFriends';

jest.mock('@/services/friendService', () => ({
  friendService: {
    listFriends: jest.fn(),
    listRequests: jest.fn(),
    sendRequest: jest.fn(),
    acceptRequest: jest.fn(),
    declineRequest: jest.fn(),
    cancelRequest: jest.fn(),
    unfriend: jest.fn(),
  },
}));
jest.mock('@/context/SocialSummaryProvider', () => ({ useSocialSummary: jest.fn() }));

const service = friendService as jest.Mocked<typeof friendService>;
const refreshSummary = jest.fn().mockResolvedValue(undefined);

const friends = [{ friendshipId: 'f1', user: { _id: 'u2', name: 'Ann' }, since: '2026-10-01' }];
const requests = {
  incoming: [{ _id: 'r1', user: { _id: 'u3', name: 'Bob' }, createdAt: '2026-10-02' }],
  outgoing: [{ _id: 'r2', user: { _id: 'u4', name: 'Cid' }, createdAt: '2026-10-03' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  (useSocialSummary as jest.Mock).mockReturnValue({ refresh: refreshSummary });
  service.listFriends.mockResolvedValue(friends);
  service.listRequests.mockResolvedValue(requests);
});

const loaded = async () => {
  const hook = renderHook(() => useFriends());
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
};

describe('useFriends', () => {
  it('loads friends and requests', async () => {
    const { result } = await loaded();

    expect(result.current.friends).toEqual(friends);
    expect(result.current.requests).toEqual(requests);
  });

  it('shows the error state when the first load fails', async () => {
    service.listFriends.mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it.each([
    ['accept', 'acceptRequest', 'r1'],
    ['decline', 'declineRequest', 'r1'],
    ['cancel', 'cancelRequest', 'r2'],
    ['unfriend', 'unfriend', 'u2'],
    ['sendRequest', 'sendRequest', 'u5'],
  ] as const)('%s calls the service, reloads the lists and refreshes the badge', async (action, serviceFn, arg) => {
    (service[serviceFn] as jest.Mock).mockResolvedValue({ _id: 'x', status: 'pending' });
    const { result } = await loaded();
    service.listFriends.mockClear();

    // Every action takes a single id
    const run = result.current[action] as (id: string) => Promise<unknown>;
    await act(async () => {
      await run(arg);
    });

    expect(service[serviceFn]).toHaveBeenCalledWith(arg);
    expect(service.listFriends).toHaveBeenCalledTimes(1);
    expect(refreshSummary).toHaveBeenCalled();
  });

  it('returns the friendship from sendRequest so search can update its button', async () => {
    service.sendRequest.mockResolvedValue({ _id: 'r9', status: 'accepted' } as never);
    const { result } = await loaded();

    let friendship: unknown;
    await act(async () => {
      friendship = await result.current.sendRequest('u5');
    });

    expect(friendship).toEqual({ _id: 'r9', status: 'accepted' });
  });

  it("shows the backend's message when an action fails and changes nothing", async () => {
    service.acceptRequest.mockRejectedValue({
      response: { data: { message: 'Friend request not found' } },
    });
    const { result } = await loaded();
    service.listFriends.mockClear();

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.accept('r1');
    });

    expect(outcome).toBeNull();
    expect(result.current.actionError).toBe('Friend request not found');
    expect(service.listFriends).not.toHaveBeenCalled();
    expect(refreshSummary).not.toHaveBeenCalled();
  });

  it('refresh() shows the pull-to-refresh spinner while reloading', async () => {
    const { result } = await loaded();
    let finish: (value: unknown) => void = () => {};
    service.listFriends.mockReturnValue(new Promise((resolve) => (finish = resolve)) as never);

    let refreshing: Promise<void> = Promise.resolve();
    act(() => {
      refreshing = result.current.refresh();
    });
    expect(result.current.refreshing).toBe(true);

    await act(async () => {
      finish(friends);
      await refreshing;
    });
    expect(result.current.refreshing).toBe(false);
  });
});
