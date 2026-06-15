// Left profile column — fixed across both tabs (Overview / Repositories).
// Purely presentational: it receives data (profile + achievements) from the profile layout,
// so the same component works for your own profile and SOMEONE ELSE'S.
import Avatar from "./Avatar";
import { formatDate, formatMonthYear } from "@/lib/date";
import type { ProfileData } from "@/lib/profile";

// Achievement ready to display (mapped from the database in the profile layout).
export type SidebarAchievement = {
  id: string;
  unlockedDate: string; // YYYY-MM-DD
  name: string;
  icon: string;
};

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

export default function ProfileSidebar({
  profile,
  achievements,
}: {
  profile: ProfileData;
  achievements: SidebarAchievement[];
}) {
  const { login, name } = profile;
  const image = profile.avatarUrl ?? undefined;
  const profileUrl = `https://github.com/${login}`;

  // Bio from GitHub (may be empty → we don't render the element).
  const bio = profile.bio;
  // Community counters — only when we have real data from GitHub.
  const followers =
    profile.followers != null ? profile.followers.toLocaleString("en-US") : null;
  const following =
    profile.following != null ? profile.following.toLocaleString("en-US") : null;

  // Date of joining NERD (our database). An unregistered person (exists on
  // GitHub, but doesn't play with us) → a clear "Not joined" instead of a date.
  const joinedIso = profile.joinedAt?.toISOString() ?? null;
  const joinedLabel =
    profile.registered && joinedIso && formatMonthYear(joinedIso)
      ? `Joined ${formatMonthYear(joinedIso)}`
      : "Not joined";

  return (
    <aside className="w-full shrink-0 md:w-[296px]">
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <Avatar name={name} login={login} image={image} size={260} />

        <h1 className="mt-4 text-2xl font-bold leading-tight text-gh-text">{name}</h1>
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xl font-light text-gh-muted hover:text-gh-blue hover:underline"
        >
          {login}
        </a>

        {/* We render the bio only when it actually exists — no description = no element. */}
        {bio && <p className="mt-4 text-sm text-gh-text">{bio}</p>}

        {/* Community counters only when we have real data from GitHub. */}
        {followers && following && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gh-muted">
            <PeopleIcon />
            <span>
              <span className="font-semibold text-gh-text">{followers}</span> followers ·{" "}
              <span className="font-semibold text-gh-text">{following}</span> following
            </span>
          </div>
        )}

        {/* Date of joining NERD or "Not joined" for unregistered users. */}
        <div className="mt-2 flex items-center gap-2 text-sm text-gh-muted">
          <CalendarIcon />
          <span>{joinedLabel}</span>
        </div>
      </div>

      {/* Achievements — we show ONLY earned ones; none → the section disappears. */}
      {achievements.length > 0 && (
        <section className="mt-6 w-full border-t border-gh-border pt-6">
          <h2 className="mb-4 text-sm font-semibold text-gh-text">
            Achievements
            <span className="ml-2 font-normal text-gh-muted">{achievements.length}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <span
                key={a.id}
                title={
                  a.unlockedDate
                    ? `${a.name} — unlocked ${formatDate(a.unlockedDate)}`
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
