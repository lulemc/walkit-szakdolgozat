import { act, renderHook, waitFor } from '@testing-library/react-native';
import { walkService } from '@/services/walkService';
import UserService from '@/services/userService';
import { userStorage } from '@/utils/userStorage';
import { useAuth } from '@/context/AuthProvider';
import { useWalkGoal } from '../useWalkGoal';

jest.mock('@/services/walkService', () => ({
  walkService: { activity: jest.fn(), onWalkSaved: jest.fn() },
}));
jest.mock('@/services/userService', () => ({
  __esModule: true,
  default: { updateUserProfile: jest.fn() },
}));
jest.mock('@/utils/userStorage', () => ({ userStorage: { setUser: jest.fn() } }));
jest.mock('@/context/AuthProvider', () => ({ useAuth: jest.fn() }));

const service = walkService as jest.Mocked<typeof walkService>;
const updateUserProfile = UserService.updateUserProfile as jest.Mock;
const NOW = new Date(2030, 0, 2, 12, 0);
const user = { _id: 'u1', name: 'Ann', email: 'ann@example.com', weeklyGoalKm: 15 };
const activity = [
  { startedAt: new Date(2029, 11, 24, 9).toISOString(), distanceM: 3000 },
  { startedAt: new Date(2030, 0, 1, 9).toISOString(), distanceM: 4200 },
];
let notifySaved: () => void;

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user });
  service.activity.mockResolvedValue(activity);
  service.onWalkSaved.mockImplementation((listener) => {
    notifySaved = () => listener({} as never);
    return jest.fn();
  });
});

describe('useWalkGoal', () => {
  it("loads the last year of walks and works out this week's distance and the streak", async () => {
    const { result } = renderHook(() => useWalkGoal(NOW));

    await waitFor(() => expect(result.current.loaded).toBe(true));
    // 52 weeks before this Monday (31 December 2029)
    expect(service.activity).toHaveBeenCalledWith(new Date(2029, 0, 1).toISOString());
    expect(result.current).toMatchObject({ goalKm: 15, thisWeekM: 4200, streak: 2 });
  });

  it('uses 10 km until a goal is set', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { ...user, weeklyGoalKm: undefined } });

    const { result } = renderHook(() => useWalkGoal(NOW));

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.goalKm).toBe(10);
  });

  it('reloads when a walk is saved', async () => {
    const { result } = renderHook(() => useWalkGoal(NOW));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    service.activity.mockResolvedValue([...activity, { startedAt: new Date(2030, 0, 2, 8).toISOString(), distanceM: 800 }]);

    await act(async () => notifySaved());

    expect(result.current.thisWeekM).toBe(5000);
  });

  it('saves a new goal on the profile and remembers it', async () => {
    updateUserProfile.mockResolvedValue({ ...user, weeklyGoalKm: 20 });
    const { result } = renderHook(() => useWalkGoal(NOW));

    await act(async () => result.current.saveGoal(20));

    expect(updateUserProfile).toHaveBeenCalledWith('u1', { weeklyGoalKm: 20 });
    expect(userStorage.setUser).toHaveBeenCalledWith({ ...user, weeklyGoalKm: 20 });
    expect(result.current.goalKm).toBe(20);
  });

  it('keeps the old goal when saving fails, and passes the error on', async () => {
    updateUserProfile.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useWalkGoal(NOW));

    await act(async () => {
      await expect(result.current.saveGoal(20)).rejects.toThrow('offline');
    });

    expect(result.current.goalKm).toBe(15);
  });

  it('stays not loaded when the walks fail to load', async () => {
    service.activity.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useWalkGoal(NOW));

    await waitFor(() => expect(service.activity).toHaveBeenCalled());
    expect(result.current.loaded).toBe(false);
  });
});
