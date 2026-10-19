import api from '../api';
import { friendService } from '../friendService';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

const ok = (data: unknown) => ({ data: { success: true, data } });

describe('friendService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists friends', async () => {
    const friends = [{ friendshipId: 'f1', user: { _id: 'u2', name: 'Ann' }, since: '2026-10-01' }];
    mockedApi.get.mockResolvedValue(ok(friends));

    await expect(friendService.listFriends()).resolves.toEqual(friends);
    expect(mockedApi.get).toHaveBeenCalledWith('/friends');
  });

  it('lists incoming and outgoing requests', async () => {
    const requests = { incoming: [], outgoing: [] };
    mockedApi.get.mockResolvedValue(ok(requests));

    await expect(friendService.listRequests()).resolves.toEqual(requests);
    expect(mockedApi.get).toHaveBeenCalledWith('/friends/requests');
  });

  it('sends a request and reports whether it was accepted straight away', async () => {
    const friendship = { _id: 'r1', status: 'accepted' };
    mockedApi.post.mockResolvedValue({
      data: { success: true, data: friendship, message: 'Friend request accepted' },
    });

    await expect(friendService.sendRequest('u2')).resolves.toEqual(friendship);
    expect(mockedApi.post).toHaveBeenCalledWith('/friends/requests', { userId: 'u2' });
  });

  it('accepts, declines and cancels requests', async () => {
    mockedApi.post.mockResolvedValue(ok({ _id: 'r1', status: 'accepted' }));
    mockedApi.delete.mockResolvedValue({ data: { success: true } });

    await friendService.acceptRequest('r1');
    await friendService.declineRequest('r2');
    await friendService.cancelRequest('r3');

    expect(mockedApi.post).toHaveBeenCalledWith('/friends/requests/r1/accept');
    expect(mockedApi.post).toHaveBeenCalledWith('/friends/requests/r2/decline');
    expect(mockedApi.delete).toHaveBeenCalledWith('/friends/requests/r3');
  });

  it('unfriends a user', async () => {
    mockedApi.delete.mockResolvedValue({ data: { success: true } });

    await friendService.unfriend('u2');

    expect(mockedApi.delete).toHaveBeenCalledWith('/friends/u2');
  });
});
