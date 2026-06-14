// POST /api/quest/generate — serwerowy przepływ generowania questa w modelu
// REPO-KONTENERA: 1) wygeneruj quest (OpenAI), 2) upewnij się, że istnieje repo
// NERD-NewEveryDayRepo (jedno na usera), 3) utwórz PODFOLDER questa z QUEST.md.
// Token GitHub i klucz OpenAI używane WYŁĄCZNIE tutaj — nie wracają do przeglądarki.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import { fetchUserRepos, buildProfileSummary, pathExists, putFile } from "@/lib/github";
import { generateQuest, generateFolderName, buildQuestMarkdown } from "@/lib/openai";
import {
  ensureContainer,
  folderUrlFor,
  questMdUrlFor,
  regenerateContainerReadme,
  CONTAINER_REPO,
} from "@/lib/container";
import { prisma } from "@/lib/prisma";
import { upsertUser } from "@/lib/user";
import { cetDayStart } from "@/lib/date";

export const runtime = "nodejs";

const MAX_NAME_ATTEMPTS = 4;

export async function POST(req: Request) {
  const authData = await getServerAuth(req);
  if (!authData) {
    return NextResponse.json(
      { error: "Nie jesteś zalogowany. Zaloguj się przez GitHub." },
      { status: 401 },
    );
  }
  const { accessToken, login } = authData;
  if (!login) {
    return NextResponse.json(
      { error: "Brak loginu GitHub w sesji. Zaloguj się ponownie." },
      { status: 401 },
    );
  }

  try {
    // 0) Twardy limit 1/dzień (wg CET). Baza jest źródłem prawdy: jeśli dzisiejszy
    // quest już istnieje, NIE wołamy OpenAI i NIE ruszamy GitHuba — zwracamy istniejący.
    const existing = await prisma.quest.findFirst({
      where: { user: { githubLogin: login }, date: cetDayStart() },
    });
    if (existing) {
      return NextResponse.json({
        alreadyGenerated: true,
        title: existing.title,
        folderName: existing.folderName,
        folderUrl: existing.folderUrl ?? "",
        questFileUrl: existing.questMdUrl ?? "",
        fileUploaded: Boolean(existing.questMdUrl),
      });
    }

    // 1) Profil użytkownika → quest z OpenAI.
    const repos = await fetchUserRepos(accessToken);
    const summary = buildProfileSummary(repos);
    const quest = await generateQuest(summary);

    // 2) Repo-kontener: utwórz raz (publiczne, z README) albo użyj istniejącego.
    const container = await ensureContainer(accessToken, login);

    // 3) Wolna nazwa folderu. Kolizja (folder już jest) → prosimy model o inny slug.
    const taken: string[] = [];
    let folderName = quest.folderName;
    let resolved = false;
    for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
      const exists = await pathExists(
        accessToken,
        container.owner,
        CONTAINER_REPO,
        folderName,
        container.defaultBranch,
      );
      if (!exists) {
        resolved = true;
        break;
      }
      taken.push(folderName);
      folderName = await generateFolderName(quest.title, taken);
    }
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            "Nie udało się znaleźć wolnej nazwy folderu po kilku próbach. Spróbuj ponownie.",
        },
        { status: 409 },
      );
    }

    // 4) Utworzenie folderu questa = wrzucenie QUEST.md pod {folderName}/QUEST.md.
    const markdown = buildQuestMarkdown(quest);
    const fileUploaded = await putFile(
      accessToken,
      container.owner,
      CONTAINER_REPO,
      `${folderName}/QUEST.md`,
      "Dodaj QUEST.md — instrukcja dzisiejszego questa",
      markdown,
    );
    const folderUrl = folderUrlFor(
      container.htmlUrl,
      container.defaultBranch,
      folderName,
    );
    const questFileUrl = questMdUrlFor(
      container.htmlUrl,
      container.defaultBranch,
      folderName,
    );

    // 5) Zapis do bazy — DOPIERO TU, po udanym utworzeniu folderu i QUEST.md.
    // Najpierw upewniamy się, że user istnieje, potem wiążemy z nim quest.
    const user = await upsertUser(authData);
    await prisma.quest.create({
      data: {
        userId: user.id,
        date: cetDayStart(), // kanoniczny dzień CET (klucz limitu 1/dzień)
        title: quest.title,
        folderName,
        why: quest.why,
        instructions: quest.instructions,
        openPart: quest.openPart,
        criteria: quest.criteria, // lista kryteriów jako JSON
        status: "PENDING",
        folderUrl,
        questMdUrl: fileUploaded ? questFileUrl : null,
      },
    });

    // Część 6: przegeneruj spis questów w README kontenera (best-effort —
    // nie wywraca generowania, jeśli się nie uda).
    await regenerateContainerReadme(accessToken, login);

    // Do przeglądarki wracają WYŁĄCZNIE publiczne informacje o folderze questa.
    return NextResponse.json({
      title: quest.title,
      folderName,
      folderUrl,
      questFileUrl,
      fileUploaded,
    });
  } catch (e) {
    // Pełny błąd tylko do logów serwera — klientowi ogólny komunikat.
    console.error("[quest/generate] Generowanie nie powiodło się:", e);
    return NextResponse.json(
      { error: "Generowanie nie powiodło się. Spróbuj ponownie za chwilę." },
      { status: 500 },
    );
  }
}
