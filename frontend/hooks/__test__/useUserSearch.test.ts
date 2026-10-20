import { act, renderHook } from '@testing-library/react-native';
import UserService from '@/services/userService';
import { SEARCH_DEBOUNCE_MS, useUserSearch } from '../useUserSearch';

jest.mock('@/services/userService', () => ({
  __esModule: true,
  default: { searchUsers: jest.fn() },
}));

const searchUsers = UserService.searchUsers as jest.Mock;
const ann = { _id: 'u2', name: 'Ann', relationship: 'none' as const };

// Let the debounce timer run and the search promise settle
const settle = async (ms = SEARCH_DEBOUNCE_MS) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  searchUsers.mockResolvedValue([ann]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useUserSearch', () => {
  it('waits until the user stops typing before searching', async () => {
    const { result } = renderHook(() => useUserSearch());

    act(() => result.current.setQuery('ann'));
    await settle(SEARCH_DEBOUNCE_MS - 1);
    expect(searchUsers).not.toHaveBeenCalled();

    await settle(1);
    expect(searchUsers).toHaveBeenCalledWith('ann');
    expect(result.current.results).toEqual([ann]);
  });

  it('searches only once for a burst of typing, with the final text', async () => {
    const { result } = renderHook(() => useUserSearch());

    act(() => result.current.setQuery('a'));
    act(() => result.current.setQuery('an'));
    act(() => result.current.setQuery('ann'));
    await settle();

    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledWith('ann');
  });

  it("doesn't search for fewer than 2 characters and clears old results", async () => {
    const { result } = renderHook(() => useUserSearch());
    act(() => result.current.setQuery('ann'));
    await settle();

    act(() => result.current.setQuery(' a '));
    await settle();

    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(result.current.results).toEqual([]);
  });

  it('ignores a slow response once a newer search has started', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    searchUsers
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce([{ ...ann, name: 'Anna' }]);
    const { result } = renderHook(() => useUserSearch());

    act(() => result.current.setQuery('an'));
    await settle();
    act(() => result.current.setQuery('anna'));
    await settle();
    await act(async () => resolveFirst([ann]));

    expect(result.current.results).toEqual([{ ...ann, name: 'Anna' }]);
  });

  it('shows the error message when the search fails', async () => {
    searchUsers.mockRejectedValue({ response: { data: { message: 'Search query must be at least 2 characters' } } });
    const { result } = renderHook(() => useUserSearch());

    act(() => result.current.setQuery('ann'));
    await settle();

    expect(result.current.error).toBe('Search query must be at least 2 characters');
    expect(result.current.searching).toBe(false);
  });

  it('can update one result, e.g. after sending a request', async () => {
    const { result } = renderHook(() => useUserSearch());
    act(() => result.current.setQuery('ann'));
    await settle();

    act(() => result.current.updateResult('u2', { relationship: 'outgoing', friendshipId: 'r1' }));

    expect(result.current.results).toEqual([
      { ...ann, relationship: 'outgoing', friendshipId: 'r1' },
    ]);
  });
});
