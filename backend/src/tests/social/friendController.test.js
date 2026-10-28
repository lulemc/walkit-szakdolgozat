import { describe, it, expect, vi, beforeEach } from "vitest";
import * as friendshipService from "../../services/friendshipService.js";
import { notifyFriendAccepted, notifyFriendRequest } from "../../services/socialNotifications.js";
import { HttpError } from "../../utils/httpError.js";
import {
  listFriends,
  listRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
} from "../../controllers/friendController.js";

vi.mock("../../services/friendshipService.js", () => ({
  listFriends: vi.fn(),
  listRequests: vi.fn(),
  sendRequest: vi.fn(),
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  cancelRequest: vi.fn(),
  unfriend: vi.fn(),
}));

vi.mock("../../services/socialNotifications.js", () => ({
  notifyFriendRequest: vi.fn(() => Promise.resolve()),
  notifyFriendAccepted: vi.fn(() => Promise.resolve()),
}));

const mockRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const user = { id: "me", name: "Ann" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("friendController", () => {
  it("lists my friends", async () => {
    const friends = [{ friendshipId: "f1", user: { _id: "u2", name: "Ann" } }];
    friendshipService.listFriends.mockResolvedValue(friends);
    const res = mockRes();

    await listFriends({ user }, res);

    expect(friendshipService.listFriends).toHaveBeenCalledWith("me");
    expect(res.json).toHaveBeenCalledWith({ success: true, data: friends });
  });

  it("lists incoming and outgoing requests", async () => {
    const requests = { incoming: [], outgoing: [] };
    friendshipService.listRequests.mockResolvedValue(requests);
    const res = mockRes();

    await listRequests({ user }, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: requests });
  });

  it("responds 201 when a new request is sent", async () => {
    const friendship = { _id: "r1", status: "pending" };
    friendshipService.sendRequest.mockResolvedValue({ friendship, autoAccepted: false });
    const res = mockRes();

    await sendFriendRequest({ user, body: { userId: "u2" } }, res);

    expect(friendshipService.sendRequest).toHaveBeenCalledWith("me", "u2");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: friendship,
      message: "Friend request sent",
    });
  });

  it("notifies the recipient of a new request", async () => {
    friendshipService.sendRequest.mockResolvedValue({
      friendship: { _id: "r1", requester: "me", recipient: "u2", status: "pending" },
      autoAccepted: false,
    });

    await sendFriendRequest({ user, body: { userId: "u2" } }, mockRes());

    expect(notifyFriendRequest).toHaveBeenCalledWith("u2", "Ann");
    expect(notifyFriendAccepted).not.toHaveBeenCalled();
  });

  it("tells the other user when sending accepted their request", async () => {
    friendshipService.sendRequest.mockResolvedValue({
      friendship: { _id: "r1", requester: "u2", recipient: "me", status: "accepted" },
      autoAccepted: true,
    });

    await sendFriendRequest({ user, body: { userId: "u2" } }, mockRes());

    expect(notifyFriendAccepted).toHaveBeenCalledWith("u2", "Ann");
    expect(notifyFriendRequest).not.toHaveBeenCalled();
  });

  it("tells the requester when I accept", async () => {
    friendshipService.acceptRequest.mockResolvedValue({ _id: "r1", requester: "u2", recipient: "me", status: "accepted" });

    await acceptFriendRequest({ user, params: { id: "r1" } }, mockRes());

    expect(notifyFriendAccepted).toHaveBeenCalledWith("u2", "Ann");
  });

  it("responds 200 when sending accepted the other user's request", async () => {
    const friendship = { _id: "r1", status: "accepted" };
    friendshipService.sendRequest.mockResolvedValue({ friendship, autoAccepted: true });
    const res = mockRes();

    await sendFriendRequest({ user, body: { userId: "u2" } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: friendship,
      message: "Friend request accepted",
    });
  });

  it("accepts a request", async () => {
    const friendship = { _id: "r1", status: "accepted" };
    friendshipService.acceptRequest.mockResolvedValue(friendship);
    const res = mockRes();

    await acceptFriendRequest({ user, params: { id: "r1" } }, res);

    expect(friendshipService.acceptRequest).toHaveBeenCalledWith("me", "r1");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: friendship,
      message: "Friend request accepted",
    });
  });

  it("declines a request", async () => {
    const res = mockRes();

    await declineFriendRequest({ user, params: { id: "r1" } }, res);

    expect(friendshipService.declineRequest).toHaveBeenCalledWith("me", "r1");
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Friend request declined" });
  });

  it("cancels a request", async () => {
    const res = mockRes();

    await cancelFriendRequest({ user, params: { id: "r1" } }, res);

    expect(friendshipService.cancelRequest).toHaveBeenCalledWith("me", "r1");
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Friend request cancelled" });
  });

  it("unfriends a user", async () => {
    const res = mockRes();

    await unfriend({ user, params: { userId: "u2" } }, res);

    expect(friendshipService.unfriend).toHaveBeenCalledWith("me", "u2");
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Friend removed" });
  });

  it.each([
    ["a service HttpError", new HttpError(409, "You are already friends")],
    ["an unexpected error", new Error("connection lost")],
  ])("leaves %s to the error handler", async (_case, error) => {
    friendshipService.sendRequest.mockRejectedValue(error);

    await expect(sendFriendRequest({ user, body: { userId: "u2" } }, mockRes())).rejects.toBe(error);
  });
});
