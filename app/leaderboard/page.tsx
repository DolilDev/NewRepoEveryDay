import Avatar from "@/components/Avatar";
import { currentUser, leaderboard } from "@/lib/mock-data";

export default function LeaderboardPage() {
  // Sortowanie po streaku malejąco, rozstrzygnięcie po liczbie questów.
  const ranked = [...leaderboard].sort(
    (a, b) => b.currentStreak - a.currentStreak || b.totalQuests - a.totalQuests,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gh-text">Ranking</h1>
        <p className="text-sm text-gh-muted">
          Globalna tabela liderów — sortowana po aktualnym streaku.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gh-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gh-surface2 text-left text-xs uppercase tracking-wide text-gh-muted">
              <th className="w-12 px-4 py-3 text-center font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Gracz</th>
              <th className="px-4 py-3 text-right font-semibold">Streak</th>
              <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">
                Questy
              </th>
              <th className="px-4 py-3 text-right font-semibold">Punkty</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((player, i) => {
              const isMe = player.id === currentUser.id;
              const rank = i + 1;
              const medal = ["🥇", "🥈", "🥉"][i];
              return (
                <tr
                  key={player.id}
                  className={`border-t border-gh-border ${
                    isMe ? "bg-gh-green/10" : "bg-gh-surface hover:bg-gh-surface2"
                  }`}
                >
                  <td className="px-4 py-3 text-center font-mono text-gh-muted">
                    {medal ?? rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={player.name} login={player.login} size={28} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-gh-text">
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="rounded-full border border-gh-green/40 bg-gh-green/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gh-green-hover">
                              Ty
                            </span>
                          )}
                        </div>
                        <a
                          href={player.profileUrl}
                          className="truncate text-xs text-gh-muted hover:text-gh-blue hover:underline"
                        >
                          @{player.login}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gh-text">
                    🔥 {player.currentStreak}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-gh-muted sm:table-cell">
                    {player.totalQuests}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gh-text">
                    {player.points.toLocaleString("pl-PL")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
