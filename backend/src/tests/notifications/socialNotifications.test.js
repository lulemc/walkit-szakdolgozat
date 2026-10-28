import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendPush } from "../../services/pushService.js";
import {
  notifyFriendAccepted,
  notifyFriendRequest,
  notifyWalkCancelled,
  notifyWalkInvitation,
} from "../../services/socialNotifications.js";

vi.mock("../../services/pushService.js", () => ({ sendPush: vi.fn(() => Promise.resolve()) }));

const lastPush = () => {
  const [userIds, message, data] = sendPush.mock.calls.at(-1);
  return { userIds, en: message("en"), hu: message("hu"), data };
};

const walk = (overrides = {}) => ({
  _id: "w1",
  title: "Sunday hike",
  participants: [
    { user: { _id: "me", name: "Ann" }, role: "organiser", status: "accepted" },
    { user: { _id: "u2", name: "Bob" }, role: "invitee", status: "invited" },
    { user: { _id: "u3", name: "Cy" }, role: "invitee", status: "accepted" },
    { user: { _id: "u4", name: "Di" }, role: "invitee", status: "declined" },
  ],
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe("social notifications", () => {
  it("tells the recipient about a new friend request", async () => {
    await notifyFriendRequest("u2", "Ann");

    expect(lastPush()).toEqual({
      userIds: ["u2"],
      en: { title: "New friend request", body: "Ann wants to be your friend on WalkIt" },
      hu: { title: "Új barátkérés", body: "Ann szeretne a barátod lenni a WalkItben" },
      data: { type: "friendRequest" },
    });
  });

  it("tells the requester their request was accepted", async () => {
    await notifyFriendAccepted("u2", "Bob");

    expect(lastPush()).toMatchObject({
      userIds: ["u2"],
      en: { title: "Friend request accepted", body: "Bob accepted your friend request" },
      hu: { title: "Elfogadott barátkérés", body: "Bob elfogadta a barátkérésedet" },
      data: { type: "friendAccepted" },
    });
  });

  it("invites everyone who still has to answer", async () => {
    await notifyWalkInvitation(walk(), "Ann");

    expect(lastPush()).toEqual({
      userIds: ["u2"],
      en: { title: "Group walk invitation", body: "Ann invited you to “Sunday hike”" },
      hu: { title: "Meghívás közös sétára", body: "Ann meghívott: „Sunday hike”" },
      data: { type: "walkInvitation", walkId: "w1" },
    });
  });

  it("only notifies the people just invited when more are invited later", async () => {
    const later = walk({
      participants: [...walk().participants, { user: { _id: "u5", name: "Ed" }, role: "invitee", status: "invited" }],
    });

    await notifyWalkInvitation(later, "Ann", ["u5"]);

    expect(lastPush().userIds).toEqual(["u5"]);
  });

  it("names a walk without a title as a group walk", async () => {
    await notifyWalkInvitation(walk({ title: undefined }), "Ann");

    expect(lastPush()).toMatchObject({
      en: { body: "Ann invited you to a group walk" },
      hu: { body: "Ann meghívott egy közös sétára" },
    });
  });

  it("tells everyone still coming or invited that the walk is off, but not the organiser", async () => {
    await notifyWalkCancelled(walk({ organiser: { _id: "me" } }));

    expect(lastPush()).toEqual({
      userIds: ["u2", "u3"],
      en: { title: "Group walk cancelled", body: "“Sunday hike” has been cancelled" },
      hu: { title: "Elmarad a közös séta", body: "„Sunday hike” elmarad" },
      data: { type: "walkCancelled", walkId: "w1" },
    });
  });

  it("names a cancelled walk without a title as the group walk", async () => {
    await notifyWalkCancelled(walk({ title: undefined }));

    expect(lastPush()).toMatchObject({
      en: { body: "The group walk has been cancelled" },
      hu: { body: "A közös séta elmarad" },
    });
  });

  it("sends nothing when there is nobody to tell", async () => {
    await notifyWalkInvitation(walk({ participants: [] }), "Ann");

    expect(sendPush).not.toHaveBeenCalled();
  });
});
