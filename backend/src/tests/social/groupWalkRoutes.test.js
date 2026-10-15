import { describe, it, expect, vi, beforeEach } from "vitest";
import { protect } from "../../middleware/authMiddleware.js";
import * as groupWalkService from "../../services/groupWalkService.js";
import app from "../../app.js";
import { inject } from "../helpers/inject.js";

vi.mock("../../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: "me" };
    next();
  }),
  requireSelf: vi.fn((req, res, next) => next()),
}));

vi.mock("../../services/groupWalkService.js", () => ({
  createGroupWalk: vi.fn(),
  listGroupWalks: vi.fn(),
  getGroupWalk: vi.fn(),
  updateGroupWalk: vi.fn(),
  cancelGroupWalk: vi.fn(),
  inviteToGroupWalk: vi.fn(),
  removeParticipant: vi.fn(),
  respondToGroupWalk: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(groupWalkService)) fn.mockResolvedValue({});
});

describe("group walk routes", () => {
  it.each([
    ["POST", "/api/group-walks", "createGroupWalk", { routeId: "r1" }, ["me", { routeId: "r1" }], 201],
    ["GET", "/api/group-walks?scope=past", "listGroupWalks", undefined, ["me", "past"], 200],
    ["GET", "/api/group-walks/w1", "getGroupWalk", undefined, ["me", "w1"], 200],
    ["PATCH", "/api/group-walks/w1", "updateGroupWalk", { title: "T" }, ["me", "w1", { title: "T" }], 200],
    ["POST", "/api/group-walks/w1/cancel", "cancelGroupWalk", undefined, ["me", "w1"], 200],
    ["POST", "/api/group-walks/w1/invites", "inviteToGroupWalk", { userIds: ["u2"] }, ["me", "w1", ["u2"]], 200],
    ["DELETE", "/api/group-walks/w1/participants/u2", "removeParticipant", undefined, ["me", "w1", "u2"], 200],
    ["POST", "/api/group-walks/w1/respond", "respondToGroupWalk", { status: "accepted" }, ["me", "w1", "accepted"], 200],
  ])("%s %s reaches %s", async (method, url, serviceFn, body, args, status) => {
    const res = await inject(app, { method, url, body });

    expect(res.status).toBe(status);
    expect(groupWalkService[serviceFn]).toHaveBeenCalledWith(...args);
    expect(protect).toHaveBeenCalled();
  });
});
