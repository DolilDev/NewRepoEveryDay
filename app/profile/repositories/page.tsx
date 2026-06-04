import { questRepos } from "@/lib/mock-data";

function RepoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gh-muted" aria-hidden>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
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

export default function ProfileRepositoriesPage() {
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

      {/* Lista repozytoriów (od najnowszego do najstarszego) */}
      <ul>
        {questRepos.map((repo) => (
          <li
            key={repo.name}
            className="flex items-start justify-between gap-4 border-b border-gh-border py-5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <RepoIcon />
                <a
                  href="#"
                  className="text-lg font-semibold text-gh-blue hover:underline"
                >
                  {repo.name}
                </a>
                <span className="rounded-full border border-gh-border px-2 py-0.5 text-xs font-medium text-gh-muted">
                  Public
                </span>
              </div>
              <p className="mt-1.5 text-sm text-gh-muted">{repo.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gh-muted">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: repo.languageColor }}
                    aria-hidden
                  />
                  {repo.language}
                </span>
                <span className="flex items-center gap-1">
                  <StarIcon />
                  {repo.stars}
                </span>
                <span>Zaktualizowano {repo.updatedRelative}</span>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-md border border-gh-border bg-gh-surface px-3 py-1 text-xs font-medium text-gh-text"
            >
              <StarIcon />
              Star
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
