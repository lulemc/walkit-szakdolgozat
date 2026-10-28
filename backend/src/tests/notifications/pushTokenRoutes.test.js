import { describe, it, expect, vi, beforeEach } from "vitest";
import { protect, requireSelf } from "../../middleware/authMiddleware.js";
import { registerPushToken, removePushToken } from "../../services/pushService.js";
import { HttpError } from "../../utils/httpError.js";
import swaggerSpec from "../../config/swagger.js";
import app from "../../app.js";
import { inject } from "../helpers/inject.js";

vi.mock("../../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: "me" };
    next();
  }),
  requireSelf: vi.fn((req, res, next) => next()),
}));
vi.mock("../../services/pushService.js", () => ({
  registerPushToken: vi.fn(() => Promise.resolve()),
  removePushToken: vi.fn(() => Promise.resolve()),
}));

const TOKEN = "ExponentPushToken[abc]";
const ID = "64b7f0c2a1b2c3d4e5f60718";

beforeEach(() => vi.clearAllMocks());

describe("push token routes", () => {
  it("registers this phone for notifications, only for myself", async () => {
    const response = await inject(app, {
      method: "POST",
      url: `/api/users/${ID}/push-tokens`,
      body: { token: TOKEN, language: "hu" },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: "Push notifications turned on" });
    expect(registerPushToken).toHaveBeenCalledWith(ID, TOKEN, "hu");
    expect(protect).toHaveBeenCalled();
    expect(requireSelf).toHaveBeenCalled();
  });

  it("forgets this phone", async () => {
    const response = await inject(app, {
      method: "DELETE",
      url: `/api/users/${ID}/push-tokens`,
      body: { token: TOKEN },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: "Push notifications turned off" });
    expect(removePushToken).toHaveBeenCalledWith(ID, TOKEN);
    expect(requireSelf).toHaveBeenCalled();
  });

  it("passes a bad token on as 400", async () => {
    registerPushToken.mockRejectedValue(new HttpError(400, "token must be an Expo push token"));

    const response = await inject(app, { method: "POST", url: `/api/users/${ID}/push-tokens`, body: { token: "x" } });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: "token must be an Expo push token" });
  });
});

describe("Swagger spec: push tokens", () => {
  it.each(["post", "delete"])("documents %s /api/users/{id}/push-tokens behind login", (method) => {
    const operation = swaggerSpec.paths["/api/users/{id}/push-tokens"]?.[method];

    expect(operation).toBeDefined();
    expect(operation.tags).toEqual(["Users"]);
    expect(operation.security).toEqual([{ bearerAuth: [] }]);
  });
});
