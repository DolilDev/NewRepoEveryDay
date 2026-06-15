// Player avatar: if we get a real image from GitHub (avatar_url) —
// we render <img>. Otherwise fallback: a purple circle with initials.

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
  image,
  size = 40,
}: {
  name: string;
  login: string;
  image?: string | null;
  size?: number;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="inline-block shrink-0 select-none rounded-full border border-gh-border object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--color-purple)",
        fontSize: Math.round(size * 0.4),
      }}
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full border border-gh-border font-semibold text-white"
    >
      {initials(name)}
    </span>
  );
}
