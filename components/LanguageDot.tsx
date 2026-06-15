import { languageColor } from "@/lib/language-colors";

// Colored repository language dot (like on GitHub) along with the language name.
// When the language could not be determined (null/missing) — we render NOTHING, per
// the requirement: no dot for an unknown language.
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
