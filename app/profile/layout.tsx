import ProfileSidebar from "@/components/ProfileSidebar";
import ProfileTabs from "@/components/ProfileTabs";

// Wspólny szkielet profilu: pasek zakładek nad treścią + stały pasek boczny.
// Zmienia się tylko prawa kolumna ({children}) — Overview albo Repositories.
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ProfileTabs />
      <div className="mt-6 flex flex-col gap-8 md:flex-row">
        <ProfileSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
