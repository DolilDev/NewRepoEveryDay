// Placeholder avatara: fioletowe kółko z inicjałami (Primer: --color-purple).
// W kolejnym etapie podmienimy na <img src={avatarUrl}> z GitHuba.

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Avatar({
  name,
  size = 40,
}: {
  name: string;
  login: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--color-purple)",
        fontSize: Math.round(size * 0.4),
      }}
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white"
    >
      {initials(name)}
    </span>
  );
}
