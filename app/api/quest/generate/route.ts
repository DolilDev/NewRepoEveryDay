// POST /api/quest/generate — serwerowy przepływ Etapu B:
// 1) wygeneruj quest (OpenAI), 2) utwórz publiczne repo, 3) wrzuć QUEST.md.
// Token GitHub i klucz OpenAI używane WYŁĄCZNIE tutaj — nie wracają do przeglądarki.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import {
  fetchUserRepos,
  buildProfileSummary,
  createRepo,
  putQuestFile,
} from "@/lib/github";
import { generateQuest, generateRepoName, buildQuestMarkdown } from "@/lib/openai";
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

  try {
    // 0) Twardy limit 1/dzień (wg CET). Baza jest źródłem prawdy: jeśli dzisiejszy
    // quest już istnieje, NIE wołamy OpenAI i NIE tworzymy repo — zwracamy istniejący.
    if (login) {
      const existing = await prisma.quest.findFirst({
        where: { user: { githubLogin: login }, date: cetDayStart() },
      });
      if (existing) {
        return NextResponse.json({
          alreadyGenerated: true,
          title: existing.title,
          repoName: existing.repoName,
          repoUrl: existing.repoUrl ?? "",
          questFileUrl: existing.questMdUrl ?? "",
          fileUploaded: Boolean(existing.questMdUrl),
        });
      }
    }

    // 1) Profil użytkownika → quest z OpenAI.
    const repos = await fetchUserRepos(accessToken);
    const summary = buildProfileSummary(repos);
    const quest = await generateQuest(summary);

    // 2) Utworzenie repo. Przy kolizji nazwy (422) prosimy model o inny slug.
    const taken: string[] = [];
    let repoName = quest.repoName;
    let created: Extract<Awaited<ReturnType<typeof createRepo>>, { ok: true }> | null =
      null;

    for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
      const result = await createRepo(accessToken, repoName, quest.title);
      if (result.ok) {
        created = result;
        break;
      }
      if (result.alreadyExists) {
        taken.push(repoName);
        repoName = await generateRepoName(quest.title, taken);
        continue;
      }
      // Inny błąd GitHuba (np. token bez uprawnień) — kończymy czytelnie.
      return NextResponse.json(
        {
          error: `Nie udało się utworzyć repozytorium (GitHub ${result.status}): ${result.message}`,
        },
        { status: 502 },
      );
    }

    if (!created) {
      return NextResponse.json(
        {
          error:
            "Nie udało się znaleźć wolnej nazwy repozytorium po kilku próbach. Spróbuj ponownie.",
        },
        { status: 409 },
      );
    }

    // 3) Wrzucenie QUEST.md do nowego repo.
    const owner = created.owner || login || "";
    const markdown = buildQuestMarkdown({ ...quest, repoName: created.name });
    const fileUploaded = await putQuestFile(
      accessToken,
      owner,
      created.name,
      markdown,
    );
    const questFileUrl = `${created.htmlUrl}/blob/${created.defaultBranch}/QUEST.md`;

    // 4) Zapis do bazy — DOPIERO TU, po udanym utworzeniu repo i QUEST.md.
    // Najpierw upewniamy się, że user istnieje, potem wiążemy z nim quest.
    const user = await upsertUser(authData);
    await prisma.quest.create({
      data: {
        userId: user.id,
        date: cetDayStart(), // kanoniczny dzień CET (klucz limitu 1/dzień)
        title: quest.title,
        repoName: created.name,
        why: quest.why,
        instructions: quest.instructions,
        openPart: quest.openPart,
        criteria: quest.criteria, // lista kryteriów jako JSON
        status: "PENDING",
        repoUrl: created.htmlUrl,
        questMdUrl: fileUploaded ? questFileUrl : null,
      },
    });

    // Do przeglądarki wracają WYŁĄCZNIE publiczne informacje o repo.
    return NextResponse.json({
      title: quest.title,
      repoName: created.name,
      repoUrl: created.htmlUrl,
      questFileUrl,
      fileUploaded,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Nieznany błąd serwera.";
    return NextResponse.json(
      { error: `Generowanie nie powiodło się: ${message}` },
      { status: 500 },
    );
  }
}
