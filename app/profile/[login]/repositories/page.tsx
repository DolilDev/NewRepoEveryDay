import LanguageDot from "@/components/LanguageDot";
import { getProfile } from "@/lib/profile";
import { getUserQuests } from "@/lib/profile-data";
import { getFolderLanguages } from "@/lib/repo-language";
import { relativeQuestDate } from "@/lib/date";
import RepoIcon from "@/components/RepoIcon";
import StatusBadge from "@/components/StatusBadge";

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
    </svg>
  );
}

const FILTERS = ["Type", "Language", "Sort"];

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
    getFolderLanguages(profile.login),
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
                    href={repo.folderUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-gh-blue hover:underline"
                  >
                    {repo.folderName ?? "(bez folderu)"}
                  </a>
                  <span className="rounded-full border border-gh-border px-2 py-0.5 text-xs font-medium text-gh-muted">
                    Public
                  </span>
                  <StatusBadge status={repo.status} className="py-0.5" />
                </div>
                <p className="mt-2 text-sm text-gh-muted">{repo.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gh-muted">
                  <LanguageDot
                    language={repo.folderName ? langMap.get(repo.folderName) ?? null : null}
                  />
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
