// `npm run deploy` -> build (run separately by the npm script) then upload /dist.
// `npm run deploy:dry` -> validate config + bundle without connecting.

import { uploadDist } from "./sftp.mjs";

const dryRun = process.argv.includes("--dry-run");

try {
  await uploadDist({ dryRun, source: dryRun ? "dry-run" : "deploy" });
  process.exit(0);
} catch (err) {
  console.error(`\n[morphic] deploy failed: ${err.message}\n`);
  process.exit(1);
}
