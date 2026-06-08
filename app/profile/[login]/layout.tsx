import ProfileSidebar, {
  type SidebarAchievement,
} from "@/components/ProfileSidebar";
import ProfileTabs from "@/components/ProfileTabs";
import { getProfile } from "@/lib/profile";
import { getUserQuestCount, getUserAchievements } from "@/lib/profile-data";
import { achievementMeta } from "@/lib/achievements";

// Wspólny szkielet profilu dla DOWOLNEGO loginu (własny lub cudzy): pełnej
// szerokości pasek z zakładkami pod navbarem, niżej sidebar (296px) + treść.
// getProfile() jest cache'owane, więc layout i strona pytają o profil raz.
export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { login: string };
}) {
  const urlLogin = decodeURIComponent(params.login);
  const profile = await getProfile(urlLogin);

  // Login nie istnieje ani na GitHubie, ani u nas → czytelny komunikat.
  if (!profile) {
    return (
      <div className="flex-1 bg-gh-panel">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="rounded-md border border-gh-border bg-gh-surface px-6 py-12 text-center">
            <h1 className="text-lg font-semibold text-gh-text">
              Nie znaleziono użytkownika
            </h1>
            <p className="mt-2 text-sm text-gh-muted">
              Nie ma użytkownika GitHub o loginie{" "}
              <span className="font-mono text-gh-text">{urlLogin}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Liczniki/osiągnięcia tylko dla zarejestrowanych — osoba spoza NERD ma pusto.
  const repoCount = profile.registered
    ? await getUserQuestCount(profile.login)
    : 0;
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
      {/* Drugi pasek nawigacji — ciągnie się przez całą szerokość strony. */}
      <div className="border-b border-gh-border bg-gh-bg-deep">
        <div className="px-4">
          <ProfileTabs login={urlLogin} repoCount={repoCount} />
        </div>
      </div>

      {/* Treść profilu: sidebar 296px + zmienna kolumna. */}
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <ProfileSidebar profile={profile} achievements={achievements} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
