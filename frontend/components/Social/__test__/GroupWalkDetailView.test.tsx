import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { pickDate } from '@/components/Inputs/__test__/pickDate';
import { groupWalkService } from '@/services/groupWalkService';
import { friendService } from '@/services/friendService';
import { useSocialSummary } from '@/context/SocialSummaryProvider';
import { GroupWalkDetailView } from '../GroupWalkDetailView';
import { makeOrganiserWalk, makeWalkDetail } from './groupWalkFixtures';

jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: {
    get: jest.fn(),
    respond: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    invite: jest.fn(),
    removeParticipant: jest.fn(),
    listComments: jest.fn(),
    addComment: jest.fn(),
    deleteComment: jest.fn(),
  },
}));
jest.mock('@/context/AuthProvider', () => ({
  useAuth: () => ({ user: { _id: 'u2', name: 'Ann' } }),
}));

/** Pretends it is this moment, faking only the clock so async waits still run */
const pretendNowIs = (now: Date) =>
  jest.useFakeTimers({
    now,
    doNotFake: [
      'hrtime', 'nextTick', 'performance', 'queueMicrotask', 'requestAnimationFrame',
      'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'setImmediate',
      'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout',
    ],
  });
jest.mock('@/services/friendService', () => ({
  friendService: { listFriends: jest.fn() },
}));
jest.mock('@/context/SocialSummaryProvider', () => ({ useSocialSummary: jest.fn() }));

const service = groupWalkService as jest.Mocked<typeof groupWalkService>;

beforeEach(() => {
  jest.clearAllMocks();
  (useSocialSummary as jest.Mock).mockReturnValue({ refresh: jest.fn().mockResolvedValue(undefined) });
  service.get.mockResolvedValue(makeWalkDetail());
  service.listComments.mockResolvedValue([
    { _id: 'c1', author: { _id: 'u1', name: 'Olga' }, text: 'Bring water', createdAt: '2029-12-30T10:00:00.000Z' },
  ]);
  (friendService.listFriends as jest.Mock).mockResolvedValue([
    { friendshipId: 'f2', user: { _id: 'u2', name: 'Ann' }, since: '2026-10-01T10:00:00Z' },
    { friendshipId: 'f3', user: { _id: 'u3', name: 'Bob' }, since: '2026-10-01T10:00:00Z' },
    { friendshipId: 'f4', user: { _id: 'u4', name: 'Cid' }, since: '2026-10-01T10:00:00Z' },
  ]);
});

afterEach(() => {
  jest.useRealTimers();
});

const renderDetail = async () => {
  const onBack = jest.fn();
  const onStartWalk = jest.fn();
  const screen = renderWithTheme(
    <GroupWalkDetailView walkId="w1" onBack={onBack} onStartWalk={onStartWalk} />,
  );
  await screen.findByText('Sunday stroll');
  await screen.findByText('Bring water');
  return { ...screen, onBack, onStartWalk };
};

describe('GroupWalkDetailView', () => {
  it('shows the walk: route map, local time, note, organiser and route', async () => {
    const { getByText, getByLabelText } = await renderDetail();

    expect(service.get).toHaveBeenCalledWith('w1');
    expect(getByLabelText('Map of the route')).toBeTruthy();
    // 13:30 UTC is 10:30 in São Paulo, where the tests run
    expect(getByText('Wed, Jan 2, 2030 · 10:30 AM')).toBeTruthy();
    expect(getByText('Meet at the bridge')).toBeTruthy();
    expect(getByText('Organised by Olga')).toBeTruthy();
    expect(getByText('Riverside loop')).toBeTruthy();
  });

  it('lists the participants with their status', async () => {
    const { getByLabelText } = await renderDetail();

    expect(getByLabelText('Olga, Organiser')).toBeTruthy();
    expect(getByLabelText('Ann, Invited')).toBeTruthy();
    expect(getByLabelText('Bob, Declined')).toBeTruthy();
  });

  it('goes back', async () => {
    const { getByText, onBack } = await renderDetail();

    fireEvent.press(getByText('Back'));

    expect(onBack).toHaveBeenCalled();
  });

  describe('as an invitee', () => {
    it('accepts the invitation and shows the new status', async () => {
      service.respond.mockResolvedValue({ myStatus: 'accepted' });
      const { getByText, findByText, queryByText } = await renderDetail();
      service.get.mockResolvedValue(makeWalkDetail({ myStatus: 'accepted' }));

      fireEvent.press(getByText('Accept'));

      expect(await findByText("You're going")).toBeTruthy();
      expect(service.respond).toHaveBeenCalledWith('w1', 'accepted');
      expect(queryByText('Accept')).toBeNull();
    });

    it('declines the invitation', async () => {
      service.respond.mockResolvedValue({ myStatus: 'declined' });
      const { getByText, findByText } = await renderDetail();
      service.get.mockResolvedValue(makeWalkDetail({ myStatus: 'declined' }));

      fireEvent.press(getByText('Decline'));

      expect(await findByText("You're not going")).toBeTruthy();
      expect(service.respond).toHaveBeenCalledWith('w1', 'declined');
    });

    it('leaves an accepted walk after confirming', async () => {
      service.get.mockResolvedValue(makeWalkDetail({ myStatus: 'accepted' }));
      service.respond.mockResolvedValue({ myStatus: 'declined' });
      const { getByText, findByText } = await renderDetail();

      fireEvent.press(getByText('Leave'));
      fireEvent.press(await findByText('Stay'));
      expect(service.respond).not.toHaveBeenCalled();

      fireEvent.press(getByText('Leave'));
      fireEvent.press(await findByText('Yes, leave'));

      await waitFor(() => expect(service.respond).toHaveBeenCalledWith('w1', 'declined'));
    });

    it("doesn't see the organiser's actions", async () => {
      const { queryByText, queryByLabelText } = await renderDetail();

      expect(queryByText('Edit')).toBeNull();
      expect(queryByText('Invite friends')).toBeNull();
      expect(queryByText('Cancel walk')).toBeNull();
      expect(queryByLabelText('Remove Ann from the walk')).toBeNull();
    });

    it("shows the backend's message when answering fails", async () => {
      service.respond.mockRejectedValue({ response: { data: { message: 'This walk can no longer be answered' } } });
      const { getByText, findByText } = await renderDetail();

      fireEvent.press(getByText('Accept'));

      expect(await findByText('This walk can no longer be answered')).toBeTruthy();
    });
  });

  describe('as the organiser', () => {
    beforeEach(() => {
      service.get.mockResolvedValue(makeOrganiserWalk());
    });

    it("has the organiser's actions instead of answering", async () => {
      const { getByText, queryByText } = await renderDetail();

      expect(getByText('Edit')).toBeTruthy();
      expect(getByText('Invite friends')).toBeTruthy();
      expect(getByText('Cancel walk')).toBeTruthy();
      expect(queryByText('Accept')).toBeNull();
      expect(queryByText('Leave')).toBeNull();
    });

    it('cancels the walk after confirming, which makes it read-only', async () => {
      service.cancel.mockResolvedValue(makeOrganiserWalk({ status: 'cancelled' }));
      const { getByText, findByText, queryByText } = await renderDetail();

      fireEvent.press(getByText('Cancel walk'));
      fireEvent.press(await findByText('Keep walk'));
      expect(service.cancel).not.toHaveBeenCalled();

      fireEvent.press(getByText('Cancel walk'));
      fireEvent.press(await findByText('Yes, cancel it'));

      expect(await findByText('This walk was cancelled.')).toBeTruthy();
      expect(service.cancel).toHaveBeenCalledWith('w1');
      expect(queryByText('Edit')).toBeNull();
    });

    it('removes a participant after confirming', async () => {
      service.removeParticipant.mockResolvedValue(
        makeOrganiserWalk({ participants: makeOrganiserWalk().participants.filter((p) => p.user._id !== 'u2') }),
      );
      const { getByLabelText, findByText, queryByLabelText } = await renderDetail();

      // The organiser can't remove themselves
      expect(queryByLabelText('Remove Olga from the walk')).toBeNull();
      fireEvent.press(getByLabelText('Remove Ann from the walk'));
      expect(await findByText('Remove Ann from the walk?')).toBeTruthy();
      fireEvent.press(await findByText('Remove'));

      await waitFor(() => expect(service.removeParticipant).toHaveBeenCalledWith('w1', 'u2'));
      await waitFor(() => expect(queryByLabelText('Ann, Invited')).toBeNull());
    });

    it('edits the title, note and time', async () => {
      service.update.mockResolvedValue(makeOrganiserWalk({ title: 'Evening walk' }));
      const { getByText, getByLabelText, getByTestId, findByText } = await renderDetail();

      fireEvent.press(getByText('Edit'));
      expect(getByLabelText('Title (optional)').props.value).toBe('Sunday stroll');
      fireEvent.changeText(getByLabelText('Title (optional)'), 'Evening walk');
      fireEvent.changeText(getByLabelText('Note (optional)'), '');
      pickDate(getByTestId('group-walk-time'), new Date(2030, 0, 2, 18, 0));
      fireEvent.press(getByText('Save'));

      expect(await findByText('Evening walk')).toBeTruthy();
      expect(service.update).toHaveBeenCalledWith('w1', {
        title: 'Evening walk',
        note: '',
        scheduledAt: '2030-01-02T21:00:00.000Z',
      });
    });

    it("doesn't send the time when it wasn't changed", async () => {
      service.update.mockResolvedValue(makeOrganiserWalk());
      const { getByText, findByText } = await renderDetail();

      fireEvent.press(getByText('Edit'));
      fireEvent.press(getByText('Save'));

      await findByText('Edit');
      expect(service.update).toHaveBeenCalledWith('w1', { title: 'Sunday stroll', note: 'Meet at the bridge' });
    });

    it("can't move the walk into the past", async () => {
      const { getByText, getByTestId, findByText } = await renderDetail();

      fireEvent.press(getByText('Edit'));
      pickDate(getByTestId('group-walk-date'), new Date(2020, 0, 2));
      fireEvent.press(getByText('Save'));

      expect(await findByText('Pick a time in the future.')).toBeTruthy();
      expect(service.update).not.toHaveBeenCalled();
    });

    it('invites more friends, offering only those not already coming or invited', async () => {
      service.invite.mockResolvedValue(makeOrganiserWalk());
      const { getByText, findByRole, queryByRole, getByRole, findByText } = await renderDetail();

      fireEvent.press(getByText('Invite friends'));

      expect(await findByRole('checkbox', { name: 'Invite Cid' })).toBeTruthy();
      // People who declined can be asked again
      expect(getByRole('checkbox', { name: 'Invite Bob' })).toBeTruthy();
      expect(queryByRole('checkbox', { name: 'Invite Ann' })).toBeNull();

      fireEvent.press(getByRole('checkbox', { name: 'Invite Cid' }));
      fireEvent.press(getByText('Send invitations'));

      await waitFor(() => expect(service.invite).toHaveBeenCalledWith('w1', ['u4']));
      // Back on the walk once the invitations went out
      expect(await findByText('Bring water')).toBeTruthy();
    });
  });

  describe('when the walk is over or off', () => {
    it('shows a banner and no actions on a cancelled walk', async () => {
      service.get.mockResolvedValue(makeOrganiserWalk({ status: 'cancelled' }));
      const { getByText, queryByText, queryByLabelText } = await renderDetail();

      expect(getByText('This walk was cancelled.')).toBeTruthy();
      expect(queryByText('Edit')).toBeNull();
      expect(queryByText('Cancel walk')).toBeNull();
      expect(queryByLabelText('Remove Ann from the walk')).toBeNull();
    });

    it("doesn't let invitees answer a cancelled walk", async () => {
      service.get.mockResolvedValue(makeWalkDetail({ status: 'cancelled' }));
      const { getByText, queryByText } = await renderDetail();

      expect(getByText('This walk was cancelled.')).toBeTruthy();
      expect(queryByText('Accept')).toBeNull();
    });

    it('shows a banner and no actions on a past walk', async () => {
      service.get.mockResolvedValue(makeWalkDetail({ scheduledAt: '2020-01-02T13:30:00.000Z', myStatus: 'accepted' }));
      const { getByText, queryByText } = await renderDetail();

      expect(getByText('This walk has already taken place.')).toBeTruthy();
      expect(queryByText('Leave')).toBeNull();
    });
  });

  it('shows deleted accounts without a remove button', async () => {
    service.get.mockResolvedValue(
      makeOrganiserWalk({
        participants: [
          ...makeOrganiserWalk().participants,
          { user: { _id: null, name: 'Deleted user' }, role: 'invitee', status: 'accepted' },
        ],
      }),
    );
    const { getByLabelText, queryByLabelText } = await renderDetail();

    expect(getByLabelText('Deleted user, Going')).toBeTruthy();
    expect(queryByLabelText('Remove Deleted user from the walk')).toBeNull();
  });

  it('offers a retry when the walk fails to load', async () => {
    service.get.mockRejectedValueOnce(new Error('Network Error'));
    const { findByText, getByText } = renderWithTheme(<GroupWalkDetailView walkId="w1" onBack={jest.fn()} onStartWalk={jest.fn()} />);

    expect(await findByText("Couldn't load this walk")).toBeTruthy();
    fireEvent.press(getByText('Try again'));

    expect(await findByText('Sunday stroll')).toBeTruthy();
  });

  describe('comments', () => {
    it("shows the walk's comments and a box to write one", async () => {
      const { getByText, getByLabelText } = await renderDetail();

      expect(getByText('Bring water')).toBeTruthy();
      expect(getByLabelText('Write a comment')).toBeTruthy();
      expect(service.listComments).toHaveBeenCalledWith('w1', expect.anything());
    });

    it("hides the comment box from people who declined, who can still read", async () => {
      service.get.mockResolvedValue(makeWalkDetail({ myStatus: 'declined' }));
      const { queryByLabelText, getByText } = await renderDetail();

      expect(getByText('Bring water')).toBeTruthy();
      expect(queryByLabelText('Write a comment')).toBeNull();
      expect(getByText("You declined this walk, so you can't comment.")).toBeTruthy();
    });

    it('hides the comment box on a cancelled walk', async () => {
      service.get.mockResolvedValue(makeWalkDetail({ status: 'cancelled', myStatus: 'accepted' }));
      const { queryByLabelText, getByText } = await renderDetail();

      expect(queryByLabelText('Write a comment')).toBeNull();
      expect(getByText('Comments are closed because the walk was cancelled.')).toBeTruthy();
    });

    it('still allows comments after the walk', async () => {
      service.get.mockResolvedValue(makeWalkDetail({ scheduledAt: '2020-01-02T13:30:00.000Z', myStatus: 'accepted' }));
      const { getByLabelText } = await renderDetail();

      expect(getByLabelText('Write a comment')).toBeTruthy();
    });
  });

  // The walk is at 10:30 local time on Jan 2, 2030
  describe('starting the walk', () => {
    it("lets people who are going start the walk's route on the day", async () => {
      pretendNowIs(new Date(2030, 0, 2, 8, 0));
      const walk = makeWalkDetail({ myStatus: 'accepted' });
      service.get.mockResolvedValue(walk);
      const { getByText, onStartWalk } = await renderDetail();

      fireEvent.press(getByText('Start walk'));

      expect(onStartWalk).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'w1', coordinates: walk.route.coordinates }),
      );
    });

    it('also for the organiser', async () => {
      pretendNowIs(new Date(2030, 0, 2, 8, 0));
      service.get.mockResolvedValue(makeOrganiserWalk());
      const { getByText } = await renderDetail();

      expect(getByText('Start walk')).toBeTruthy();
    });

    it('still on the day after the start time, without the "already taken place" banner', async () => {
      pretendNowIs(new Date(2030, 0, 2, 12, 0));
      service.get.mockResolvedValue(makeWalkDetail({ myStatus: 'accepted' }));
      const { getByText, queryByText } = await renderDetail();

      expect(getByText('Start walk')).toBeTruthy();
      expect(queryByText('This walk has already taken place.')).toBeNull();
    });

    it('not before the day of the walk', async () => {
      pretendNowIs(new Date(2030, 0, 1, 20, 0));
      service.get.mockResolvedValue(makeWalkDetail({ myStatus: 'accepted' }));
      const { queryByText } = await renderDetail();

      expect(queryByText('Start walk')).toBeNull();
    });

    it("not for people who haven't accepted", async () => {
      pretendNowIs(new Date(2030, 0, 2, 8, 0));
      const { queryByText } = await renderDetail();

      expect(queryByText('Start walk')).toBeNull();
    });
  });
});
