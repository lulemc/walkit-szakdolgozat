import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import User from "../../models/User.js";
import { HttpError } from "../../utils/httpError.js";
import { logger } from "../../utils/logger.js";
import {
  MAX_PUSH_TOKENS,
  PUSH_URL,
  isExpoPushToken,
  registerPushToken,
  removePushToken,
  sendPush,
} from "../../services/pushService.js";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
vi.mock("../../models/User.js", () => ({
  default: { find: vi.fn(), updateOne: vi.fn(), updateMany: vi.fn() },
}));
vi.mock("../../utils/logger.js", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const TOKEN = "ExponentPushToken[abc123]";
const usersWithTokens = (users) => {
  const q = { select: vi.fn(() => q), lean: vi.fn(() => Promise.resolve(users)) };
  User.find.mockReturnValue(q);
};
const ok = (count) => ({ data: { data: Array.from({ length: count }, () => ({ status: "ok" })) } });

beforeEach(() => {
  vi.clearAllMocks();
  User.updateOne.mockResolvedValue({});
  User.updateMany.mockResolvedValue({});
});

describe("isExpoPushToken", () => {
  it.each(["ExponentPushToken[abc]", "ExpoPushToken[x-y_z]"])("accepts %s", (token) => {
    expect(isExpoPushToken(token)).toBe(true);
  });

  it.each(["", "abc", "ExponentPushToken[]", "ExponentPushToken[abc", 42, undefined])("rejects %s", (token) => {
    expect(isExpoPushToken(token)).toBe(false);
  });
});

describe("registerPushToken", () => {
  it("keeps the phone's token with its language, newest last and at most a few per user", async () => {
    await registerPushToken("me", TOKEN, "hu");

    // A phone that switched accounts only notifies the new one
    expect(User.updateMany).toHaveBeenCalledWith({ _id: { $ne: "me" } }, { $pull: { pushTokens: { token: TOKEN } } });
    expect(User.updateOne).toHaveBeenNthCalledWith(1, { _id: "me" }, { $pull: { pushTokens: { token: TOKEN } } });
    expect(User.updateOne).toHaveBeenNthCalledWith(
      2,
      { _id: "me" },
      { $push: { pushTokens: { $each: [{ token: TOKEN, language: "hu" }], $slice: -MAX_PUSH_TOKENS } } },
    );
  });

  it("uses English for a language the backend has no texts for", async () => {
    await registerPushToken("me", TOKEN, "de");

    expect(User.updateOne.mock.calls[1][1].$push.pushTokens.$each).toEqual([{ token: TOKEN, language: "en" }]);
  });

  it("rejects something that isn't an Expo push token", async () => {
    const error = await registerPushToken("me", "nope", "en").catch((e) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("token must be an Expo push token");
    expect(User.updateOne).not.toHaveBeenCalled();
  });
});

describe("removePushToken", () => {
  it("forgets the phone's token", async () => {
    await removePushToken("me", TOKEN);

    expect(User.updateOne).toHaveBeenCalledWith({ _id: "me" }, { $pull: { pushTokens: { token: TOKEN } } });
  });
});

describe("sendPush", () => {
  const message = (language) => (language === "hu" ? { title: "Szia", body: "Magyarul" } : { title: "Hi", body: "In English" });

  it("sends each phone the message in its own language", async () => {
    usersWithTokens([
      { _id: "u1", pushTokens: [{ token: "ExponentPushToken[1]", language: "en" }] },
      { _id: "u2", pushTokens: [{ token: "ExponentPushToken[2]", language: "hu" }] },
    ]);
    axios.post.mockResolvedValue(ok(2));

    await sendPush(["u1", "u2"], message, { type: "friendRequest" });

    expect(User.find).toHaveBeenCalledWith({ _id: { $in: ["u1", "u2"] } });
    expect(axios.post).toHaveBeenCalledWith(
      PUSH_URL,
      [
        { to: "ExponentPushToken[1]", sound: "default", title: "Hi", body: "In English", data: { type: "friendRequest" } },
        { to: "ExponentPushToken[2]", sound: "default", title: "Szia", body: "Magyarul", data: { type: "friendRequest" } },
      ],
      expect.objectContaining({ timeout: expect.any(Number) }),
    );
  });

  it("sends nothing when nobody has a phone registered", async () => {
    usersWithTokens([{ _id: "u1", pushTokens: [] }, { _id: "u2" }]);

    await sendPush(["u1", "u2"], message);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("sends nothing without recipients", async () => {
    await sendPush([], message);

    expect(User.find).not.toHaveBeenCalled();
  });

  it("sends at most 100 messages per request, as Expo asks", async () => {
    const pushTokens = Array.from({ length: 150 }, (_, i) => ({ token: `ExponentPushToken[${i}]`, language: "en" }));
    usersWithTokens([{ _id: "u1", pushTokens }]);
    axios.post.mockImplementation((url, chunk) => Promise.resolve(ok(chunk.length)));

    await sendPush(["u1"], message);

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post.mock.calls[0][1]).toHaveLength(100);
    expect(axios.post.mock.calls[1][1]).toHaveLength(50);
  });

  it("forgets tokens of phones that no longer have the app", async () => {
    usersWithTokens([
      {
        _id: "u1",
        pushTokens: [
          { token: "ExponentPushToken[gone]", language: "en" },
          { token: "ExponentPushToken[here]", language: "en" },
        ],
      },
    ]);
    axios.post.mockResolvedValue({
      data: { data: [{ status: "error", details: { error: "DeviceNotRegistered" } }, { status: "ok" }] },
    });

    await sendPush(["u1"], message);

    expect(User.updateMany).toHaveBeenCalledWith({}, { $pull: { pushTokens: { token: { $in: ["ExponentPushToken[gone]"] } } } });
  });

  // A notification is a nice extra: it must never break the request that caused it
  it("only logs a warning when sending fails", async () => {
    usersWithTokens([{ _id: "u1", pushTokens: [{ token: TOKEN, language: "en" }] }]);
    axios.post.mockRejectedValue(new Error("network down"));

    await expect(sendPush(["u1"], message)).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });
});
