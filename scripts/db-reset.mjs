// Jednorazowy skrypt czyszczący DANE testowe (NIE schemat/migracje).
// Uruchom świadomie: `npm run db:reset`. NIEODWRACALNE — kasuje streak/questy/osiągnięcia.
//
// Co robi:
//  1) Usuwa wiersze z tabel: completions, achievements, stats, quests (w kolejności
//     bezpiecznej dla kluczy obcych). Tabelę users ZOSTAWIA — przy następnym
//     logowaniu user i tak się odtworzy (upsert), a zostawienie zachowuje datę
//     dołączenia. Aby wyczyścić też users, uruchom z flagą `--users`.
//  2) (Opcjonalnie, część 5) Usuwa repo-kontener NERD-NewEveryDayRepo na koncie
//     właściciela — TYLKO gdy w środowisku jest GITHUB_RESET_TOKEN (PAT ze scope
//     `delete_repo`; zwykły token OAuth aplikacji tego nie ma). Bez tokenu krok
//     jest pomijany z komunikatem. Stare repo daily-quest-* NIE są ruszane.
//
// Sekrety czytane są z .env.local / .env (jak reszta aplikacji) — nic nie jest
// zapisane w kodzie ani commitowane.

import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const CONTAINER_REPO = "NERD-NewEveryDayRepo";

// Minimalny loader zmiennych środowiskowych z plików .env* (bez zależności).
// Dzieli linię na pierwszym znaku '=', by nie psuć connection stringów z '=' w query.
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
    // Zdejmij ewentualne otaczające cudzysłowy.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// .env.local ma pierwszeństwo (jak w Next.js), .env jako uzupełnienie.
loadEnvFile(".env.local");
loadEnvFile(".env");

// Część 5: best-effort usunięcie repo-kontenera. Wymaga PAT z scope delete_repo.
async function deleteContainerRepo() {
  const token = process.env.GITHUB_RESET_TOKEN;
  const owner = process.env.GITHUB_RESET_OWNER; // login właściciela kontenera
  if (!token || !owner) {
    console.log(
      "• Pomijam usuwanie repo-kontenera: brak GITHUB_RESET_TOKEN/GITHUB_RESET_OWNER " +
        "(token OAuth aplikacji nie ma scope delete_repo). Jeśli kontener istnieje, " +
        "usuń go ręcznie lub ustaw PAT i ponów.",
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
    console.log(`• Repo-kontener ${owner}/${CONTAINER_REPO} nie istnieje — nic do usunięcia.`);
    return;
  }
  const del = await fetch(base, { method: "DELETE", headers });
  if (del.ok) {
    console.log(`• Usunięto repo-kontener ${owner}/${CONTAINER_REPO}.`);
  } else {
    console.log(
      `• Nie udało się usunąć repo-kontenera (GitHub ${del.status}). ` +
        "Upewnij się, że PAT ma scope delete_repo.",
    );
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Brak DATABASE_URL w środowisku (.env.local). Przerywam.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    // Kolejność bezpieczna dla kluczy obcych: completions → achievements → stats → quests.
    const completions = await prisma.completion.deleteMany();
    const achievements = await prisma.achievement.deleteMany();
    const stats = await prisma.stats.deleteMany();
    const quests = await prisma.quest.deleteMany();
    console.log("Wyczyszczono dane:");
    console.log(`• completions:  ${completions.count}`);
    console.log(`• achievements: ${achievements.count}`);
    console.log(`• stats:        ${stats.count}`);
    console.log(`• quests:       ${quests.count}`);

    if (process.argv.includes("--users")) {
      const users = await prisma.user.deleteMany();
      console.log(`• users:        ${users.count} (usunięte na żądanie --users)`);
    } else {
      console.log("• users:        zostawione (odtworzą się przy logowaniu)");
    }
  } finally {
    await prisma.$disconnect();
  }

  await deleteContainerRepo();
  console.log("Gotowe — baza wyczyszczona, schemat nietknięty.");
}

main().catch((e) => {
  console.error("Czyszczenie nie powiodło się:", e);
  process.exit(1);
});
