import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const consumers = [
  path.resolve(root, "..", "cee-app"),
  path.resolve(root, "..", "ianrigby.com"),
  path.resolve(root, "..", "rockyvelvet.space"),
];

for (const repo of consumers) {
  const name = path.basename(repo);
  console.log(`\n== ${name} ==`);

  const update = spawnSync("bun", [
    "update",
    "@chasecee/sanity-kit@github:chasecee/sanity-kit",
  ], {
    cwd: repo,
    stdio: "inherit",
  });
  if (update.status !== 0) process.exit(update.status ?? 1);

  const install = spawnSync("bun", ["install"], {
    cwd: repo,
    stdio: "inherit",
  });
  if (install.status !== 0) process.exit(install.status ?? 1);
}
