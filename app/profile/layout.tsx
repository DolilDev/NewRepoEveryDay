import ProfileSidebar from "@/components/ProfileSidebar";
import ProfileTabs from "@/components/ProfileTabs";

// Wspólny szkielet profilu: pełnej szerokości „drugi pasek" (48px) z zakładkami
// tuż pod navbarem, a niżej kontener 1280px ze stałym sidebarem (296px) + treść.
// Zmienia się tylko prawa kolumna ({children}) — Overview albo Repositories.
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-gh-panel">
      {/* Drugi pasek nawigacji — ciągnie się przez całą szerokość strony.
          Padding px-4 jak w navbarze, by zakładki zaczynały się pod logiem. */}
      <div className="border-b border-gh-border">
        <div className="px-4">
          <ProfileTabs />
        </div>
      </div>

      {/* Treść profilu: sidebar 296px + zmienna kolumna. */}
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <ProfileSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
