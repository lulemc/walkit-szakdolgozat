import { describe, it, expect, vi, beforeEach } from "vitest";
import { protect } from "../../middleware/authMiddleware.js";
import * as friendshipService from "../../services/friendshipService.js";
import app from "../../app.js";
import { inject } from "../helpers/inject.js";

vi.mock("../../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: "me" };
    next();
  }),
  requireSelf: vi.fn((req, res, next) => next()),
}));

vi.mock("../../services/friendshipService.js", () => ({
  listFriends: vi.fn(),
  listRequests: vi.fn(),
  sendRequest: vi.fn(),
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  cancelRequest: vi.fn(),
  unfriend: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("friend routes", () => {
  it("serves the friends list behind login", async () => {
    friendshipService.listFriends.mockResolvedValue([]);

    const res = await inject(app, { url: "/api/friends" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [] });
    expect(protect).toHaveBeenCalled();
  });

  it("serves the request lists", async () => {
    friendshipService.listRequests.mockResolvedValue({ incoming: [], outgoing: [] });

    const res = await inject(app, { url: "/api/friends/requests" });

    expect(res.status).toBe(200);
    expect(friendshipService.listRequests).toHaveBeenCalledWith("me");
  });

  it("sends a request with the user id from the body", async () => {
    friendshipService.sendRequest.mockResolvedValue({ friendship: {}, autoAccepted: false });

    const res = await inject(app, {
      method: "POST",
      url: "/api/friends/requests",
      body: { userId: "u2" },
    });

    expect(res.status).toBe(201);
    expect(friendshipService.sendRequest).toHaveBeenCalledWith("me", "u2");
  });

  it("routes accept and decline to the matching actions", async () => {
    friendshipService.acceptRequest.mockResolvedValue({});

    await inject(app, { method: "POST", url: "/api/friends/requests/r1/accept" });
    await inject(app, { method: "POST", url: "/api/friends/requests/r1/decline" });

    expect(friendshipService.acceptRequest).toHaveBeenCalledWith("me", "r1");
    expect(friendshipService.declineRequest).toHaveBeenCalledWith("me", "r1");
  });

  it("cancels a request rather than unfriending on DELETE /requests/:id", async () => {
    const res = await inject(app, { method: "DELETE", url: "/api/friends/requests/r1" });

    expect(res.status).toBe(200);
    expect(friendshipService.cancelRequest).toHaveBeenCalledWith("me", "r1");
    expect(friendshipService.unfriend).not.toHaveBeenCalled();
  });

  it("unfriends on DELETE /:userId", async () => {
    const res = await inject(app, { method: "DELETE", url: "/api/friends/u2" });

    expect(res.status).toBe(200);
    expect(friendshipService.unfriend).toHaveBeenCalledWith("me", "u2");
  });
});
