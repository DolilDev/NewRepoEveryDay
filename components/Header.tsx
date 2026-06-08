"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Avatar from "./Avatar";

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

function GitHubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="shrink-0">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const rankingActive = pathname.startsWith("/leaderboard");
  // Tylko strona główna ma wyższy navbar (64px); pozostałe strony 52px.
  const isHome = pathname === "/";

  const { data: session, status } = useSession();
  const user = session?.user;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Zamykanie menu avatara po kliknięciu poza nim lub klawiszem Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header
      className={`bg-gh-bg-deep ${isHome ? "border-b border-gh-border" : ""}`}
    >
      {/* Pełna szerokość okna — bez wyśrodkowanego kontenera, by elementy
          dosięgały skrajnych rogów (padding boczny 16px). */}
      <div
        className={`relative top-[4px] flex items-center justify-between gap-4 px-4 ${
          isHome ? "h-16" : "h-[52px]"
        }`}
      >
        {/* Lewa strona: logo + nazwa */}
        <Link
          href="/"
          title="NERD - NewEveryRepoDay"
          className="flex items-center gap-2 text-base font-semibold text-gh-text"
        >
          <FlameLogo />
          {/* Pełna nazwa od sm w górę; na wąskich ekranach skrót NERD, by się zmieścił. */}
          <span className="hidden sm:inline">NERD - NewEveryRepoDay</span>
          <span className="sm:hidden">NERD</span>
        </Link>

        {/* Prawa strona: Ranking → dzwonek → avatar / logowanie */}
        <div className="flex items-center gap-2">
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

          {/* Stan sesji: ładowanie → placeholder, zalogowany → avatar z menu,
              niezalogowany → przycisk logowania GitHub. */}
          {status === "loading" ? (
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gh-surface2" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={`${user.name ?? user.login} (@${user.login})`}
                className="flex items-center rounded-full transition hover:ring-2 hover:ring-gh-border"
              >
                <Avatar
                  name={user.name ?? user.login ?? "U"}
                  login={user.login ?? ""}
                  image={user.image}
                  size={32}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-gh-border bg-gh-bg-deep py-1 shadow-lg"
                >
                  <div className="border-b border-gh-border px-3 py-2 text-sm">
                    <div className="truncate font-semibold text-gh-text">
                      {user.name ?? user.login}
                    </div>
                    {user.login && (
                      <div className="truncate text-gh-muted">@{user.login}</div>
                    )}
                  </div>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gh-text hover:bg-gh-surface2"
                  >
                    Twój profil
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-gh-text hover:bg-gh-surface2"
                  >
                    Wyloguj się
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signIn("github")}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-gh-border bg-gh-surface px-3 text-sm font-semibold text-gh-text transition-colors hover:bg-gh-surface2"
            >
              <GitHubMark />
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
