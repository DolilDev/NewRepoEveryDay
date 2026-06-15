import { redirect } from "next/navigation";
import { getViewerLogin } from "@/lib/profile-data";

// "Your profile" (/profile) is a shortcut: it redirects to /profile/[your-login],
// i.e. the same route we use to view other people's profiles. Not signed in
// → to the home page (sign-in with GitHub is there).
export default async function ProfileRedirect() {
  const login = await getViewerLogin();
  if (!login) redirect("/");
  redirect(`/profile/${login}`);
}
