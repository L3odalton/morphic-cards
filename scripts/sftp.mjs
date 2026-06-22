// Shared SFTP uploader for Morphic.
// Cross-platform (no rsync). Reads gitignored .env.deploy via dotenv.
// Used by both `npm run deploy` (scripts/deploy.mjs) and `npm run dev`
// (rollup watch auto-deploy plugin in rollup.config.js).

import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync, statSync } from "node:fs";
import dotenv from "dotenv";
import SftpClient from "ssh2-sftp-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");
const ENV_FILE = join(ROOT, ".env.deploy");

/** Load and validate deploy config from .env.deploy. Throws on misconfig. */
export function loadConfig() {
  if (!existsSync(ENV_FILE)) {
    throw new Error(
      ".env.deploy not found — copy .env.deploy.example to .env.deploy and fill it in.",
    );
  }
  dotenv.config({ path: ENV_FILE, quiet: true });

  const host = process.env.MORPHIC_SSH_HOST?.trim();
  const user = process.env.MORPHIC_SSH_USER?.trim();
  const remotePath = process.env.MORPHIC_REMOTE_PATH?.trim();
  const port = Number(process.env.MORPHIC_SSH_PORT?.trim() || "22");
  const keyPath = process.env.MORPHIC_SSH_KEY?.trim();
  const passphrase = process.env.MORPHIC_SSH_PASSPHRASE?.trim() || undefined;
  const password = process.env.MORPHIC_SSH_PASSWORD?.trim() || undefined;
  const insecure = process.env.MORPHIC_SSH_INSECURE?.trim() === "1";

  const missing = [];
  if (!host) missing.push("MORPHIC_SSH_HOST");
  if (!user) missing.push("MORPHIC_SSH_USER");
  if (!remotePath) missing.push("MORPHIC_REMOTE_PATH");
  if (missing.length) {
    throw new Error(`Missing required deploy settings: ${missing.join(", ")}`);
  }
  if (!keyPath && !password) {
    throw new Error("Provide either MORPHIC_SSH_KEY (key path) or MORPHIC_SSH_PASSWORD.");
  }

  const connect = {
    host,
    port,
    username: user,
    // ssh2 strict host checking off only when explicitly opted in.
    ...(insecure ? { algorithms: undefined } : {}),
  };
  if (keyPath) {
    if (!existsSync(keyPath)) {
      throw new Error(`MORPHIC_SSH_KEY points to a missing file: ${keyPath}`);
    }
    connect.privateKey = readFileSync(keyPath);
    if (passphrase) connect.passphrase = passphrase;
  } else {
    connect.password = password;
  }

  return { connect, remotePath, host, port, user, authMethod: keyPath ? "key" : "password" };
}

/**
 * Upload the contents of /dist to the configured remote path over SFTP.
 * @param {{ dryRun?: boolean, source?: string }} [opts]
 */
export async function uploadDist(opts = {}) {
  const { dryRun = false, source = "deploy" } = opts;
  const cfg = loadConfig();

  if (!existsSync(DIST) || !statSync(DIST).isDirectory()) {
    throw new Error("dist/ not found — run `npm run build` first.");
  }
  const bundle = join(DIST, "morphic.js");
  if (!existsSync(bundle)) {
    throw new Error("dist/morphic.js not found — build did not produce a bundle.");
  }
  const sizeKb = (statSync(bundle).size / 1024).toFixed(1);

  if (dryRun) {
    console.log("[morphic] DRY RUN — no connection made.");
    console.log(`[morphic]   target : ${cfg.user}@${cfg.host}:${cfg.port}`);
    console.log(`[morphic]   auth   : ${cfg.authMethod}`);
    console.log(`[morphic]   remote : ${cfg.remotePath}`);
    console.log(`[morphic]   local  : ${DIST} (morphic.js ${sizeKb} kB)`);
    console.log("[morphic] DRY RUN OK ✓");
    return { dryRun: true };
  }

  const sftp = new SftpClient(`morphic-${source}`);
  const started = Date.now();
  try {
    await sftp.connect(cfg.connect);
    const exists = await sftp.exists(cfg.remotePath);
    if (!exists) {
      await sftp.mkdir(cfg.remotePath, true);
    }
    await sftp.uploadDir(DIST, cfg.remotePath);
    const ms = Date.now() - started;
    console.log(
      `[morphic] ✓ pushed dist → ${cfg.user}@${cfg.host}:${cfg.remotePath} ` +
        `(morphic.js ${sizeKb} kB, ${ms} ms) [${source}]`,
    );
    return { dryRun: false, ms };
  } finally {
    await sftp.end().catch(() => {});
  }
}
