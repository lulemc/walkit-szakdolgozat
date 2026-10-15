import { describe, it, expect, vi, beforeEach } from "vitest";
import * as friendshipService from "../../services/friendshipService.js";
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

const mockRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const user = { id: "me" };

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

  it("sends a service HttpError with its status", async () => {
    friendshipService.sendRequest.mockRejectedValue(new HttpError(409, "You are already friends"));
    const res = mockRes();

    await sendFriendRequest({ user, body: { userId: "u2" } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "You are already friends" });
  });

  it("responds 500 without internal details on an unexpected error", async () => {
    friendshipService.listFriends.mockRejectedValue(new Error("connection lost"));
    const res = mockRes();

    await listFriends({ user }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to load friends" });
  });
});
