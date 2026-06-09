// Serwerowe generowanie questa przez OpenAI (gpt-4o-mini).
// UWAGA: OPENAI_API_KEY czytany WYŁĄCZNIE tutaj, po stronie serwera. Klucz nigdy
// nie jest zwracany ani wysyłany do przeglądarki.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export type QuestSpec = {
  title: string;
  folderName: string; // nazwa PODFOLDERU w repo-kontenerze (np. NERD-rust-wasm)
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

// Sprowadza dowolny string do formatu nazwy PODFOLDERU questa: NERD-<slug>.
// (Model repo-kontenera: quest to folder, nie osobne repo.)
export function normalizeFolderName(raw: string): string {
  let slug = (raw ?? "")
    .toLowerCase()
    .normalize("NFKD")
    // NFKD rozkłada znaki diakrytyczne; filtr poniżej usuwa je wraz z resztą.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Zdejmij ewentualny prefiks (z modelu lub starego formatu), dodamy własny.
  slug = slug.replace(/^nerd-?/, "").replace(/^daily-quest-?/, "");
  if (!slug) slug = Math.random().toString(36).slice(2, 7);

  return `NERD-${slug}`.slice(0, 90).replace(/-+$/g, "");
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
  const folderName = normalizeFolderName(str(obj.folderName) || title);

  if (!title || !instructions || criteria.length === 0) {
    throw new Error("Model zwrócił niekompletny quest (brak tytułu/instrukcji/kryteriów).");
  }

  return { title, folderName, why, instructions, openPart, criteria };
}

const QUEST_SYSTEM_PROMPT = [
  "Jesteś wymagającym mentorem programistów w aplikacji NERD - NewEveryRepoDay.",
  "Generujesz JEDNO ambitne, wielowarstwowe zadanie na dzień — projekt, który na",
  "pierwszy rzut oka wygląda jak praca rozpisana na 1–2 tygodnie, ale zdolny",
  "programista realnie zamknie go w jeden intensywny dzień.",
  "",
  "Zasady trudności (BARDZO WAŻNE):",
  "- Zadanie ma być WIELOWARSTWOWE: kilka powiązanych modułów/funkcji tworzących",
  "  spójną całość, a NIE pojedyncze, proste ćwiczenie.",
  "- Musi wymagać realnej ARCHITEKTURY: przemyślany podział na warstwy/moduły,",
  "  obsługa błędów i przypadków brzegowych, sensowna struktura kodu, podstawowe testy.",
  "- To NIE jest „hello world” ani zadanie do zrobienia jednym promptem do AI w kilka minut.",
  "- Ma wypchnąć użytkownika poza jego DOTYCHCZASOWE języki, technologie i typy",
  "  projektów (na podstawie profilu) — wybierz coś, czego jeszcze nie robił.",
  "- UNIKAJ zależności z ciężkim setupem systemowym (np. GTK, Qt, sterowniki GPU/CUDA,",
  "  silniki baz danych stawiane osobno), które blokują już na instalacji. Trudność ma",
  "  leżeć w LOGICE i ARCHITEKTURZE, nie w walce ze środowiskiem. Preferuj bibliotekę",
  "  standardową i lekkie zależności z menedżera pakietów danego języka.",
  "- Projekt ma dać się uruchomić lokalnie bez egzotycznego sprzętu i płatnych kont.",
  "",
  "Odpowiadaj PO POLSKU.",
  "Zwróć WYŁĄCZNIE obiekt JSON (bez markdown, bez ```), o dokładnie tych polach:",
  '{ "title": string, "folderName": string, "why": string, "instructions": string, "openPart": string, "criteria": string[] }',
  'folderName MUSI mieć format "NERD-<krótki-slug>": prefiks "NERD-", dalej tylko małe litery i myślniki (np. NERD-rust-wasm).',
  "why: dlaczego akurat to zadanie i ten stack — powiązane z profilem i z tym, czego user NIE robił.",
  "instructions: treściwy opis projektu z podziałem na moduły/etapy — co zbudować i jak ma być",
  "  poukładane (warstwy, główne komponenty, obsługa błędów). Konkretnie, nie ogólnikowo.",
  "openPart: ambitne rozszerzenie ponad minimum — opcjonalny dodatek dla chętnych.",
  "criteria: 6–10 KONKRETNYCH, MIERZALNYCH kryteriów zaliczenia odzwierciedlających złożoność",
  "  (np. konkretne moduły, obsłużone przypadki błędów, testy, działające polecenia/endpointy).",
].join("\n");

// Generuje pełny quest na podstawie tekstowego podsumowania profilu użytkownika.
export async function generateQuest(profileSummary: string): Promise<QuestSpec> {
  const content = await callOpenAI([
    { role: "system", content: QUEST_SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `Profil użytkownika (na podstawie jego publicznych repozytoriów):\n${profileSummary}\n\n` +
        "Zaproponuj JEDEN ambitny, wielowarstwowy quest w technologii lub typie projektu, " +
        "których ten użytkownik dotąd NIE używał. Ma wyglądać jak projekt na 1–2 tygodnie, " +
        "ale być realny do skończenia w jeden intensywny dzień przez zdolnego programistę. " +
        "Trudność ma wynikać z logiki i architektury (kilka modułów, obsługa błędów, struktura " +
        "kodu, testy), a nie z mozolnego setupu — unikaj ciężkich zależności systemowych typu GTK.",
    },
  ]);
  return parseQuestJson(content);
}

// Gdy nazwa folderu questa jest zajęta — prosimy model o INNĄ nazwę (inny slug).
export async function generateFolderName(
  title: string,
  avoid: string[],
): Promise<string> {
  const content = await callOpenAI(
    [
      {
        role: "system",
        content:
          'Zwróć WYŁĄCZNIE JSON: { "folderName": "NERD-<slug>" }. ' +
          'Prefiks "NERD-", dalej tylko małe litery i myślniki, krótko i opisowo.',
      },
      {
        role: "user",
        content:
          `Tytuł questa: "${title}". Zaproponuj NOWĄ, inną nazwę folderu. ` +
          `Nie używaj żadnej z tych zajętych nazw: ${avoid.join(", ") || "(brak)"}.`,
      },
    ],
    1,
  );

  let candidate = "";
  try {
    const obj = JSON.parse(content);
    if (typeof obj?.folderName === "string") candidate = obj.folderName;
  } catch {
    // zignoruj — poniżej fallback
  }

  let name = normalizeFolderName(candidate || title);
  // Gdy model uparcie zwraca zajętą nazwę — dokładamy losowy sufiks.
  if (avoid.includes(name)) {
    name = normalizeFolderName(`${title}-${Math.random().toString(36).slice(2, 6)}`);
  }
  return name;
}

// Stała sekcja README — identyczna w każdym QUEST.md, dodawana w kodzie
// (NIE generowana przez model).
const README_SECTION = `## README (wymagane)
W repozytorium utwórz plik \`README.md\` napisany **po angielsku**, opisujący projekt:
co to jest, jak go uruchomić oraz czego użyto (języki, biblioteki, narzędzia).
To wymóg obowiązkowy dla każdego questa.`;

// Stałe kryterium dotyczące README — doklejane do listy niezależnie od modelu.
const README_CRITERION = "Repozytorium zawiera plik README.md napisany po angielsku";

// Buduje treść pliku QUEST.md z wygenerowanego questa (ładny markdown).
export function buildQuestMarkdown(quest: QuestSpec): string {
  // Stałe kryterium README dokładamy na sztywno, nie polegając na modelu.
  const allCriteria = [...quest.criteria, README_CRITERION];
  const criteria = allCriteria.map((c) => `- [ ] ${c}`).join("\n");
  return `# ${quest.title}

## Dlaczego to zadanie
${quest.why || "—"}

## Instrukcja
${quest.instructions}

## Dodaj coś od siebie
${quest.openPart || "—"}

${README_SECTION}

## Kryteria zaliczenia
${criteria}

---
*Wygenerowane automatycznie przez NERD - NewEveryRepoDay.*
`;
}

// --- Ocena questa (Etap B, część 2) ----------------------------------------

export type QuestVerdict = {
  passed: boolean;
  missing: string[];
  descriptionOfWork: string;
  reasoning: string;
};

const EVAL_SYSTEM_PROMPT = [
  "Jesteś rygorystycznym recenzentem zadań programistycznych w aplikacji NERD - NewEveryRepoDay.",
  "Oceniasz, czy użytkownik wykonał dzisiejszy quest. Werdykt jest BINARNY:",
  "zaliczone (100/100) TYLKO gdy spełnione są WSZYSTKIE kryteria; inaczej niezaliczone.",
  "WAŻNE: plik QUEST.md to instrukcja systemu (stan startowy repozytorium) — NIE jest",
  "pracą użytkownika i nie liczy się jako wkład. Oceniasz WYŁĄCZNIE pozostałą zawartość",
  "repozytorium (kod, README i inne pliki) jako pracę użytkownika.",
  "Dodatkowe stałe kryterium: repozytorium MUSI zawierać plik README.md napisany po ANGIELSKU.",
  "Bądź konkretny — jeśli czegoś brakuje, napisz dokładnie czego.",
  "Pola tekstowe wypełniaj PO POLSKU.",
  "Zwróć WYŁĄCZNIE obiekt JSON (bez markdown, bez ```), o dokładnie tych polach:",
  '{ "passed": boolean, "missing": string[], "descriptionOfWork": string, "reasoning": string }',
  "missing: lista konkretnych braków (pusta tablica, gdy passed=true).",
  "descriptionOfWork: jedno zdanie opisujące, co użytkownik faktycznie stworzył.",
  "reasoning: krótkie uzasadnienie werdyktu.",
].join("\n");

// Bezpieczny parser werdyktu — przy błędnym JSON rzuca czytelny błąd.
function parseVerdict(content: string): QuestVerdict {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content);
  } catch {
    throw new Error("Model zwrócił niepoprawny JSON oceny.");
  }
  const missing = Array.isArray(obj.missing)
    ? obj.missing
        .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
        .map((m) => m.trim())
    : [];
  return {
    passed: obj.passed === true,
    missing,
    descriptionOfWork:
      typeof obj.descriptionOfWork === "string" ? obj.descriptionOfWork.trim() : "",
    reasoning: typeof obj.reasoning === "string" ? obj.reasoning.trim() : "",
  };
}

// Ocenia quest na podstawie jego treści i materiału zebranego z repozytorium.
export async function evaluateQuest(
  quest: {
    title: string;
    instructions: string;
    openPart: string;
    criteria: string[];
  },
  material: string,
): Promise<QuestVerdict> {
  const criteriaList = quest.criteria
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  const content = await callOpenAI(
    [
      { role: "system", content: EVAL_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `QUEST DO OCENY\n\n` +
          `Tytuł: ${quest.title}\n\n` +
          `Instrukcja:\n${quest.instructions}\n\n` +
          `Część otwarta (dodatkowy wkład od siebie):\n${quest.openPart || "—"}\n\n` +
          `Kryteria zaliczenia (WSZYSTKIE muszą być spełnione):\n` +
          `${criteriaList || "(brak)"}\n` +
          `(plus stałe kryterium: README.md napisany po angielsku)\n\n` +
          `=== MATERIAŁ Z REPOZYTORIUM ===\n${material}`,
      },
    ],
    0.2, // niska temperatura — ocena ma być powtarzalna
  );

  return parseVerdict(content);
}
