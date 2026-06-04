import QuestCalendar from "@/components/QuestCalendar";
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

export default function ProfileOverviewPage() {
  const recent = questRepos.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* 6 ostatnich repozytoriów stworzonych dzięki tej stronie */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gh-text">
          6 ostatnich repozytoriów stworzonych dzięki tej stronie
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {recent.map((repo) => (
            <div
              key={repo.name}
              className="rounded-md border border-gh-border bg-gh-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <a
                  href="#"
                  className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-gh-blue hover:underline"
                >
                  <RepoIcon />
                  <span className="truncate">{repo.name}</span>
                </a>
                <span className="shrink-0 rounded-full border border-gh-border px-2 py-0.5 text-[10px] font-medium text-gh-muted">
                  Public
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-gh-muted">
                {repo.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-gh-muted">
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
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kalendarz ukończonych questów (binarny, jeden odcień zieleni) */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gh-text">
          Kalendarz ukończonych questów
        </h2>
        <div className="rounded-lg border border-gh-border bg-gh-surface p-5">
          <QuestCalendar />
        </div>
      </section>
    </div>
  );
}
