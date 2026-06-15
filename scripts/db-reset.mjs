// One-off script that clears test DATA (NOT the schema/migrations).
// Run deliberately: `npm run db:reset`. IRREVERSIBLE — wipes streaks/quests/achievements.
//
// What it does:
//  1) Deletes rows from the tables: completions, achievements, stats, quests (in an order
//     safe for foreign keys). It LEAVES the users table — on the next
//     login the user is recreated anyway (upsert), and keeping it preserves the
//     join date. To clear users as well, run with the `--users` flag.
//  2) (Optional, part 5) Deletes the NERD-NewEveryDayRepo repo-container on the
//     owner's account — ONLY when GITHUB_RESET_TOKEN is present in the environment (a PAT with the
//     `delete_repo` scope; a regular app OAuth token does not have it). Without the token the step
//     is skipped with a message. The old daily-quest-* repos are NOT touched.
//
// Secrets are read from .env.local / .env (like the rest of the application) — nothing is
// stored in the code or committed.

import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const CONTAINER_REPO = "NERD-NewEveryDayRepo";

// Minimal environment variables loader from .env* files (no dependencies).
// Splits the line on the first '=' character so it doesn't break connection strings with '=' in the query.
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf-8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip any surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// .env.local takes precedence (as in Next.js), .env as a fallback.
loadEnvFile(".env.local");
loadEnvFile(".env");

// Part 5: best-effort deletion of the repo-container. Requires a PAT with the delete_repo scope.
async function deleteContainerRepo() {
  const token = process.env.GITHUB_RESET_TOKEN;
  const owner = process.env.GITHUB_RESET_OWNER; // login of the container owner
  if (!token || !owner) {
    console.log(
      "• Skipping repo-container deletion: missing GITHUB_RESET_TOKEN/GITHUB_RESET_OWNER " +
        "(the app OAuth token does not have the delete_repo scope). If the container exists, " +
        "delete it manually or set a PAT and retry.",
    );
    return;
  }
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "NERD-NewEveryRepoDay",
    Authorization: `Bearer ${token}`,
  };
  const base = `https://api.github.com/repos/${owner}/${CONTAINER_REPO}`;
  const head = await fetch(base, { headers });
  if (head.status === 404) {
    console.log(
      `• Repo-container ${owner}/${CONTAINER_REPO} does not exist — nothing to delete.`,
    );
    return;
  }
  const del = await fetch(base, { method: "DELETE", headers });
  if (del.ok) {
    console.log(`• Deleted repo-container ${owner}/${CONTAINER_REPO}.`);
  } else {
    console.log(
      `• Failed to delete the repo-container (GitHub ${del.status}). ` +
        "Make sure the PAT has the delete_repo scope.",
    );
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL in the environment (.env.local). Aborting.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    // Order safe for foreign keys: completions → achievements → stats → quests.
    const completions = await prisma.completion.deleteMany();
    const achievements = await prisma.achievement.deleteMany();
    const stats = await prisma.stats.deleteMany();
    const quests = await prisma.quest.deleteMany();
    console.log("Cleared data:");
    console.log(`• completions:  ${completions.count}`);
    console.log(`• achievements: ${achievements.count}`);
    console.log(`• stats:        ${stats.count}`);
    console.log(`• quests:       ${quests.count}`);

    if (process.argv.includes("--users")) {
      const users = await prisma.user.deleteMany();
      console.log(`• users:        ${users.count} (deleted on --users request)`);
    } else {
      console.log("• users:        kept (recreated on login)");
    }
  } finally {
    await prisma.$disconnect();
  }

  await deleteContainerRepo();
  console.log("Done — database cleared, schema untouched.");
}

main().catch((e) => {
  console.error("Cleanup failed:", e);
  process.exit(1);
});
