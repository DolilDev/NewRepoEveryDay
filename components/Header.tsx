"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
import { currentUser } from "@/lib/mock-data";

function FlameLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path d="M12 2C12 2 5 7.5 5 13.5C5 17.6421 8.13401 21 12 21C15.866 21 19 17.6421 19 13.5C19 11 17.5 9 17.5 9C17.5 11 16 12 16 12C16 9 13.5 5.5 12 2Z" fill="#2ea043" />
      <path d="M12 21C9.79086 21 8 19.2091 8 17C8 14.5 12 11 12 11C12 11 16 14.5 16 17C16 19.2091 14.2091 21 12 21Z" fill="#39d353" />
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

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const rankingActive = pathname.startsWith("/leaderboard");

  return (
    <header className="border-b border-gh-border bg-gh-bg-deep">
      {/* Pełna szerokość okna — bez wyśrodkowanego kontenera, by elementy
          dosięgały skrajnych rogów (padding boczny 16px). */}
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        {/* Lewa strona: logo + nazwa */}
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-gh-text">
          <FlameLogo />
          <span>DailyQuest</span>
        </Link>

        {/* Prawa strona: Ranking → dzwonek → avatar */}
        <div className="flex items-center gap-4">
          {/* Zakładka Ranking — ikona w obramowaniu, jak powiadomienia */}
          <Link
            href="/leaderboard"
            aria-current={rankingActive ? "page" : undefined}
            aria-label="Ranking"
            title="Ranking"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-gh-border transition-colors ${
              rankingActive
                ? "bg-gh-surface2 text-gh-text"
                : "text-gh-muted hover:bg-gh-surface2 hover:text-gh-text"
            }`}
          >
            <GraphIcon />
          </Link>

          {/* Powiadomienia (ozdobne, nieaktywne) */}
          <button
            type="button"
            disabled
            aria-label="Powiadomienia (wkrótce)"
            className="inline-flex h-8 w-8 cursor-default items-center justify-center rounded-md border border-gh-border text-gh-muted"
          >
            <BellIcon />
          </button>

          {/* Avatar → profil */}
          <Link
            href="/profile"
            className="flex items-center rounded-full transition hover:ring-2 hover:ring-gh-border"
            title={`${currentUser.name} (@${currentUser.login})`}
          >
            <Avatar name={currentUser.name} login={currentUser.login} size={32} />
          </Link>
        </div>
      </div>
    </header>
  );
}
