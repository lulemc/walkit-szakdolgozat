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

  it.each([
    ["a too-short query (HttpError)", new HttpError(400, "Search query must be at least 2 characters")],
    ["an unexpected error", new Error("connection lost")],
  ])("leaves %s to the error handler", async (_case, error) => {
    userSearchService.searchUsers.mockRejectedValue(error);

    await expect(searchUsers({ user: { id: "me" }, query: { q: "a" } }, mockRes())).rejects.toBe(error);
  });
});
