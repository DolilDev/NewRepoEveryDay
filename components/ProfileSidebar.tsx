// Lewa kolumna profilu — stała przy obu zakładkach (Overview / Repositories).
import Avatar from "./Avatar";
import { achievements, currentUser, formatPlDate } from "@/lib/mock-data";

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.49 3.49 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z" />
    </svg>
  );
}

export default function ProfileSidebar() {
  // GitHub pokazuje wyłącznie zdobyte osiągnięcia — bez wyszarzonych „zablokowanych".
  const unlocked = achievements.filter((a) => a.unlocked);

  return (
    <aside className="w-full shrink-0 md:w-[296px]">
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <Avatar name={currentUser.name} login={currentUser.login} size={260} />

        <h1 className="mt-4 text-2xl font-bold leading-tight text-gh-text">
          {currentUser.name}
        </h1>
        <a
          href={currentUser.profileUrl}
          className="text-xl font-light text-gh-muted hover:text-gh-blue hover:underline"
        >
          {currentUser.login}
        </a>

        <p className="mt-4 text-sm text-gh-text">{currentUser.bio}</p>

        <div className="mt-4 flex items-center gap-2 text-sm text-gh-muted">
          <PeopleIcon />
          <span>
            <span className="font-semibold text-gh-text">
              {currentUser.followers}
            </span>{" "}
            followers ·{" "}
            <span className="font-semibold text-gh-text">
              {currentUser.following}
            </span>{" "}
            following
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-gh-muted">
          <CalendarIcon />
          <span>Dołączył {formatPlDate(currentUser.joinedDate)}</span>
        </div>
      </div>

      {/* Osiągnięcia — pokazujemy WYŁĄCZNIE zdobyte; brak → sekcja znika. */}
      {unlocked.length > 0 && (
        <section className="mt-6 w-full border-t border-gh-border pt-6">
          <h2 className="mb-4 text-sm font-semibold text-gh-text">
            Osiągnięcia
            <span className="ml-2 font-normal text-gh-muted">
              {unlocked.length}
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {unlocked.map((a) => (
              <span
                key={a.id}
                title={
                  a.unlockedDate
                    ? `${a.name} — odblokowano ${formatPlDate(a.unlockedDate)}`
                    : a.name
                }
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gh-border bg-gh-surface text-xl"
              >
                <span aria-hidden>{a.icon}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <a
        href="#"
        className="mt-6 inline-block text-xs text-gh-muted hover:text-gh-blue hover:underline"
      >
        Zgłoś użytkownika
      </a>
    </aside>
  );
}
