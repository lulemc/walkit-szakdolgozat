#!/usr/bin/env node
/**
 * npm records the registry it installed from in package-lock.json. Installing
 * through an internal mirror writes mirror URLs that GitHub's CI runners can't
 * reach, so `npm ci` fails there. This rewrites registry tarball URLs to the
 * public npm registry; integrity hashes are unchanged, so npm still verifies
 * every package.
 *
 * Usage: node scripts/normalize-lockfile-registry.js [--check] <package-lock.json>...
 */
const fs = require("fs");

const PUBLIC_REGISTRY = "https://registry.npmjs.org/";
const PUBLIC_HOST = "registry.npmjs.org";
// npm tarball layout: <registry prefix>/<name or @scope/name>/-/<file>.tgz
const TARBALL_URL = /^https?:\/\/.+?\/((?:@[^/]+\/)?[^/@]+\/-\/[^/]+\.tgz)$/;

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const files = args.filter((arg) => arg !== "--check");

if (files.length === 0) {
  console.error("Usage: normalize-lockfile-registry.js [--check] <package-lock.json>...");
  process.exit(2);
}

let offending = 0;

for (const file of files) {
  const lock = JSON.parse(fs.readFileSync(file, "utf8"));
  let rewritten = 0;

  for (const [path, meta] of Object.entries(lock.packages || {})) {
    const url = meta.resolved;
    if (!url || !/^https?:\/\//.test(url) || new URL(url).host === PUBLIC_HOST) continue;

    const match = url.match(TARBALL_URL);
    if (!match) continue; // not a registry tarball (e.g. a direct URL dependency)

    if (checkOnly) {
      offending++;
      console.error(`${file}: ${path} resolves from ${new URL(url).host}`);
    } else {
      meta.resolved = PUBLIC_REGISTRY + match[1];
      rewritten++;
    }
  }

  if (!checkOnly) {
    fs.writeFileSync(file, JSON.stringify(lock, null, 2) + "\n");
    console.log(`${file}: rewrote ${rewritten} URL(s) to ${PUBLIC_REGISTRY}`);
  }
}

if (checkOnly) {
  if (offending > 0) {
    console.error(
      `\n${offending} package(s) resolve from a non-public registry. ` +
        "Run: node scripts/normalize-lockfile-registry.js <lockfile>",
    );
    process.exit(1);
  }
  console.log("All lockfile URLs use the public npm registry.");
}
