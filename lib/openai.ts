// Server-side quest generation via OpenAI (gpt-4o-mini).
// NOTE: OPENAI_API_KEY is read ONLY here, server-side. The key is never returned
// or sent to the browser.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export type QuestSpec = {
  title: string;
  folderName: string; // name of the SUBFOLDER in the container repo (e.g. NERD-rust-wasm)
  why: string;
  instructions: string;
  openPart: string;
  criteria: string[];
};

type ChatMessage = { role: "system" | "user"; content: string };

// A single model call with an enforced JSON format. Returns the raw string.
async function callOpenAI(messages: ChatMessage[], temperature = 0.8): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in the server environment.");

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
    throw new Error("OpenAI returned an empty response.");
  }
  return content;
}

// Reduces any string to the quest SUBFOLDER name format: NERD-<slug>.
// (Container repo model: a quest is a folder, not a separate repo.)
export function normalizeFolderName(raw: string): string {
  let slug = (raw ?? "")
    .toLowerCase()
    .normalize("NFKD")
    // NFKD decomposes diacritics; the filter below removes them along with the rest.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Strip any existing prefix (from the model or an old format); we add our own.
  slug = slug.replace(/^nerd-?/, "").replace(/^daily-quest-?/, "");
  if (!slug) slug = Math.random().toString(36).slice(2, 7);

  return `NERD-${slug}`.slice(0, 90).replace(/-+$/g, "");
}

// Safe parser of the model's response — throws a readable error on missing fields.
function parseQuestJson(content: string): QuestSpec {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content);
  } catch {
    throw new Error("The model returned invalid JSON.");
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
    throw new Error(
      "The model returned an incomplete quest (missing title/instructions/criteria).",
    );
  }

  return { title, folderName, why, instructions, openPart, criteria };
}

const QUEST_SYSTEM_PROMPT = [
  "You are a demanding programming mentor in the NERD - NewEveryRepoDay app.",
  "You generate ONE ambitious, multi-layered task per day — a project that at",
  "first glance looks like 1–2 weeks of work, but that a capable programmer can",
  "realistically finish in one intense day.",
  "",
  "Difficulty rules (VERY IMPORTANT):",
  "- The task must be MULTI-LAYERED: several related modules/functions forming",
  "  a coherent whole, and NOT a single, simple exercise.",
  "- It must require real ARCHITECTURE: a deliberate split into layers/modules,",
  "  error handling and edge cases, a sensible code structure, basic tests.",
  '- It is NOT a "hello world" or a task you can do with one prompt to an AI in a few minutes.',
  "- It should push the user beyond their EXISTING languages, technologies and project",
  "  types (based on the profile) — pick something they have not done yet.",
  "- AVOID dependencies with heavy system setup (e.g. GTK, Qt, GPU/CUDA drivers,",
  "  database engines set up separately) that block you at installation. The difficulty",
  "  should lie in the LOGIC and ARCHITECTURE, not in fighting the environment. Prefer the",
  "  standard library and lightweight dependencies from the language's package manager.",
  "- The project must be runnable locally without exotic hardware or paid accounts.",
  "",
  "Respond in English.",
  "Return ONLY a JSON object (no markdown, no ```), with exactly these fields:",
  '{ "title": string, "folderName": string, "why": string, "instructions": string, "openPart": string, "criteria": string[] }',
  'folderName MUST have the format "NERD-<short-slug>": the "NERD-" prefix, then only lowercase letters and hyphens (e.g. NERD-rust-wasm).',
  "why: why this particular task and this stack — tied to the profile and to what the user has NOT done.",
  "instructions: a substantive project description split into modules/stages — what to build and how it should",
  "  be organized (layers, main components, error handling). Be specific, not vague.",
  "openPart: an ambitious extension beyond the minimum — an optional add-on for the willing.",
  "criteria: 6–10 CONCRETE, MEASURABLE completion criteria reflecting the complexity",
  "  (e.g. specific modules, handled error cases, tests, working commands/endpoints).",
].join("\n");

// Generates a full quest based on a text summary of the user's profile.
export async function generateQuest(profileSummary: string): Promise<QuestSpec> {
  const content = await callOpenAI([
    { role: "system", content: QUEST_SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `User profile (based on their public repositories):\n${profileSummary}\n\n` +
        "Propose ONE ambitious, multi-layered quest in a technology or project type " +
        "this user has NOT used before. It should look like a 1–2 week project, " +
        "but be realistically finishable in one intense day by a capable programmer. " +
        "The difficulty should come from logic and architecture (several modules, error handling, code " +
        "structure, tests), not from tedious setup — avoid heavy system dependencies like GTK.",
    },
  ]);
  return parseQuestJson(content);
}

// When the quest folder name is taken — we ask the model for a DIFFERENT name (a different slug).
export async function generateFolderName(
  title: string,
  avoid: string[],
): Promise<string> {
  const content = await callOpenAI(
    [
      {
        role: "system",
        content:
          'Return ONLY JSON: { "folderName": "NERD-<slug>" }. ' +
          'The "NERD-" prefix, then only lowercase letters and hyphens, short and descriptive.',
      },
      {
        role: "user",
        content:
          `Quest title: "${title}". Propose a NEW, different folder name. ` +
          `Do not use any of these taken names: ${avoid.join(", ") || "(none)"}.`,
      },
    ],
    1,
  );

  let candidate = "";
  try {
    const obj = JSON.parse(content);
    if (typeof obj?.folderName === "string") candidate = obj.folderName;
  } catch {
    // ignore — fallback below
  }

  let name = normalizeFolderName(candidate || title);
  // When the model stubbornly returns a taken name — we append a random suffix.
  if (avoid.includes(name)) {
    name = normalizeFolderName(`${title}-${Math.random().toString(36).slice(2, 6)}`);
  }
  return name;
}

// A fixed README section — identical in every QUEST.md, added in code
// (NOT generated by the model).
const README_SECTION = `## README (required)
In the repository, create a \`README.md\` file written **in English**, describing the project:
what it is, how to run it, and what was used (languages, libraries, tools).
This is a mandatory requirement for every quest.`;

// A fixed criterion about the README — appended to the list regardless of the model.
const README_CRITERION = "The repository contains a README.md file written in English";

// Builds the content of the QUEST.md file from the generated quest (nice markdown).
export function buildQuestMarkdown(quest: QuestSpec): string {
  // We add the fixed README criterion unconditionally, without relying on the model.
  const allCriteria = [...quest.criteria, README_CRITERION];
  const criteria = allCriteria.map((c) => `- [ ] ${c}`).join("\n");
  return `# ${quest.title}

## Why this task
${quest.why || "—"}

## Instructions
${quest.instructions}

## Add your own twist
${quest.openPart || "—"}

${README_SECTION}

## Completion criteria
${criteria}

---
*Automatically generated by NERD - NewEveryRepoDay.*
`;
}

// --- Quest evaluation (Stage B, part 2) ------------------------------------

// Evaluation of a SINGLE criterion together with evidence. The model evaluates each
// criterion separately — this stabilizes the verdict (the model does not decide on
// the whole thing in one step).
export type CriterionCheck = {
  criterion: string; // the criterion text
  met: boolean; // whether it is met
  evidence: string; // the specific file + supporting fragment (or what is missing)
};

export type QuestVerdict = {
  passed: boolean;
  perCriterion: CriterionCheck[];
  missing: string[];
  descriptionOfWork: string;
  reasoning: string;
};

const EVAL_SYSTEM_PROMPT = [
  "You are a rigorous reviewer of programming tasks in the NERD - NewEveryRepoDay app.",
  "You evaluate whether the user completed today's quest. Evaluate EACH criterion SEPARATELY —",
  "do NOT make a single decision about the whole thing at once. For EACH criterion set met (boolean)",
  "AND evidence:",
  "- when met=true: point to the SPECIFIC file and code/content fragment that satisfies this criterion,",
  "- when met=false: write EXACTLY what is missing for the criterion to be met.",
  "Before you mark a criterion as not met, review ALL files in the material, including",
  "subfolders (src/, tests/, web/). Do not guess — rely only on what you actually",
  "see in the file content.",
  "IMPORTANT: the QUEST.md file is the system instructions (the repository's starting state) — it is NOT",
  "the user's work and does not count as a contribution. You evaluate ONLY the remaining content",
  "of the repository (code, README and other files) as the user's work.",
  "Additional fixed criterion: the repository MUST contain a README.md file written in ENGLISH.",
  "Do NOT return a passed field — the app will compute the final verdict from your per-criterion evaluations.",
  "Write all text fields in English.",
  "Return ONLY a JSON object (no markdown, no ```), with exactly these fields:",
  '{ "perCriterion": [{ "criterion": string, "met": boolean, "evidence": string }], "descriptionOfWork": string, "reasoning": string }',
  "perCriterion: one entry for EACH listed criterion, in the same order.",
  "descriptionOfWork: one sentence describing what the user actually created.",
  "reasoning: a short, overall justification (which criteria passed and which did not).",
].join("\n");

// Shortens evidence into a brief note for the missing list — we do not flood the list of gaps with the full evidence.
function shortEvidence(evidence: string): string {
  const e = evidence.trim();
  if (e.length <= 160) return e;
  return `${e.slice(0, 157)}…`;
}

// Safe verdict parser. The model evaluates each criterion separately; the final verdict
// (passed) is computed DETERMINISTICALLY in code from the per-criterion evaluations.
function parseVerdict(content: string): QuestVerdict {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content);
  } catch {
    throw new Error("The model returned invalid evaluation JSON.");
  }

  // perCriterion: an array of { criterion, met, evidence } objects — filter out invalid entries.
  const perCriterion: CriterionCheck[] = Array.isArray(obj.perCriterion)
    ? obj.perCriterion
        .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
        .filter(
          (c) =>
            typeof c.criterion === "string" &&
            typeof c.met === "boolean" &&
            typeof c.evidence === "string",
        )
        .map((c) => ({
          criterion: (c.criterion as string).trim(),
          met: c.met as boolean,
          evidence: (c.evidence as string).trim(),
        }))
        .filter((c) => c.criterion.length > 0)
    : [];

  if (perCriterion.length === 0) {
    throw new Error("The model did not return per-criterion evaluations (perCriterion).");
  }

  // DETERMINISTIC verdict: passed only when EVERY criterion is met.
  const passed = perCriterion.length > 0 && perCriterion.every((c) => c.met);

  // We build missing automatically from the unmet criteria (text + short evidence).
  const missing = perCriterion
    .filter((c) => !c.met)
    .map((c) => {
      const ev = shortEvidence(c.evidence);
      return ev ? `${c.criterion} — ${ev}` : c.criterion;
    });

  return {
    passed,
    perCriterion,
    missing,
    descriptionOfWork:
      typeof obj.descriptionOfWork === "string" ? obj.descriptionOfWork.trim() : "",
    reasoning: typeof obj.reasoning === "string" ? obj.reasoning.trim() : "",
  };
}

// Evaluates a quest based on its content and the material collected from the repository.
export async function evaluateQuest(
  quest: {
    title: string;
    instructions: string;
    openPart: string;
    criteria: string[];
  },
  material: string,
): Promise<QuestVerdict> {
  const criteriaList = quest.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n");
  // The fixed README criterion gets the number right after the quest's criteria.
  const readmeIndex = quest.criteria.length + 1;

  const content = await callOpenAI(
    [
      { role: "system", content: EVAL_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `QUEST TO EVALUATE\n\n` +
          `Title: ${quest.title}\n\n` +
          `Instructions:\n${quest.instructions}\n\n` +
          `Open-ended extension (an extra contribution of your own):\n${quest.openPart || "—"}\n\n` +
          `Completion criteria — evaluate EACH separately:\n` +
          `${criteriaList || "(none)"}\n` +
          `${readmeIndex}. README.md written in English (fixed criterion)\n\n` +
          `In perCriterion return ONE entry for EACH of the above criteria ` +
          `(in the same order, including the README criterion), each with met and evidence.\n\n` +
          `=== MATERIAL FROM THE REPOSITORY ===\n${material}`,
      },
    ],
    0.2, // low temperature — the evaluation should be repeatable
  );

  return parseVerdict(content);
}
