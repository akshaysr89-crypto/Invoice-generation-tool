import { ReplitConnectors } from "@replit/connectors-sdk";
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

const OWNER = "akshaysr89-crypto";
const REPO  = "Invoice-generation-tool";
const ROOT  = "/home/runner/workspace";

const connectors = new ReplitConnectors();

async function ghRaw(path, options = {}) {
  const res = await connectors.proxy("github", path, options);
  return res;
}
async function ghJson(path, options = {}) {
  const res = await ghRaw(path, options);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub ${res.status} @ ${path}: ${t}`);
  }
  return res.json();
}

// Create blobs in batches of 5 to stay under 10 RPS proxy limit
async function createBlobs(relPaths) {
  const BATCH = 5;
  const items = [];
  for (let i = 0; i < relPaths.length; i += BATCH) {
    const batch = relPaths.slice(i, i + BATCH);
    const blobs = await Promise.all(
      batch.map(async (rel) => {
        const abs = `${ROOT}/${rel}`;
        if (!existsSync(abs)) return null;
        const content = readFileSync(abs).toString("base64");
        const blob = await ghJson(`/repos/${OWNER}/${REPO}/git/blobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, encoding: "base64" }),
        });
        return { path: rel, mode: "100644", type: "blob", sha: blob.sha };
      })
    );
    items.push(...blobs.filter(Boolean));
    process.stdout.write(
      `   blobs ${i + 1}–${Math.min(i + BATCH, relPaths.length)} / ${relPaths.length}\r`
    );
    if (i + BATCH < relPaths.length) await new Promise((r) => setTimeout(r, 900));
  }
  process.stdout.write(`   ✓ ${items.length} blobs created                        \n`);
  return items;
}

async function makeTree(treeItems, baseTreeSha) {
  const body = { tree: treeItems };
  if (baseTreeSha) body.base_tree = baseTreeSha;
  return ghJson(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function makeCommit(message, treeSha, parentSha) {
  const body = { message, tree: treeSha };
  if (parentSha) body.parents = [parentSha];
  return ghJson(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function listDir(...subPaths) {
  const dirs = subPaths.map((p) => `${ROOT}/${p}`).join(" ");
  try {
    return execSync(
      `find ${dirs} -type f \
        ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" \
        ! -name "*.tsbuildinfo" ! -name "*.map" ! -name "pnpm-lock.yaml" \
        ! -path "*/.replit-artifact/*"`,
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((f) => f.replace(`${ROOT}/`, ""));
  } catch {
    return [];
  }
}

// ─── Stage file groups ───────────────────────────────────────────────────────

// Stage 1 – project scaffolding & root configs
const stage1 = [
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "tsconfig.json",
  ".gitignore",
  "replit.md",
  ...listDir("scripts"),
].filter((f) => existsSync(`${ROOT}/${f}`));

// Stage 2 – invoice form UI (full frontend EXCEPT admin page)
const stage2 = [
  ...listDir("artifacts/invoice-tool").filter(
    (f) => !f.endsWith("/pages/admin.tsx")
  ),
  ...listDir("lib/api-client-react"), // generated hooks consumed by the form
  ...listDir("lib/api-zod"),           // zod schemas used for form validation
];

// Stage 3 – Express server & routes (api-server minus risk-scoring file)
const stage3 = [
  ...listDir("artifacts/api-server").filter(
    (f) => !f.endsWith("/lib/riskScoring.ts")
  ),
  ...listDir("lib/api-spec"),
];

// Stage 4 – AI / risk scoring logic
const stage4 = ["artifacts/api-server/src/lib/riskScoring.ts"].filter((f) =>
  existsSync(`${ROOT}/${f}`)
);

// Stage 5 – database layer
const stage5 = listDir("lib/db");

// Stage 6 – admin dashboard
const stage6 = ["artifacts/invoice-tool/src/pages/admin.tsx"].filter((f) =>
  existsSync(`${ROOT}/${f}`)
);

console.log("=== 6-Stage GitHub commit plan ===");
console.log(`  Stage 1 (Setup):      ${stage1.length} files`);
console.log(`  Stage 2 (Frontend):   ${stage2.length} files`);
console.log(`  Stage 3 (Backend):    ${stage3.length} files`);
console.log(`  Stage 4 (Risk):       ${stage4.length} files`);
console.log(`  Stage 5 (Database):   ${stage5.length} files`);
console.log(`  Stage 6 (Dashboard):  ${stage6.length} files`);
console.log();

// ─── Build commits ───────────────────────────────────────────────────────────

let prevTreeSha  = null;
let prevCommitSha = null;

async function runStage(label, files) {
  console.log(`\n─── ${label} ───`);
  const blobs = await createBlobs(files);
  const tree  = await makeTree(blobs, prevTreeSha);
  const commit = await makeCommit(label, tree.sha, prevCommitSha);
  console.log(`   tree:   ${tree.sha}`);
  console.log(`   commit: ${commit.sha}`);
  prevTreeSha   = tree.sha;
  prevCommitSha = commit.sha;
  return commit.sha;
}

await runStage("Stage 1: Project Setup & Git Initialization",          stage1);
await runStage("Stage 2: Frontend UI - Invoice Submission Form",       stage2);
await runStage("Stage 3: Backend API - Express Server & Routes",       stage3);
await runStage("Stage 4: AI Integration & Risk Scoring Logic Layer",   stage4);
await runStage("Stage 5: Database Integration - SQLite Storage",       stage5);
const finalSha = await runStage("Stage 6: Admin Dashboard - Monitoring & Analytics", stage6);

// ─── Force-push main ─────────────────────────────────────────────────────────
console.log("\n─── Force-pushing main branch ───");
const refCheck = await ghRaw(`/repos/${OWNER}/${REPO}/git/ref/heads/main`);
if (refCheck.ok) {
  await ghJson(`/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: finalSha, force: true }),
  });
  console.log("   Updated existing main branch.");
} else {
  await ghJson(`/repos/${OWNER}/${REPO}/git/refs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "refs/heads/main", sha: finalSha }),
  });
  console.log("   Created main branch.");
}

console.log(`\n✅  Done — https://github.com/${OWNER}/${REPO}`);
console.log("   Commit history (newest → oldest):");
console.log("   Stage 6: Admin Dashboard - Monitoring & Analytics");
console.log("   Stage 5: Database Integration - SQLite Storage");
console.log("   Stage 4: AI Integration & Risk Scoring Logic Layer");
console.log("   Stage 3: Backend API - Express Server & Routes");
console.log("   Stage 2: Frontend UI - Invoice Submission Form");
console.log("   Stage 1: Project Setup & Git Initialization");
