// Quest status label (colors like on GitHub: green = passed).
// `className` lets you add utilities specific to the usage site (e.g. shrink-0).
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
        Passed
      </span>
    );
  }
  return (
    <span
      className={`rounded-full border border-gh-border px-2 text-xs font-medium text-gh-muted ${className}`}
    >
      Pending
    </span>
  );
}
