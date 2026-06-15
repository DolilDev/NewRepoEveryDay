import ProfileSidebar, { type SidebarAchievement } from "@/components/ProfileSidebar";
import ProfileTabs from "@/components/ProfileTabs";
import { getProfile } from "@/lib/profile";
import { getUserQuestCount, getUserAchievements } from "@/lib/profile-data";
import { achievementMeta } from "@/lib/achievements";

// Shared profile skeleton for ANY login (your own or someone else's): a
// full-width tab bar below the navbar, then a sidebar (296px) + content.
// getProfile() is cached, so the layout and the page ask for the profile once.
export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { login: string };
}) {
  const urlLogin = decodeURIComponent(params.login);
  const profile = await getProfile(urlLogin);

  // The login doesn't exist on GitHub or with us → a clear message.
  if (!profile) {
    return (
      <div className="flex-1 bg-gh-panel">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="rounded-md border border-gh-border bg-gh-surface px-6 py-12 text-center">
            <h1 className="text-lg font-semibold text-gh-text">User not found</h1>
            <p className="mt-2 text-sm text-gh-muted">
              There is no GitHub user with the login{" "}
              <span className="font-mono text-gh-text">{urlLogin}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Counters/achievements only for registered users — someone outside NERD has nothing.
  const repoCount = profile.registered ? await getUserQuestCount(profile.login) : 0;
  const dbAchievements = profile.registered
    ? await getUserAchievements(profile.login)
    : [];
  const achievements: SidebarAchievement[] = dbAchievements.map((a) => ({
    id: a.id,
    unlockedDate: a.unlockedAt.toISOString().slice(0, 10),
    ...achievementMeta(a.type),
  }));

  return (
    <div className="flex-1 bg-gh-panel">
      {/* Second navigation bar — spans the full width of the page. */}
      <div className="border-b border-gh-border bg-gh-bg-deep">
        <div className="px-4">
          <ProfileTabs login={urlLogin} repoCount={repoCount} />
        </div>
      </div>

      {/* Profile content: a 296px sidebar + a flexible column. */}
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <ProfileSidebar profile={profile} achievements={achievements} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
