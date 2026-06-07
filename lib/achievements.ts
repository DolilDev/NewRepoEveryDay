// Mapowanie typów osiągnięć z bazy (kolumna achievements.type) na czytelne
// polskie nazwy i ikony. Typy zgodne z tymi przyznawanymi w /api/quest/submit.
// Pokazujemy WYŁĄCZNIE zdobyte osiągnięcia (wiersze w bazie) — bez wyszarzonych.

export interface AchievementMeta {
  name: string;
  icon: string;
}

export const ACHIEVEMENT_META: Record<string, AchievementMeta> = {
  first_quest: { name: "Pierwszy quest", icon: "🎯" },
  streak_7: { name: "7 dni z rzędu", icon: "🔥" },
  streak_30: { name: "30 dni z rzędu", icon: "⚡" },
  streak_100: { name: "100 dni z rzędu", icon: "💯" },
  quests_10: { name: "10 questów", icon: "📦" },
  quests_50: { name: "50 questów", icon: "🏆" },
};

// Nieznany typ (np. dodany w przyszłości) dostaje neutralną nazwę/ikonę,
// żeby UI nigdy się nie wywaliło na danych z bazy.
export function achievementMeta(type: string): AchievementMeta {
  return ACHIEVEMENT_META[type] ?? { name: type, icon: "🏅" };
}
