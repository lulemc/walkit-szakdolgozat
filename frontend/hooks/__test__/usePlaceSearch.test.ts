import { act, renderHook } from '@testing-library/react-native';
import { MIN_PLACE_QUERY_LENGTH, PLACE_SEARCH_DEBOUNCE_MS, usePlaceSearch } from '../usePlaceSearch';

const heroes = { placeId: 'p1', description: 'Heroes Square', mainText: 'Heroes Square', secondaryText: 'Budapest' };
const search = jest.fn();

// Let the debounce timer run and the search promise settle
const settle = async (ms = PLACE_SEARCH_DEBOUNCE_MS) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  search.mockResolvedValue([heroes]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePlaceSearch', () => {
  it('waits until typing pauses for 300 ms before searching', async () => {
    const { result } = renderHook(() => usePlaceSearch(search));

    act(() => result.current.setQuery('her'));
    await settle(PLACE_SEARCH_DEBOUNCE_MS - 1);
    expect(search).not.toHaveBeenCalled();

    await settle(1);
    expect(PLACE_SEARCH_DEBOUNCE_MS).toBe(300);
    expect(search).toHaveBeenCalledWith('her', result.current.sessionToken);
    expect(result.current.suggestions).toEqual([heroes]);
  });

  it('searches once for a burst of typing, with the final text', async () => {
    const { result } = renderHook(() => usePlaceSearch(search));

    act(() => result.current.setQuery('her'));
    act(() => result.current.setQuery('hero'));
    act(() => result.current.setQuery('heroes'));
    await settle();

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('heroes', expect.any(String));
  });

  it(`doesn't search below ${MIN_PLACE_QUERY_LENGTH} characters, and clears old suggestions`, async () => {
    const { result } = renderHook(() => usePlaceSearch(search));
    act(() => result.current.setQuery('heroes'));
    await settle();

    act(() => result.current.setQuery('he'));
    await settle();

    expect(search).toHaveBeenCalledTimes(1);
    expect(result.current.suggestions).toEqual([]);
  });

  it('ignores a slow answer once a newer search has started', async () => {
    let answerFirst: (value: unknown) => void = () => {};
    search
      .mockReturnValueOnce(new Promise((resolve) => (answerFirst = resolve)))
      .mockResolvedValueOnce([{ ...heroes, placeId: 'p2', description: 'Heroes Square, Budapest' }]);
    const { result } = renderHook(() => usePlaceSearch(search));

    act(() => result.current.setQuery('her'));
    await settle();
    act(() => result.current.setQuery('heroes sq'));
    await settle();
    await act(async () => answerFirst([heroes]));

    expect(result.current.suggestions.map((s) => s.placeId)).toEqual(['p2']);
  });

  it('says when search is unavailable', async () => {
    search.mockRejectedValue(new Error('Google Places API error: REQUEST_DENIED'));
    const { result } = renderHook(() => usePlaceSearch(search));

    act(() => result.current.setQuery('heroes'));
    await settle();

    expect(result.current.error).toBe('Search is unavailable right now. You can still pick a point on the map.');
    expect(result.current.searching).toBe(false);
    expect(result.current.suggestions).toEqual([]);
  });

  it('uses one session token per search, and a new one after a place was picked', async () => {
    const { result } = renderHook(() => usePlaceSearch(search));
    act(() => result.current.setQuery('her'));
    await settle();
    act(() => result.current.setQuery('heroes'));
    await settle();
    const [[, first], [, second]] = search.mock.calls;
    expect(first).toBe(second);

    act(() => result.current.endSession());
    act(() => result.current.setQuery('vaci'));
    await settle();

    expect(search.mock.calls[2][1]).not.toBe(first);
    expect(result.current.query).toBe('vaci');
  });

  it("shows the picked place's name without searching for it again", async () => {
    const { result } = renderHook(() => usePlaceSearch(search));
    act(() => result.current.setQuery('heroes'));
    await settle();

    act(() => result.current.endSession('Heroes Square, Budapest'));
    await settle();

    expect(result.current.query).toBe('Heroes Square, Budapest');
    expect(result.current.suggestions).toEqual([]);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('starts over when reset', async () => {
    const { result } = renderHook(() => usePlaceSearch(search));
    act(() => result.current.setQuery('heroes'));
    await settle();

    act(() => result.current.reset());

    expect(result.current.query).toBe('');
    expect(result.current.suggestions).toEqual([]);
  });
});
