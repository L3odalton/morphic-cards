// Shared SFTP uploader for Morphic.
// Auth: SSH agent only (same as `ssh user@host`). No key files, no passwords.
// Configure host/user/port/remote path in .env.deploy.

import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import dotenv from "dotenv";
import SftpClient from "ssh2-sftp-client";

const require = createRequire(import.meta.url);
const { OpenSSHAgent } = require("ssh2");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");
const ENV_FILE = join(ROOT, ".env.deploy");

function agentSocket() {
  if (process.env.SSH_AUTH_SOCK) return process.env.SSH_AUTH_SOCK;
  if (process.platform === "win32") return "\\\\.\\pipe\\openssh-ssh-agent";
  throw new Error("SSH agent not available — if `ssh user@host` works, start your agent first.");
}

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

  const missing = [];
  if (!host) missing.push("MORPHIC_SSH_HOST");
  if (!user) missing.push("MORPHIC_SSH_USER");
  if (!remotePath) missing.push("MORPHIC_REMOTE_PATH");
  if (missing.length) {
    throw new Error(`Missing required deploy settings: ${missing.join(", ")}`);
  }

  const connect = {
    host,
    port,
    username: user,
    agent: new OpenSSHAgent(agentSocket()),
  };

  return { connect, remotePath, host, port, user };
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
    console.log(`[morphic]   auth   : ssh-agent`);
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
