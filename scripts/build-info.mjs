// build-info: writes dist/health.json after prerender (commit sha, build time, route count).
// Never fails the build: a missing git or dist only logs a warning and exits 0.
import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = process.env.PRERENDER_DIST ? resolve(process.env.PRERENDER_DIST) : join(ROOT, "dist");

function commitSha() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

/** Count prerendered routes: every directory (outside assets/art) holding an index.html, plus the root. */
export function countRoutes(dist) {
  let n = existsSync(join(dist, "index.html")) ? 1 : 0;
  const walk = (dir, depth) => {
    for (const name of readdirSync(dir)) {
      if (depth === 0 && ["assets", "art", "brand", "logos"].includes(name)) continue;
      const p = join(dir, name);
      if (!statSync(p).isDirectory()) continue;
      if (existsSync(join(p, "index.html"))) n++;
      walk(p, depth + 1);
    }
  };
  walk(dist, 0);
  return n;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("build-info.mjs")) {
  if (!existsSync(DIST)) {
    console.warn("[build-info] dist missing, skipped");
  } else {
    const info = {
      status: "ok",
      commit: commitSha(),
      builtAt: new Date().toISOString(),
      routes: countRoutes(DIST),
      environment: process.env.VERCEL_ENV ?? (process.env.CI ? "ci" : "local"),
    };
    writeFileSync(join(DIST, "health.json"), JSON.stringify(info, null, 2) + "\n");
    console.log(`[build-info] dist/health.json  commit=${info.commit?.slice(0, 8) ?? "n/a"} routes=${info.routes}`);
  }
}
