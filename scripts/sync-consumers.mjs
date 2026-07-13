import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const consumers = [
  { name: "cee-app", path: path.resolve(root, "..", "cee-app") },
  { name: "ianrigby.com", path: path.resolve(root, "..", "ianrigby.com") },
  { name: "rockyvelvet.space", path: path.resolve(root, "..", "rockyvelvet.space") },
];

function run(repo, command, args) {
  const result = spawnSync(command, args, {
    cwd: repo,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function lockfileKitSha(repo) {
  const lockPath = path.join(repo, "bun.lock");
  if (!fs.existsSync(lockPath)) return null;
  const lock = fs.readFileSync(lockPath, "utf8");
  const match = lock.match(/@chasecee\/sanity-kit@github:chasecee\/sanity-kit#([0-9a-f]{7,40})/);
  return match?.[1] ?? null;
}

const shas = new Map();

for (const consumer of consumers) {
  if (!fs.existsSync(consumer.path)) {
    console.error(`Missing consumer repo: ${consumer.path}`);
    process.exit(1);
  }

  console.log(`\n== ${consumer.name} ==`);
  run(consumer.path, "bun", ["run", "sync"]);

  const sha = lockfileKitSha(consumer.path);
  if (!sha) {
    console.error(`Unable to resolve @chasecee/sanity-kit SHA from ${consumer.name}/bun.lock`);
    process.exit(1);
  }
  shas.set(consumer.name, sha);
  console.log(`Resolved @chasecee/sanity-kit#${sha}`);
}

const unique = new Set(shas.values());
if (unique.size !== 1) {
  console.error("\nLockfile SHAs are not aligned:");
  for (const [name, sha] of shas.entries()) {
    console.error(`- ${name}: ${sha}`);
  }
  process.exit(1);
}

const [sha] = unique;
console.log(`\nAll consumers aligned at @chasecee/sanity-kit#${sha}`);
