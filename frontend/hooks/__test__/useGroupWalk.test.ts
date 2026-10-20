import { act, renderHook, waitFor } from '@testing-library/react-native';
import { groupWalkService } from '@/services/groupWalkService';
import { useSocialSummary } from '@/context/SocialSummaryProvider';
import { makeOrganiserWalk, makeWalkDetail } from '@/components/Social/__test__/groupWalkFixtures';
import { useGroupWalk } from '../useGroupWalk';

jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: {
    get: jest.fn(),
    respond: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    invite: jest.fn(),
    removeParticipant: jest.fn(),
  },
}));
jest.mock('@/context/SocialSummaryProvider', () => ({ useSocialSummary: jest.fn() }));

const service = groupWalkService as jest.Mocked<typeof groupWalkService>;
const refreshSummary = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  (useSocialSummary as jest.Mock).mockReturnValue({ refresh: refreshSummary });
  service.get.mockResolvedValue(makeWalkDetail());
});

const loaded = async () => {
  const hook = renderHook(() => useGroupWalk('w1'));
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
};

describe('useGroupWalk', () => {
  it('loads the walk', async () => {
    const { result } = await loaded();

    expect(service.get).toHaveBeenCalledWith('w1');
    expect(result.current.walk?.title).toBe('Sunday stroll');
  });

  it('shows the error state when the walk fails to load', async () => {
    service.get.mockRejectedValue({ response: { status: 404, data: { message: 'Group walk not found' } } });
    const { result } = renderHook(() => useGroupWalk('w1'));

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('answers the invitation, then reloads the walk and the badge', async () => {
    service.respond.mockResolvedValue({ myStatus: 'accepted' });
    const { result } = await loaded();
    service.get.mockResolvedValue(makeWalkDetail({ myStatus: 'accepted' }));

    let ok = false;
    await act(async () => {
      ok = await result.current.respond('accepted');
    });

    expect(ok).toBe(true);
    expect(service.respond).toHaveBeenCalledWith('w1', 'accepted');
    expect(result.current.walk?.myStatus).toBe('accepted');
    expect(refreshSummary).toHaveBeenCalled();
  });

  it.each([
    ['update', 'update', [{ title: 'New' }], [{ title: 'New' }]],
    ['cancel', 'cancel', [], []],
    ['invite', 'invite', [['u4']], [['u4']]],
    ['removeParticipant', 'removeParticipant', ['u2'], ['u2']],
  ] as const)('%s shows the walk the server sends back', async (action, method, args, serviceArgs) => {
    const changed = makeOrganiserWalk({ title: `after ${action}` });
    (service[method] as jest.Mock).mockResolvedValue(changed);
    const { result } = await loaded();

    await act(async () => {
      await (result.current[action] as (...a: unknown[]) => Promise<boolean>)(...args);
    });

    expect(service[method]).toHaveBeenCalledWith('w1', ...serviceArgs);
    expect(result.current.walk?.title).toBe(`after ${action}`);
  });

  it("shows the backend's message when an action fails, and keeps the walk", async () => {
    service.cancel.mockRejectedValue({ response: { data: { message: 'This walk can no longer be changed' } } });
    const { result } = await loaded();

    let ok = true;
    await act(async () => {
      ok = await result.current.cancel();
    });

    expect(ok).toBe(false);
    expect(result.current.actionError).toBe('This walk can no longer be changed');
    expect(result.current.walk?.title).toBe('Sunday stroll');
  });
});
