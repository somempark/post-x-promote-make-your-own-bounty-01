// post-x-promote-make-your-own-bounty-01 — main.ts
// Validates POST.json (the X post link for this make.fun entry) and writes
// a deterministic summary to MAKEFUN_OUTPUT_DIR/post-summary.json.
// Node 22, standard library only, no network, no clock, no randomness:
// the same POST.json always produces the same summary.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const COMPETITION = "post-x-promote-make-your-own-bounty-01";
const HANDLE = "kongtouhunter7";
const PLAY_CODE = "makefun-meadow-birch-north";
const QUOTE_URL = "https://x.com/makefunai/status/2124915864336236646";

const BOT_DIR =
  process.env.MAKEFUN_BOT_DIR ?? dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? join(BOT_DIR, "out");

type PostFile = {
  url?: unknown;
  status?: unknown;
  handle?: unknown;
  play_code?: unknown;
  quote?: unknown;
};

type Check = { name: string; pass: boolean; detail: string };

function isPostUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+$/.test(
    value,
  );
}

function postUrlHandle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /^https:\/\/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)\/status\/[0-9]+$/.exec(
    value,
  );
  return m ? m[1] : null;
}

function main(): void {
  const postPath = join(BOT_DIR, "POST.json");
  let post: PostFile = {};
  let readOk = true;
  try {
    post = JSON.parse(readFileSync(postPath, "utf8")) as PostFile;
  } catch {
    readOk = false;
  }

  const checks: Check[] = [];
  checks.push({
    name: "post_json_readable",
    pass: readOk,
    detail: readOk ? "POST.json parsed" : "POST.json missing or not valid JSON",
  });
  checks.push({
    name: "post_url_format",
    pass: isPostUrl(post.url),
    detail: typeof post.url === "string" ? post.url : "no url yet",
  });
  checks.push({
    name: "handle_matches",
    pass: post.handle === HANDLE,
    detail: `expected ${HANDLE}`,
  });
  checks.push({
    name: "play_code_matches",
    pass: post.play_code === PLAY_CODE,
    detail: `expected ${PLAY_CODE}`,
  });
  checks.push({
    name: "post_url_handle",
    pass: postUrlHandle(post.url) === HANDLE,
    detail: `url handle is ${postUrlHandle(post.url) ?? "none"}, expected ${HANDLE}`,
  });
  checks.push({
    name: "quote_matches",
    pass: post.quote === QUOTE_URL,
    detail: `expected ${QUOTE_URL}`,
  });

  const valid = checks.every((c) => c.pass);
  const summary = {
    competition: COMPETITION,
    handle: HANDLE,
    play_code: PLAY_CODE,
    quote_url: QUOTE_URL,
    post_url: typeof post.url === "string" ? post.url : null,
    valid,
    checks,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "post-summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
    "utf8",
  );

  console.log(`competition: ${COMPETITION}`);
  console.log(`post_url: ${summary.post_url ?? "(pending)"}`);
  console.log(`valid: ${valid}`);
  for (const c of checks) {
    console.log(`- ${c.name}: ${c.pass ? "pass" : "fail"} (${c.detail})`);
  }
}

main();
