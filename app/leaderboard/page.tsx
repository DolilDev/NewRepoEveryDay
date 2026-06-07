"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";

// Gracz w rankingu — kształt zgodny z odpowiedzią /api/leaderboard.
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

  // Ranking liczymy serwerowo — tu tylko pobieramy gotową, posortowaną listę.
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
        // sieć/serwer niedostępny — zostaje pusty ranking
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Ranga z pełnej listy (kolejność z serwera), żeby filtr nie zmieniał numerów.
  const ranked = useMemo(
    () => players.map((player, i) => ({ player, rank: i + 1 })),
    [players],
  );

  const q = query.trim().toLowerCase();
  const visible = q
    ? ranked.filter(
        ({ player }) =>
          player.name.toLowerCase().includes(q) ||
          player.login.toLowerCase().includes(q),
      )
    : ranked;

  return (
    <div className="mx-auto w-3/5 space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-gh-text">Ranking</h1>
        <p className="text-sm text-gh-muted">
          Globalna tabela liderów — sortowana po aktualnym streaku.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj gracza po nazwie lub @loginie…"
        aria-label="Szukaj gracza"
        className="h-9 w-full rounded-md border border-gh-border bg-gh-bg px-3 text-sm text-gh-text placeholder:text-gh-subtle focus:border-gh-blue focus:outline-none"
      />

      <div className="overflow-hidden rounded-md border border-gh-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gh-surface2 text-left text-xs uppercase tracking-wide text-gh-muted">
              <th className="w-12 px-4 py-2 text-center font-semibold">#</th>
              <th className="px-4 py-2 font-semibold">Gracz</th>
              <th className="px-4 py-2 text-right font-semibold">Streak</th>
              <th className="hidden px-4 py-2 text-right font-semibold sm:table-cell">
                Questy
              </th>
              <th className="px-4 py-2 text-right font-semibold">Punkty</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Stan ładowania — odróżniony od pustego rankingu.
              <tr className="border-t border-gh-border bg-gh-surface">
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gh-muted"
                >
                  Ładowanie rankingu…
                </td>
              </tr>
            ) : players.length === 0 ? (
              // Stan pusty — nikt jeszcze nie gra (nie błąd).
              <tr className="border-t border-gh-border bg-gh-surface">
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gh-muted"
                >
                  Nikt jeszcze nie zaczął grać — bądź pierwszy!
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
                      isMe
                        ? "bg-gh-surface2"
                        : "bg-gh-surface hover:bg-gh-surface2"
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
                                Ty
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
                      {player.points.toLocaleString("pl-PL")}
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && players.length > 0 && visible.length === 0 && (
              <tr className="border-t border-gh-border bg-gh-surface">
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gh-muted"
                >
                  Brak graczy pasujących do „{query.trim()}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
