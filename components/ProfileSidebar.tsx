// Lewa kolumna profilu — stała przy obu zakładkach (Overview / Repositories).
import Avatar from "./Avatar";
import { auth } from "@/auth";
import {
  achievements,
  currentUser,
  formatPlDate,
  formatPlMonthYear,
} from "@/lib/mock-data";

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

export default async function ProfileSidebar() {
  // GitHub pokazuje wyłącznie zdobyte osiągnięcia — bez wyszarzonych „zablokowanych".
  const unlocked = achievements.filter((a) => a.unlocked);

  // Prawdziwe dane konta z sesji (avatar/nazwa/login) + profil z GitHub API.
  // Gdy brak sesji — fallback na mocki. Streak/ranking/osiągnięcia zostają mockowe.
  const session = await auth();
  const user = session?.user;
  const gh = user?.github;

  const name = user?.name ?? currentUser.name;
  const login = user?.login ?? currentUser.login;
  const image = user?.image ?? undefined;
  const profileUrl = user?.login
    ? `https://github.com/${user.login}`
    : currentUser.profileUrl;

  // Bio z GitHuba (może być puste → stan pusty); bez sesji pokazujemy mock.
  const bio = gh ? gh.bio : currentUser.bio;
  // Liczniki: realne z GitHuba albo mockowe. Realne formatujemy po polsku.
  const followers = gh
    ? gh.followers.toLocaleString("pl-PL")
    : currentUser.followers;
  const following = gh
    ? gh.following.toLocaleString("pl-PL")
    : currentUser.following;
  // Data dołączenia: do GitHuba (jeśli zalogowany) albo do DailyQuest (mock).
  const joinedLabel =
    gh?.createdAt && formatPlMonthYear(gh.createdAt)
      ? `Dołączył(a) ${formatPlMonthYear(gh.createdAt)}`
      : `Dołączył do DailyQuest ${formatPlDate(currentUser.joinedDate)}`;

  return (
    <aside className="w-full shrink-0 md:w-[296px]">
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <Avatar name={name} login={login} image={image} size={260} />

        <h1 className="mt-4 text-2xl font-bold leading-tight text-gh-text">
          {name}
        </h1>
        <a
          href={profileUrl}
          className="text-xl font-light text-gh-muted hover:text-gh-blue hover:underline"
        >
          {login}
        </a>

        {bio ? (
          <p className="mt-4 text-sm text-gh-text">{bio}</p>
        ) : (
          <p className="mt-4 text-sm italic text-gh-muted">Brak opisu.</p>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-gh-muted">
          <PeopleIcon />
          <span>
            <span className="font-semibold text-gh-text">{followers}</span>{" "}
            followers ·{" "}
            <span className="font-semibold text-gh-text">{following}</span>{" "}
            following
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-gh-muted">
          <CalendarIcon />
          <span>{joinedLabel}</span>
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
    </aside>
  );
}
