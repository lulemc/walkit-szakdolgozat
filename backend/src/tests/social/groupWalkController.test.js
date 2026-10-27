import { describe, it, expect, vi, beforeEach } from "vitest";
import * as groupWalkService from "../../services/groupWalkService.js";
import { HttpError } from "../../utils/httpError.js";
import {
  createGroupWalk,
  listGroupWalks,
  getGroupWalk,
  updateGroupWalk,
  cancelGroupWalk,
  inviteToGroupWalk,
  removeGroupWalkParticipant,
  respondToGroupWalk,
} from "../../controllers/groupWalkController.js";

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

const mockRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const user = { id: "me" };
const walk = { _id: "w1", title: "Sunday walk" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("groupWalkController", () => {
  it("creates a walk from the request body and responds 201", async () => {
    groupWalkService.createGroupWalk.mockResolvedValue(walk);
    const body = { routeId: "r1", scheduledAt: "2030-05-03T08:00:00Z", inviteeIds: ["u2"] };
    const res = mockRes();

    await createGroupWalk({ user, body }, res);

    expect(groupWalkService.createGroupWalk).toHaveBeenCalledWith("me", body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: walk });
  });

  it("lists walks for the requested scope", async () => {
    groupWalkService.listGroupWalks.mockResolvedValue([walk]);
    const res = mockRes();

    await listGroupWalks({ user, query: { scope: "invitations" } }, res);

    expect(groupWalkService.listGroupWalks).toHaveBeenCalledWith("me", "invitations");
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [walk] });
  });

  it("lists upcoming walks when no scope is given", async () => {
    groupWalkService.listGroupWalks.mockResolvedValue([]);

    await listGroupWalks({ user, query: {} }, mockRes());

    expect(groupWalkService.listGroupWalks).toHaveBeenCalledWith("me", "upcoming");
  });

  it("returns one walk", async () => {
    groupWalkService.getGroupWalk.mockResolvedValue(walk);
    const res = mockRes();

    await getGroupWalk({ user, params: { id: "w1" } }, res);

    expect(groupWalkService.getGroupWalk).toHaveBeenCalledWith("me", "w1");
    expect(res.json).toHaveBeenCalledWith({ success: true, data: walk });
  });

  it("updates a walk", async () => {
    groupWalkService.updateGroupWalk.mockResolvedValue(walk);
    const body = { title: "New title" };

    await updateGroupWalk({ user, params: { id: "w1" }, body }, mockRes());

    expect(groupWalkService.updateGroupWalk).toHaveBeenCalledWith("me", "w1", body);
  });

  it("cancels a walk", async () => {
    groupWalkService.cancelGroupWalk.mockResolvedValue({ ...walk, status: "cancelled" });
    const res = mockRes();

    await cancelGroupWalk({ user, params: { id: "w1" } }, res);

    expect(groupWalkService.cancelGroupWalk).toHaveBeenCalledWith("me", "w1");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { ...walk, status: "cancelled" },
    });
  });

  it("invites more users", async () => {
    groupWalkService.inviteToGroupWalk.mockResolvedValue(walk);

    await inviteToGroupWalk({ user, params: { id: "w1" }, body: { userIds: ["u3"] } }, mockRes());

    expect(groupWalkService.inviteToGroupWalk).toHaveBeenCalledWith("me", "w1", ["u3"]);
  });

  it("removes a participant", async () => {
    groupWalkService.removeParticipant.mockResolvedValue(walk);

    await removeGroupWalkParticipant({ user, params: { id: "w1", userId: "u3" } }, mockRes());

    expect(groupWalkService.removeParticipant).toHaveBeenCalledWith("me", "w1", "u3");
  });

  it("records my response", async () => {
    groupWalkService.respondToGroupWalk.mockResolvedValue({ myStatus: "accepted" });
    const res = mockRes();

    await respondToGroupWalk({ user, params: { id: "w1" }, body: { status: "accepted" } }, res);

    expect(groupWalkService.respondToGroupWalk).toHaveBeenCalledWith("me", "w1", "accepted");
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { myStatus: "accepted" } });
  });

  it.each([
    ["invalid invitees (HttpError)", new HttpError(400, "You can only invite friends", { invalidIds: ["u9"] })],
    ["an unexpected error", new Error("connection lost")],
  ])("leaves %s to the error handler", async (_case, error) => {
    groupWalkService.createGroupWalk.mockRejectedValue(error);

    await expect(createGroupWalk({ user, body: {} }, mockRes())).rejects.toBe(error);
  });
});
