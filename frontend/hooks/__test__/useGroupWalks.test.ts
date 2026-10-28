import { act, renderHook, waitFor } from '@testing-library/react-native';
import { groupWalkService } from '@/services/groupWalkService';
import { makeWalkSummary } from '@/components/Social/__test__/groupWalkFixtures';
import { syncWalkReminders } from '@/services/walkReminders';
import { useGroupWalks } from '../useGroupWalks';

jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: { list: jest.fn() },
}));

jest.mock('@/services/walkReminders', () => ({ syncWalkReminders: jest.fn(() => Promise.resolve()) }));

const list = groupWalkService.list as jest.Mock;
const invitation = makeWalkSummary({ _id: 'w1' });
const upcoming = makeWalkSummary({ _id: 'w2', myStatus: 'accepted' });
const past = makeWalkSummary({ _id: 'w3', scheduledAt: '2020-01-01T10:00:00.000Z' });

beforeEach(() => {
  jest.clearAllMocks();
  list.mockImplementation(async (scope: string) =>
    ({ invitations: [invitation], upcoming: [upcoming], past: [past] })[scope],
  );
});

describe('useGroupWalks', () => {
  it('loads invitations, upcoming and past walks', async () => {
    const { result } = renderHook(() => useGroupWalks());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.invitations).toEqual([invitation]);
    expect(result.current.upcoming).toEqual([upcoming]);
    expect(result.current.past).toEqual([past]);
  });

  it("keeps the phone's walk reminders in step with the upcoming walks", async () => {
    const { result } = renderHook(() => useGroupWalks());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(syncWalkReminders).toHaveBeenCalledWith([upcoming]);
  });

  it('shows the error state when the first load fails', async () => {
    list.mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useGroupWalks());

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('keeps the lists when a refresh fails', async () => {
    const { result } = renderHook(() => useGroupWalks());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    list.mockRejectedValue(new Error('Network Error'));
    await act(async () => result.current.refresh());

    expect(result.current.status).toBe('ready');
    expect(result.current.invitations).toEqual([invitation]);
    expect(result.current.refreshing).toBe(false);
  });
});
