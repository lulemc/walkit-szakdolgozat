import api from '../api';
import { groupWalkService } from '../groupWalkService';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

const ok = (data: unknown) => ({ data: { success: true, data } });

describe('groupWalkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists walks for a scope', async () => {
    const walks = [{ _id: 'w1', title: 'Sunday walk' }];
    mockedApi.get.mockResolvedValue(ok(walks));

    await expect(groupWalkService.list('invitations')).resolves.toEqual(walks);
    expect(mockedApi.get).toHaveBeenCalledWith('/group-walks', { params: { scope: 'invitations' } });
  });

  it('gets one walk', async () => {
    const walk = { _id: 'w1' };
    mockedApi.get.mockResolvedValue(ok(walk));

    await expect(groupWalkService.get('w1')).resolves.toEqual(walk);
    expect(mockedApi.get).toHaveBeenCalledWith('/group-walks/w1');
  });

  it('creates a walk', async () => {
    const walk = { _id: 'w1' };
    mockedApi.post.mockResolvedValue(ok(walk));
    const request = {
      routeId: 'r1',
      scheduledAt: '2030-05-03T08:00:00.000Z',
      title: 'Sunday walk',
      inviteeIds: ['u2'],
    };

    await expect(groupWalkService.create(request)).resolves.toEqual(walk);
    expect(mockedApi.post).toHaveBeenCalledWith('/group-walks', request);
  });

  it('updates, cancels, invites, removes and responds', async () => {
    mockedApi.patch.mockResolvedValue(ok({ _id: 'w1' }));
    mockedApi.post.mockResolvedValue(ok({ _id: 'w1' }));
    mockedApi.delete.mockResolvedValue(ok({ _id: 'w1' }));

    await groupWalkService.update('w1', { title: 'New title' });
    await groupWalkService.cancel('w1');
    await groupWalkService.invite('w1', ['u3']);
    await groupWalkService.removeParticipant('w1', 'u3');
    await groupWalkService.respond('w1', 'accepted');

    expect(mockedApi.patch).toHaveBeenCalledWith('/group-walks/w1', { title: 'New title' });
    expect(mockedApi.post).toHaveBeenCalledWith('/group-walks/w1/cancel');
    expect(mockedApi.post).toHaveBeenCalledWith('/group-walks/w1/invites', { userIds: ['u3'] });
    expect(mockedApi.delete).toHaveBeenCalledWith('/group-walks/w1/participants/u3');
    expect(mockedApi.post).toHaveBeenCalledWith('/group-walks/w1/respond', { status: 'accepted' });
  });

  it('pages comments and adds and deletes them', async () => {
    mockedApi.get.mockResolvedValue(ok([]));
    mockedApi.post.mockResolvedValue(ok({ _id: 'c1', text: 'Hi' }));
    mockedApi.delete.mockResolvedValue({ data: { success: true } });

    await groupWalkService.listComments('w1', { before: '2030-05-01T09:00:00.000Z', limit: 10 });
    await expect(groupWalkService.addComment('w1', 'Hi')).resolves.toEqual({ _id: 'c1', text: 'Hi' });
    await groupWalkService.deleteComment('w1', 'c1');

    expect(mockedApi.get).toHaveBeenCalledWith('/group-walks/w1/comments', {
      params: { before: '2030-05-01T09:00:00.000Z', limit: 10 },
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/group-walks/w1/comments', { text: 'Hi' });
    expect(mockedApi.delete).toHaveBeenCalledWith('/group-walks/w1/comments/c1');
  });

  it('gets the badge summary', async () => {
    const summary = { pendingFriendRequests: 1, pendingInvitations: 2 };
    mockedApi.get.mockResolvedValue(ok(summary));

    await expect(groupWalkService.getSummary()).resolves.toEqual(summary);
    expect(mockedApi.get).toHaveBeenCalledWith('/group-walks/summary');
  });
});
