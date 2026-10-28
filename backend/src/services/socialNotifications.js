import { sendPush } from "./pushService.js";

// The texts of each notification, in the languages the app has (see pushService.PUSH_LANGUAGES)
const inLanguage = (texts) => (language) => texts[language] ?? texts.en;

const idOf = (user) => String(user?._id ?? user);

export const notifyFriendRequest = (recipientId, requesterName) =>
  sendPush(
    [recipientId],
    inLanguage({
      en: { title: "New friend request", body: `${requesterName} wants to be your friend on WalkIt` },
      hu: { title: "Új barátkérés", body: `${requesterName} szeretne a barátod lenni a WalkItben` },
    }),
    { type: "friendRequest" },
  );

export const notifyFriendAccepted = (requesterId, accepterName) =>
  sendPush(
    [requesterId],
    inLanguage({
      en: { title: "Friend request accepted", body: `${accepterName} accepted your friend request` },
      hu: { title: "Elfogadott barátkérés", body: `${accepterName} elfogadta a barátkérésedet` },
    }),
    { type: "friendAccepted" },
  );

/**
 * Tells the invitees who still have to answer; after "invite more", only
 * `onlyUserIds` (the people just invited)
 */
export const notifyWalkInvitation = (walk, organiserName, onlyUserIds) => {
  const only = onlyUserIds && new Set(onlyUserIds.map(String));
  const userIds = walk.participants
    .filter((participant) => participant.status === "invited")
    .map((participant) => idOf(participant.user))
    .filter((id) => !only || only.has(id));
  if (userIds.length === 0) return Promise.resolve();

  const title = walk.title;
  return sendPush(
    userIds,
    inLanguage({
      en: {
        title: "Group walk invitation",
        body: title ? `${organiserName} invited you to “${title}”` : `${organiserName} invited you to a group walk`,
      },
      hu: {
        title: "Meghívás közös sétára",
        body: title ? `${organiserName} meghívott: „${title}”` : `${organiserName} meghívott egy közös sétára`,
      },
    }),
    { type: "walkInvitation", walkId: String(walk._id) },
  );
};

/** Tells the invitees who are coming or were still invited that the walk is off */
export const notifyWalkCancelled = (walk) => {
  const userIds = walk.participants
    .filter((participant) => participant.role !== "organiser" && participant.status !== "declined")
    .map((participant) => idOf(participant.user));
  if (userIds.length === 0) return Promise.resolve();

  const title = walk.title;
  return sendPush(
    userIds,
    inLanguage({
      en: { title: "Group walk cancelled", body: title ? `“${title}” has been cancelled` : "The group walk has been cancelled" },
      hu: { title: "Elmarad a közös séta", body: title ? `„${title}” elmarad` : "A közös séta elmarad" },
    }),
    { type: "walkCancelled", walkId: String(walk._id) },
  );
};
