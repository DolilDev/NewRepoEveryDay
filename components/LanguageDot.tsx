import { languageColor } from "@/lib/language-colors";

// Kolorowa kropka języka repozytorium (jak na GitHubie) wraz z nazwą języka.
// Gdy języka nie udało się ustalić (null/brak) — nie renderujemy NIC, zgodnie z
// wymaganiem: brak kropki przy nieznanym języku.
export default function LanguageDot({
  language,
  className,
}: {
  language: string | null | undefined;
  className?: string;
}) {
  if (!language) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <span
        aria-hidden
        className="h-[10px] w-[10px] shrink-0 rounded-full"
        style={{ backgroundColor: languageColor(language) }}
      />
      <span>{language}</span>
    </span>
  );
}
