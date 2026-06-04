"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
import { currentUser } from "@/lib/mock-data";

const NAV = [
  { href: "/", label: "Quest na dziś" },
  { href: "/profile", label: "Profil" },
  { href: "/leaderboard", label: "Ranking" },
  { href: "/chat", label: "Czat" },
];

function FlameLogo() {
  return (
    <svg
      width="24"
      height="24"
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

export default function Header() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-b border-gh-border bg-gh-surface">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-semibold text-gh-text"
            >
              <FlameLogo />
              <span>DailyQuest</span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-gh-surface2 font-semibold text-gh-text"
                        : "text-gh-muted hover:bg-gh-surface2 hover:text-gh-text"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full ring-gh-border hover:ring-2"
            title={`${currentUser.name} (@${currentUser.login})`}
          >
            <Avatar name={currentUser.name} login={currentUser.login} size={32} />
          </Link>
        </div>

        {/* Nawigacja mobilna */}
        <nav className="flex gap-1 overflow-x-auto pb-2 sm:hidden">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-gh-surface2 font-semibold text-gh-text"
                    : "text-gh-muted hover:bg-gh-surface2 hover:text-gh-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
