import { describe, it, expect, vi, beforeEach } from "vitest";
import { protect, requireSelf } from "../../middleware/authMiddleware.js";
import * as userSearchService from "../../services/userSearchService.js";
import app from "../../app.js";
import { inject } from "../helpers/inject.js";

vi.mock("../../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: "me" };
    next();
  }),
  // Like the real middleware for another user's id: reaching it means /search hit /:id
  requireSelf: vi.fn((req, res) => res.status(403).json({ message: "Forbidden" })),
}));

vi.mock("../../services/userSearchService.js", () => ({ searchUsers: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/users/search", () => {
  it("is served by the search endpoint, not the /:id routes", async () => {
    userSearchService.searchUsers.mockResolvedValue([{ _id: "u2", name: "Ann" }]);

    const res = await inject(app, { url: "/api/users/search?q=ann" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [{ _id: "u2", name: "Ann" }] });
    expect(userSearchService.searchUsers).toHaveBeenCalledWith("me", "ann");
    expect(requireSelf).not.toHaveBeenCalled();
  });

  it("requires login", async () => {
    userSearchService.searchUsers.mockResolvedValue([]);

    await inject(app, { url: "/api/users/search?q=ann" });

    expect(protect).toHaveBeenCalled();
  });

  it("keeps the /:id routes protected by requireSelf", async () => {
    const res = await inject(app, { url: "/api/users/someone-else" });

    expect(res.status).toBe(403);
    expect(requireSelf).toHaveBeenCalled();
  });
});
