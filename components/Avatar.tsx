// Placeholder avatar: kolorowe kółko z inicjałami (deterministyczny kolor z loginu).
// W kolejnym etapie podmienimy na <img src={avatarUrl}> z GitHuba.

const AVATAR_COLORS = [
  "#1f6feb", "#238636", "#a371f7", "#db61a2", "#f0883e",
  "#e3b341", "#3fb950", "#ff7b72", "#56d4dd", "#bc8cff",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

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
  login,
  size = 40,
}: {
  name: string;
  login: string;
  size?: number;
}) {
  const color = AVATAR_COLORS[hash(login) % AVATAR_COLORS.length];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: Math.round(size * 0.4),
      }}
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ring-1 ring-black/20"
    >
      {initials(name)}
    </span>
  );
}
