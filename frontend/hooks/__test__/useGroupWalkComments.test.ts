import { act, renderHook, waitFor } from '@testing-library/react-native';
import { groupWalkService } from '@/services/groupWalkService';
import { COMMENT_PAGE_SIZE, useGroupWalkComments } from '../useGroupWalkComments';

jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: { listComments: jest.fn(), addComment: jest.fn(), deleteComment: jest.fn() },
}));

const service = groupWalkService as jest.Mocked<typeof groupWalkService>;

const comment = (n: number) => ({
  _id: `c${n}`,
  author: { _id: 'u2', name: 'Ann' },
  text: `Comment ${n}`,
  // A higher n is newer
  createdAt: new Date(Date.UTC(2030, 0, 1, 0, n)).toISOString(),
});
/** A page as the server sends it: newest first */
const page = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => comment(to - i));

beforeEach(() => {
  jest.clearAllMocks();
  service.listComments.mockResolvedValue(page(1, 3));
});

const loaded = async () => {
  const hook = renderHook(() => useGroupWalkComments('w1'));
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
};

const texts = (comments: { text: string }[]) => comments.map((c) => c.text);

describe('useGroupWalkComments', () => {
  it('loads the newest comments and lists them oldest first', async () => {
    const { result } = await loaded();

    expect(service.listComments).toHaveBeenCalledWith('w1', { limit: COMMENT_PAGE_SIZE });
    expect(texts(result.current.comments)).toEqual(['Comment 1', 'Comment 2', 'Comment 3']);
    // A short page means there is nothing older
    expect(result.current.hasOlder).toBe(false);
  });

  it('loads older comments before the oldest one shown', async () => {
    service.listComments.mockResolvedValueOnce(page(21, 20 + COMMENT_PAGE_SIZE));
    const { result } = await loaded();
    expect(result.current.hasOlder).toBe(true);

    service.listComments.mockResolvedValueOnce(page(19, 20));
    await act(async () => result.current.loadOlder());

    expect(service.listComments).toHaveBeenLastCalledWith('w1', {
      before: comment(21).createdAt,
      limit: COMMENT_PAGE_SIZE,
    });
    expect(texts(result.current.comments).slice(0, 3)).toEqual(['Comment 19', 'Comment 20', 'Comment 21']);
    expect(result.current.hasOlder).toBe(false);
  });

  it('adds a posted comment at the end', async () => {
    service.addComment.mockResolvedValue(comment(4));
    const { result } = await loaded();

    let ok = false;
    await act(async () => {
      ok = await result.current.add('Comment 4');
    });

    expect(ok).toBe(true);
    expect(service.addComment).toHaveBeenCalledWith('w1', 'Comment 4');
    expect(texts(result.current.comments)).toEqual(['Comment 1', 'Comment 2', 'Comment 3', 'Comment 4']);
  });

  it('removes a deleted comment', async () => {
    service.deleteComment.mockResolvedValue(undefined);
    const { result } = await loaded();

    await act(async () => {
      await result.current.remove('c2');
    });

    expect(service.deleteComment).toHaveBeenCalledWith('w1', 'c2');
    expect(texts(result.current.comments)).toEqual(['Comment 1', 'Comment 3']);
  });

  it("shows the backend's message when posting fails", async () => {
    service.addComment.mockRejectedValue({ response: { data: { message: 'Comments are closed on cancelled walks' } } });
    const { result } = await loaded();

    let ok = true;
    await act(async () => {
      ok = await result.current.add('Hi');
    });

    expect(ok).toBe(false);
    expect(result.current.actionError).toBe('Comments are closed on cancelled walks');
    expect(result.current.comments).toHaveLength(3);
  });

  it('shows the error state when the comments fail to load, and can retry', async () => {
    service.listComments.mockRejectedValueOnce(new Error('Network Error'));
    const { result } = renderHook(() => useGroupWalkComments('w1'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    await act(async () => result.current.reload());

    expect(result.current.status).toBe('ready');
    expect(result.current.comments).toHaveLength(3);
  });
});
