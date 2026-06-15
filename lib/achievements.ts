// Mapping of achievement types from the database (achievements.type column) to
// human-readable names and icons. Types match those granted in /api/quest/submit.
// We show ONLY earned achievements (rows in the database) — no grayed-out ones.

export interface AchievementMeta {
  name: string;
  icon: string;
}

export const ACHIEVEMENT_META: Record<string, AchievementMeta> = {
  first_quest: { name: "First quest", icon: "🎯" },
  streak_7: { name: "7 days in a row", icon: "🔥" },
  streak_30: { name: "30 days in a row", icon: "⚡" },
  streak_100: { name: "100 days in a row", icon: "💯" },
  quests_10: { name: "10 quests", icon: "📦" },
  quests_50: { name: "50 quests", icon: "🏆" },
};

// An unknown type (e.g. added in the future) gets a neutral name/icon,
// so the UI never breaks on data from the database.
export function achievementMeta(type: string): AchievementMeta {
  return ACHIEVEMENT_META[type] ?? { name: type, icon: "🏅" };
}
