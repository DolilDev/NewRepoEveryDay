"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
import { currentUser } from "@/lib/mock-data";

function FlameLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 2C12 2 5 7.5 5 13.5C5 17.6421 8.13401 21 12 21C15.866 21 19 17.6421 19 13.5C19 11 17.5 9 17.5 9C17.5 11 16 12 16 12C16 9 13.5 5.5 12 2Z"
        fill="#2ea043"
      />
      <path
        d="M12 21C9.79086 21 8 19.2091 8 17C8 14.5 12 11 12 11C12 11 16 14.5 16 17C16 19.2091 14.2091 21 12 21Z"
        fill="#39d353"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const rankingActive = pathname.startsWith("/leaderboard");

  return (
    <header className="border-b border-gh-border bg-gh-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Lewa strona: logo + nazwa */}
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold text-gh-text"
        >
          <FlameLogo />
          <span>DailyQuest</span>
        </Link>

        {/* Prawa strona: wyszukiwarka → Ranking → avatar */}
        <div className="flex items-center gap-3">
          {/* Wyszukiwarka (na razie nieaktywna) */}
          <div className="relative hidden md:block">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gh-muted">
              <SearchIcon />
            </span>
            <input
              type="text"
              readOnly
              disabled
              placeholder="Type / to search"
              aria-label="Szukaj (wkrótce)"
              className="w-56 cursor-default rounded-md border border-gh-border bg-gh-bg py-1.5 pl-8 pr-8 text-sm text-gh-text placeholder:text-gh-subtle focus:outline-none"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-gh-border px-1.5 text-xs text-gh-subtle">
              /
            </span>
          </div>

          {/* Zakładka Ranking — element nawigacji w stylu navbara GitHuba */}
          <Link
            href="/leaderboard"
            aria-current={rankingActive ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              rankingActive
                ? "bg-gh-surface2 font-semibold text-gh-text"
                : "text-gh-muted hover:bg-gh-surface2 hover:text-gh-text"
            }`}
          >
            <GraphIcon />
            <span>Ranking</span>
          </Link>

          {/* Avatar → profil */}
          <Link
            href="/profile"
            className="flex items-center rounded-full ring-gh-border transition hover:ring-2"
            title={`${currentUser.name} (@${currentUser.login})`}
          >
            <Avatar name={currentUser.name} login={currentUser.login} size={32} />
          </Link>
        </div>
      </div>
    </header>
  );
}
