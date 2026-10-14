/**
 * One-off migration: lowercase and trim existing users' emails.
 *
 *   node scripts/normaliseEmails.js           # dry run: only prints what would change
 *   node scripts/normaliseEmails.js --apply   # writes the changes
 *
 * Accounts whose emails differ only by case are reported as collisions and
 * never changed or merged, because the unique index would reject them and
 * deciding which account to keep is a manual decision.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";
import { planEmailNormalisation } from "../src/utils/email.js";

const apply = process.argv.includes("--apply");

const run = async () => {
  await connectDB();

  // lean() reads the stored values as they are, without the model's lowercase setter
  const users = await User.find({}, { email: 1 }).lean();
  const { updates, collisions } = planEmailNormalisation(users);

  console.log(`Checked ${users.length} user(s).`);
  console.log(`${updates.length} email(s) to normalise:`);
  for (const { _id, from, to } of updates) {
    console.log(`  ${_id}: "${from}" -> "${to}"`);
  }

  if (collisions.length > 0) {
    console.log(`\n${collisions.length} collision(s) left unchanged (resolve manually):`);
    for (const { email, users: group } of collisions) {
      console.log(`  ${email}: ${group.map((u) => `${u._id} ("${u.email}")`).join(", ")}`);
    }
  }

  if (!apply) {
    console.log("\nDry run - nothing was changed. Re-run with --apply to write the changes.");
    return;
  }

  for (const { _id, to } of updates) {
    await User.updateOne({ _id }, { $set: { email: to } });
  }
  console.log(`\nUpdated ${updates.length} email(s).`);
};

run()
  .catch((error) => {
    console.error("Email normalisation failed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
