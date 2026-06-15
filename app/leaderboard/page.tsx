"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";

// Player in the leaderboard — shape matching the /api/leaderboard response.
type Player = {
  id: string;
  name: string;
  login: string;
  avatarUrl: string | null;
  profileUrl: string;
  currentStreak: number;
  longestStreak: number;
  totalQuests: number;
  points: number;
};

export default function LeaderboardPage() {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [meLogin, setMeLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // The leaderboard is computed server-side — here we just fetch the ready, sorted list.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setPlayers(Array.isArray(data.players) ? data.players : []);
        setMeLogin(typeof data.meLogin === "string" ? data.meLogin : null);
      } catch {
        // network/server unavailable — the leaderboard stays empty
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Rank from the full list (server order) so the filter doesn't change the numbers.
  const ranked = useMemo(
    () => players.map((player, i) => ({ player, rank: i + 1 })),
    [players],
  );

  const q = query.trim().toLowerCase();
  const visible = q
    ? ranked.filter(
        ({ player }) =>
          player.name.toLowerCase().includes(q) || player.login.toLowerCase().includes(q),
      )
    : ranked;

  return (
    <div className="mx-auto w-3/5 space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-gh-text">Leaderboard</h1>
        <p className="text-sm text-gh-muted">
          Global leaderboard — sorted by current streak.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a player by name or @login…"
        aria-label="Search for a player"
        className="h-9 w-full rounded-md border border-gh-border bg-gh-bg px-3 text-sm text-gh-text placeholder:text-gh-subtle focus:border-gh-blue focus:outline-none"
      />

      <div className="overflow-hidden rounded-md border border-gh-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gh-surface2 text-left text-xs uppercase tracking-wide text-gh-muted">
              <th className="w-12 px-4 py-2 text-center font-semibold">#</th>
              <th className="px-4 py-2 font-semibold">Player</th>
              <th className="px-4 py-2 text-right font-semibold">Streak</th>
              <th className="hidden px-4 py-2 text-right font-semibold sm:table-cell">
                Quests
              </th>
              <th className="px-4 py-2 text-right font-semibold">Points</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading state — distinct from an empty leaderboard.
              <tr className="border-t border-gh-border bg-gh-surface">
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gh-muted">
                  Loading the leaderboard…
                </td>
              </tr>
            ) : players.length === 0 ? (
              // Empty state — nobody is playing yet (not an error).
              <tr className="border-t border-gh-border bg-gh-surface">
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gh-muted">
                  Nobody has started playing yet — be the first!
                </td>
              </tr>
            ) : (
              visible.map(({ player, rank }) => {
                const isMe = meLogin != null && player.login === meLogin;
                const medal = ["🥇", "🥈", "🥉"][rank - 1];
                return (
                  <tr
                    key={player.id}
                    className={`border-t border-gh-border ${
                      isMe ? "bg-gh-surface2" : "bg-gh-surface hover:bg-gh-surface2"
                    }`}
                  >
                    <td className="px-4 py-2 text-center font-mono text-gh-muted">
                      {medal ?? rank}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-4">
                        <Avatar
                          name={player.name}
                          login={player.login}
                          image={player.avatarUrl}
                          size={28}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-gh-text">
                              {player.name}
                            </span>
                            {isMe && (
                              <span className="rounded-full border border-gh-green/40 bg-gh-green/10 px-2 text-xs font-semibold uppercase text-gh-green">
                                You
                              </span>
                            )}
                          </div>
                          <a
                            href={player.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-xs text-gh-muted hover:text-gh-blue hover:underline"
                          >
                            @{player.login}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gh-text">
                      🔥 {player.currentStreak}
                    </td>
                    <td className="hidden px-4 py-2 text-right text-gh-muted sm:table-cell">
                      {player.totalQuests}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gh-text">
                      {player.points.toLocaleString("en-US")}
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && players.length > 0 && visible.length === 0 && (
              <tr className="border-t border-gh-border bg-gh-surface">
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gh-muted">
                  No players matching &quot;{query.trim()}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
