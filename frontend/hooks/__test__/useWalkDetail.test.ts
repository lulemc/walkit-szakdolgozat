import { act, renderHook, waitFor } from '@testing-library/react-native';
import { walkService } from '@/services/walkService';
import { useWalkDetail } from '../useWalkDetail';

jest.mock('@/services/walkService', () => ({ walkService: { get: jest.fn() } }));

const get = walkService.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useWalkDetail', () => {
  it('loads one walk with its path', async () => {
    get.mockResolvedValue({ _id: 'w1', path: [] });
    const { result } = renderHook(() => useWalkDetail('w1'));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(get).toHaveBeenCalledWith('w1');
    expect(result.current.walk).toEqual({ _id: 'w1', path: [] });
  });

  it('can retry after an error', async () => {
    get.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce({ _id: 'w1', path: [] });
    const { result } = renderHook(() => useWalkDetail('w1'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    await act(async () => result.current.retry());

    expect(result.current.status).toBe('ready');
  });
});
