import React from 'react';
import { AppState } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { groupWalkService } from '@/services/groupWalkService';
import { SocialSummaryProvider, useSocialSummary } from '../SocialSummaryProvider';

jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: { getSummary: jest.fn() },
}));

const getSummary = groupWalkService.getSummary as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SocialSummaryProvider>{children}</SocialSummaryProvider>
);

let appStateHandler: (state: string) => void;
const removeSubscription = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    appStateHandler = handler as (state: string) => void;
    return { remove: removeSubscription } as ReturnType<typeof AppState.addEventListener>;
  });
  getSummary.mockResolvedValue({ pendingFriendRequests: 1, pendingInvitations: 2 });
});

describe('SocialSummaryProvider', () => {
  it('loads the counts on mount and adds them up', async () => {
    const { result } = renderHook(() => useSocialSummary(), { wrapper });

    await waitFor(() => expect(result.current.total).toBe(3));
    expect(result.current.summary).toEqual({ pendingFriendRequests: 1, pendingInvitations: 2 });
  });

  it('starts at zero before the first load', () => {
    getSummary.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSocialSummary(), { wrapper });

    expect(result.current.total).toBe(0);
  });

  it('reloads on refresh()', async () => {
    const { result } = renderHook(() => useSocialSummary(), { wrapper });
    await waitFor(() => expect(result.current.total).toBe(3));

    getSummary.mockResolvedValue({ pendingFriendRequests: 0, pendingInvitations: 0 });
    await act(() => result.current.refresh());

    expect(result.current.total).toBe(0);
  });

  it('reloads when the app comes back to the foreground', async () => {
    const { result } = renderHook(() => useSocialSummary(), { wrapper });
    await waitFor(() => expect(result.current.total).toBe(3));

    getSummary.mockResolvedValue({ pendingFriendRequests: 5, pendingInvitations: 0 });
    await act(async () => appStateHandler('active'));

    await waitFor(() => expect(result.current.total).toBe(5));
  });

  it('ignores the app going to the background', async () => {
    renderHook(() => useSocialSummary(), { wrapper });
    await waitFor(() => expect(getSummary).toHaveBeenCalledTimes(1));

    await act(async () => appStateHandler('background'));

    expect(getSummary).toHaveBeenCalledTimes(1);
  });

  it('keeps the last counts when a reload fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useSocialSummary(), { wrapper });
    await waitFor(() => expect(result.current.total).toBe(3));

    getSummary.mockRejectedValue(new Error('Network Error'));
    await act(() => result.current.refresh());

    expect(result.current.total).toBe(3);
    expect(warn).toHaveBeenCalled();
  });

  it('stops listening to the app state on unmount', async () => {
    const { unmount } = renderHook(() => useSocialSummary(), { wrapper });
    await waitFor(() => expect(getSummary).toHaveBeenCalled());

    unmount();

    expect(removeSubscription).toHaveBeenCalled();
  });

  it('throws a clear error outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useSocialSummary())).toThrow(
      'useSocialSummary must be used inside a SocialSummaryProvider',
    );
  });
});
