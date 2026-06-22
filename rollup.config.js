import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const isWatch = Boolean(process.env.ROLLUP_WATCH);
const isProd = !isWatch;

/**
 * In watch mode (`npm run dev`) we auto-upload the freshly built bundle to the
 * configured Home Assistant instance over SFTP after every successful rebuild.
 * The uploader is imported lazily so a missing/uncofigured .env.deploy never
 * breaks a plain `npm run build`.
 */
function autoDeployOnWatch() {
  let uploader = null;
  let announced = false;
  return {
    name: "morphic-auto-deploy",
    async buildStart() {
      if (!isWatch || announced) return;
      announced = true;
      try {
        uploader = await import("./scripts/sftp.mjs");
        const cfg = uploader.loadConfig();
        console.log(
          `\n[morphic] dev auto-deploy → ${cfg.user}@${cfg.host}:${cfg.remotePath}\n`,
        );
      } catch (err) {
        uploader = null;
        console.warn(
          `\n[morphic] dev auto-deploy DISABLED: ${err.message}\n` +
            `[morphic] copy .env.deploy.example to .env.deploy to enable live push.\n`,
        );
      }
    },
    async writeBundle() {
      if (!isWatch || !uploader) return;
      try {
        await uploader.uploadDist({ source: "dev-watch" });
      } catch (err) {
        console.warn(`[morphic] dev auto-deploy failed: ${err.message}`);
      }
    },
  };
}

export default {
  input: "src/morphic.ts",
  output: {
    file: "dist/morphic.js",
    format: "es",
    sourcemap: !isProd,
    inlineDynamicImports: true,
  },
  plugins: [
    nodeResolve({ browser: true, extensions: [".ts", ".js", ".mjs"] }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      noEmitOnError: isProd,
      compilerOptions: {
        noEmit: false,
        declaration: false,
        sourceMap: !isProd,
      },
    }),
    autoDeployOnWatch(),
    isProd &&
      terser({
        ecma: 2020,
        format: { comments: false },
      }),
  ].filter(Boolean),
  onwarn(warning, warn) {
    // lit ships pure annotations that rollup occasionally flags; keep output clean.
    if (warning.code === "THIS_IS_UNDEFINED") return;
    warn(warning);
  },
};
