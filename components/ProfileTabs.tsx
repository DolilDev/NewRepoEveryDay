"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { questRepos } from "@/lib/mock-data";

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
    </svg>
  );
}

const TABS = [
  { href: "/profile", label: "Overview", icon: BookIcon, count: null as number | null },
  {
    href: "/profile/repositories",
    label: "Repositories",
    icon: ListIcon,
    count: questRepos.length,
  },
];

export default function ProfileTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex h-12 items-end gap-4 overflow-x-auto">
      {TABS.map((tab) => {
        const active =
          tab.href === "/profile"
            ? pathname === "/profile"
            : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-2 pb-[10px] text-sm transition-colors ${
              active
                ? "border-gh-tab-active font-semibold text-gh-text"
                : "border-transparent text-gh-muted hover:text-gh-text"
            }`}
          >
            {/* Ikona zawsze szara (gh-muted) — kolor nie zmienia się przy aktywacji. */}
            <span className="text-gh-muted">
              <Icon />
            </span>
            <span>{tab.label}</span>
            {tab.count != null && (
              <span className="rounded-full bg-gh-surface2 px-2 text-xs font-normal text-gh-muted">
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
