import { redirect } from "next/navigation";
import { getViewerLogin } from "@/lib/profile-data";

// „Twój profil" (/profile) to skrót: przekierowuje na /profile/[twój-login],
// czyli tę samą trasę, której używamy do oglądania cudzych profili. Niezalogowany
// → na stronę główną (tam jest logowanie przez GitHub).
export default async function ProfileRedirect() {
  const login = await getViewerLogin();
  if (!login) redirect("/");
  redirect(`/profile/${login}`);
}
