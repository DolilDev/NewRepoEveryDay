import LanguageDot from "@/components/LanguageDot";
import { getProfile } from "@/lib/profile";
import { getUserQuests } from "@/lib/profile-data";
import { getRepoLanguages } from "@/lib/repo-language";
import { relativeQuestDate } from "@/lib/date";

function RepoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gh-muted" aria-hidden>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
    </svg>
  );
}

const FILTERS = ["Type", "Language", "Sort"];

// Etykieta statusu questa po polsku.
function statusBadge(status: "PENDING" | "PASSED" | "FAILED") {
  if (status === "PASSED") {
    return (
      <span className="rounded-full border border-gh-green/40 bg-gh-green/10 px-2 py-0.5 text-xs font-semibold text-gh-green">
        Zaliczony
      </span>
    );
  }
  return (
    <span className="rounded-full border border-gh-border px-2 py-0.5 text-xs font-medium text-gh-muted">
      W trakcie
    </span>
  );
}

export default async function ProfileRepositoriesPage({
  params,
}: {
  params: { login: string };
}) {
  const profile = await getProfile(decodeURIComponent(params.login));
  // Brak profilu → layout pokazuje komunikat „nie znaleziono".
  if (!profile) return null;

  const [quests, langMap] = await Promise.all([
    getUserQuests(profile.login),
    getRepoLanguages(profile.login),
  ]);

  return (
    <div>
      {/* Pasek wyszukiwania i filtrów (na razie nieaktywny — wygląd jak GitHub) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gh-border pb-4">
        <input
          type="text"
          readOnly
          disabled
          placeholder="Find a repository..."
          aria-label="Znajdź repozytorium (wkrótce)"
          className="h-8 min-w-0 flex-1 cursor-default rounded-md border border-gh-border bg-gh-bg px-3 text-sm text-gh-text placeholder:text-gh-subtle focus:outline-none"
        />
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            disabled
            className="inline-flex h-8 cursor-default items-center gap-1.5 rounded-md border border-gh-border bg-gh-surface px-3 text-sm text-gh-text"
          >
            {f}
            <Chevron />
          </button>
        ))}
      </div>

      {/* Lista repozytoriów questowych (od najnowszego do najstarszego) */}
      {quests.length === 0 ? (
        <p className="py-10 text-center text-sm text-gh-muted">
          Brak repozytoriów.
        </p>
      ) : (
        <ul>
          {quests.map((repo) => (
            <li
              key={repo.id}
              className="flex items-start justify-between gap-4 border-b border-gh-border py-6"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <RepoIcon />
                  <a
                    href={repo.repoUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-gh-blue hover:underline"
                  >
                    {repo.repoName}
                  </a>
                  <span className="rounded-full border border-gh-border px-2 py-0.5 text-xs font-medium text-gh-muted">
                    Public
                  </span>
                  {statusBadge(repo.status)}
                </div>
                <p className="mt-2 text-sm text-gh-muted">{repo.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gh-muted">
                  <LanguageDot language={langMap.get(repo.repoName) ?? null} />
                  <span>Utworzono {relativeQuestDate(repo.date)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
