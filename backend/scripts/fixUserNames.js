/**
 * One-off migration: names became required, so accounts created without one
 * get the placeholder the API already shows for them ("Unnamed user").
 *
 *   node scripts/fixUserNames.js           # dry run: only prints what would change
 *   node scripts/fixUserNames.js --apply   # writes the changes
 *
 * Names longer than the limit are only reported; shorten them by hand.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";
import { UNNAMED_USER_NAME } from "../src/utils/userSummary.js";
import { planNameFixes } from "../src/utils/validation.js";

const apply = process.argv.includes("--apply");

const run = async () => {
  await connectDB();

  const users = await User.find({}, { name: 1 }).lean();
  const { fill, tooLong } = planNameFixes(users, UNNAMED_USER_NAME);

  console.log(`Checked ${users.length} user(s).`);
  console.log(`${fill.length} account(s) without a name:`);
  for (const { _id } of fill) console.log(`  ${_id}`);

  if (tooLong.length > 0) {
    console.log(`\n${tooLong.length} name(s) over the limit, left unchanged (shorten manually):`);
    for (const { _id, name } of tooLong) console.log(`  ${_id}: "${name}"`);
  }

  if (!apply) {
    console.log("\nDry run - nothing was changed. Re-run with --apply to write the changes.");
    return;
  }

  for (const { _id, to } of fill) {
    await User.updateOne({ _id }, { $set: { name: to } });
  }
  console.log(`\nNamed ${fill.length} account(s) "${UNNAMED_USER_NAME}".`);
};

run()
  .catch((error) => {
    console.error("Fixing user names failed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
