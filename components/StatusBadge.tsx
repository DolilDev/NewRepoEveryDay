// Etykieta statusu questa po polsku (kolory jak w GitHubie: zielony = zaliczony).
// `className` pozwala dorzucić utility'sy specyficzne dla miejsca użycia (np. shrink-0).
export default function StatusBadge({
  status,
  className = "",
}: {
  status: "PENDING" | "PASSED" | "FAILED";
  className?: string;
}) {
  if (status === "PASSED") {
    return (
      <span
        className={`rounded-full border border-gh-green/40 bg-gh-green/10 px-2 text-xs font-semibold text-gh-green ${className}`}
      >
        Zaliczony
      </span>
    );
  }
  return (
    <span
      className={`rounded-full border border-gh-border px-2 text-xs font-medium text-gh-muted ${className}`}
    >
      W trakcie
    </span>
  );
}
