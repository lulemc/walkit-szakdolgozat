import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userSearchService from "../../services/userSearchService.js";
import { HttpError } from "../../utils/httpError.js";
import { searchUsers } from "../../controllers/userController.js";

vi.mock("../../services/userSearchService.js", () => ({ searchUsers: vi.fn() }));

const mockRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("userController.searchUsers", () => {
  it("returns the matches for the query", async () => {
    const results = [{ _id: "u2", name: "Ann", relationship: "none" }];
    userSearchService.searchUsers.mockResolvedValue(results);
    const res = mockRes();

    await searchUsers({ user: { id: "me" }, query: { q: "ann" } }, res);

    expect(userSearchService.searchUsers).toHaveBeenCalledWith("me", "ann");
    expect(res.json).toHaveBeenCalledWith({ success: true, data: results });
  });

  it("sends a 400 for a too-short query", async () => {
    userSearchService.searchUsers.mockRejectedValue(
      new HttpError(400, "Search query must be at least 2 characters"),
    );
    const res = mockRes();

    await searchUsers({ user: { id: "me" }, query: { q: "a" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Search query must be at least 2 characters",
    });
  });

  it("responds 500 without internal details on an unexpected error", async () => {
    userSearchService.searchUsers.mockRejectedValue(new Error("connection lost"));
    const res = mockRes();

    await searchUsers({ user: { id: "me" }, query: { q: "ann" } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to search users" });
  });
});
