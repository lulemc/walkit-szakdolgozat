import axios from "axios";
import User from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

/** Expo's push service, which passes notifications on to Apple (APNs) and Google (FCM) */
export const PUSH_URL = "https://exp.host/--/api/v2/push/send";
export const PUSH_TIMEOUT_MS = 10_000;
// Expo accepts at most 100 messages per request
export const PUSH_CHUNK_SIZE = 100;
/** Phones remembered per user; the oldest is dropped when another one registers */
export const MAX_PUSH_TOKENS = 10;
export const PUSH_LANGUAGES = ["en", "hu"];

const TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\]]+\]$/;

export const isExpoPushToken = (token) => typeof token === "string" && TOKEN_PATTERN.test(token);

/** Remembers the phone's push token, with the language its notifications should be in */
export const registerPushToken = async (userId, token, language) => {
  if (!isExpoPushToken(token)) throw new HttpError(400, "token must be an Expo push token");
  const entry = { token, language: PUSH_LANGUAGES.includes(language) ? language : "en" };

  // A phone that switched accounts only notifies the account now logged in
  await User.updateMany({ _id: { $ne: userId } }, { $pull: { pushTokens: { token } } });
  // Moves the token to the end (newest), updating its language
  await User.updateOne({ _id: userId }, { $pull: { pushTokens: { token } } });
  await User.updateOne(
    { _id: userId },
    { $push: { pushTokens: { $each: [entry], $slice: -MAX_PUSH_TOKENS } } },
  );
};

/** Forgets the phone, e.g. on logout */
export const removePushToken = async (userId, token) => {
  await User.updateOne({ _id: userId }, { $pull: { pushTokens: { token } } });
};

const chunks = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/**
 * Sends a notification to every registered phone of the users.
 * `message(language)` gives `{ title, body }` in that language.
 * Never throws: a notification must not break the request that caused it.
 */
export const sendPush = async (userIds, message, data = {}) => {
  if (userIds.length === 0) return;
  try {
    const users = await User.find({ _id: { $in: userIds } }).select("pushTokens").lean();
    const messages = users
      .flatMap((user) => user.pushTokens ?? [])
      .map(({ token, language }) => ({ to: token, sound: "default", ...message(language), data }));

    const gone = [];
    for (const chunk of chunks(messages, PUSH_CHUNK_SIZE)) {
      const response = await axios.post(PUSH_URL, chunk, {
        timeout: PUSH_TIMEOUT_MS,
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
      // One ticket per message, in the same order
      (response.data?.data ?? []).forEach((ticket, index) => {
        if (ticket.details?.error === "DeviceNotRegistered") gone.push(chunk[index].to);
      });
    }
    if (gone.length > 0) {
      await User.updateMany({}, { $pull: { pushTokens: { token: { $in: gone } } } });
    }
  } catch (error) {
    logger.warn(`Push notification not sent: ${error.message}`);
  }
};
