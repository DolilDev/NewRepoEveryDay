// Serwerowe generowanie questa przez OpenAI (gpt-4o-mini).
// UWAGA: OPENAI_API_KEY czytany WYŁĄCZNIE tutaj, po stronie serwera. Klucz nigdy
// nie jest zwracany ani wysyłany do przeglądarki.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export type QuestSpec = {
  title: string;
  repoName: string;
  why: string;
  instructions: string;
  openPart: string;
  criteria: string[];
};

type ChatMessage = { role: "system" | "user"; content: string };

// Pojedyncze wywołanie modelu z wymuszonym formatem JSON. Zwraca surowy string.
async function callOpenAI(
  messages: ChatMessage[],
  temperature = 0.8,
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Brak OPENAI_API_KEY w środowisku serwera.");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      response_format: { type: "json_object" },
      messages,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI API ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI zwrócił pustą odpowiedź.");
  }
  return content;
}

// Sprowadza dowolny string do formatu nazwy repo: daily-quest-<slug>.
export function normalizeRepoName(raw: string): string {
  let slug = (raw ?? "")
    .toLowerCase()
    .normalize("NFKD")
    // NFKD rozkłada znaki diakrytyczne; filtr poniżej usuwa je wraz z resztą.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  slug = slug.replace(/^daily-quest-?/, "");
  if (!slug) slug = Math.random().toString(36).slice(2, 7);

  return `daily-quest-${slug}`.slice(0, 90).replace(/-+$/g, "");
}

// Bezpieczny parser odpowiedzi modelu — rzuca czytelny błąd przy braku pól.
function parseQuestJson(content: string): QuestSpec {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content);
  } catch {
    throw new Error("Model zwrócił niepoprawny JSON.");
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const title = str(obj.title);
  const why = str(obj.why);
  const instructions = str(obj.instructions);
  const openPart = str(obj.openPart);
  const criteria = Array.isArray(obj.criteria)
    ? obj.criteria
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.trim())
    : [];
  const repoName = normalizeRepoName(str(obj.repoName) || title);

  if (!title || !instructions || criteria.length === 0) {
    throw new Error("Model zwrócił niekompletny quest (brak tytułu/instrukcji/kryteriów).");
  }

  return { title, repoName, why, instructions, openPart, criteria };
}

const QUEST_SYSTEM_PROMPT = [
  "Jesteś mentorem programistów w aplikacji DailyQuest.",
  "Generujesz codzienne zadanie typu „zrób coś, czego jeszcze nie robiłeś” —",
  "ma wypchnąć użytkownika poza jego dotychczasowe języki i typy projektów.",
  "Odpowiadaj PO POLSKU.",
  "Zwróć WYŁĄCZNIE obiekt JSON (bez markdown, bez ```), o dokładnie tych polach:",
  '{ "title": string, "repoName": string, "why": string, "instructions": string, "openPart": string, "criteria": string[] }',
  'repoName MUSI mieć format "daily-quest-<krótki-slug>": tylko małe litery i myślniki.',
  "why: dlaczego akurat to zadanie, powiązane z profilem użytkownika.",
  "instructions: konkretne kroki, co i jak zrobić.",
  "openPart: co użytkownik ma dodać od siebie ponad minimum.",
  "criteria: lista konkretnych, sprawdzalnych kryteriów zaliczenia (3–6 pozycji).",
].join("\n");

// Generuje pełny quest na podstawie tekstowego podsumowania profilu użytkownika.
export async function generateQuest(profileSummary: string): Promise<QuestSpec> {
  const content = await callOpenAI([
    { role: "system", content: QUEST_SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `Profil użytkownika (na podstawie jego publicznych repozytoriów):\n${profileSummary}\n\n` +
        "Zaproponuj quest, który wyprowadzi go poza znane mu technologie. " +
        "Zadanie ma być realne do zrobienia w jeden dzień.",
    },
  ]);
  return parseQuestJson(content);
}

// Gdy nazwa repo jest zajęta — prosimy model o INNĄ nazwę (inny slug).
export async function generateRepoName(
  title: string,
  avoid: string[],
): Promise<string> {
  const content = await callOpenAI(
    [
      {
        role: "system",
        content:
          'Zwróć WYŁĄCZNIE JSON: { "repoName": "daily-quest-<slug>" }. ' +
          "Tylko małe litery i myślniki, krótko i opisowo.",
      },
      {
        role: "user",
        content:
          `Tytuł questa: "${title}". Zaproponuj NOWĄ, inną nazwę repozytorium. ` +
          `Nie używaj żadnej z tych zajętych nazw: ${avoid.join(", ") || "(brak)"}.`,
      },
    ],
    1,
  );

  let candidate = "";
  try {
    const obj = JSON.parse(content);
    if (typeof obj?.repoName === "string") candidate = obj.repoName;
  } catch {
    // zignoruj — poniżej fallback
  }

  let name = normalizeRepoName(candidate || title);
  // Gdy model uparcie zwraca zajętą nazwę — dokładamy losowy sufiks.
  if (avoid.includes(name)) {
    name = normalizeRepoName(`${title}-${Math.random().toString(36).slice(2, 6)}`);
  }
  return name;
}

// Buduje treść pliku QUEST.md z wygenerowanego questa (ładny markdown).
export function buildQuestMarkdown(quest: QuestSpec): string {
  const criteria = quest.criteria.map((c) => `- [ ] ${c}`).join("\n");
  return `# ${quest.title}

## Dlaczego to zadanie
${quest.why || "—"}

## Instrukcja
${quest.instructions}

## Dodaj coś od siebie
${quest.openPart || "—"}

## Kryteria zaliczenia
${criteria}

---
*Wygenerowane automatycznie przez DailyQuest.*
`;
}
