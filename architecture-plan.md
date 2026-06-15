# DailyQuest — architecture plan

A GitHub-style app: you sign in with GitHub, the AI scans your public repositories, and every day it invents a quest for you — "build something you haven't built before" — which you complete by creating a new repo. The quest resets at midnight. There's a live chat for everyone, a leaderboard, and per-player stats with a streak heatmap just like a GitHub profile.

This document is a plan — the agreed vision we're building from. There's no code here yet.

---

## 1. Agreed decisions

These points are settled, and they shape the entire architecture.

1. **Sign-in via GitHub OAuth only.** No other methods. The OAuth username is the player's identity across the whole system.
2. **Quest verification: the AI evaluates, but the verdict is binary — 100/100 or nothing.** There is no partial pass. On rejection the user gets a concrete list of what's missing, so they know what to finish.
3. **The AI dictates the repo name when it generates the quest.** This way the verification link is assembled automatically from the `username` (from OAuth) + the dictated name. It closes the "swap in an old repo" cheat.
4. **Requirement: the repo must be public.** Without that, the AI has no way to read it.
5. **The streak heatmap counts completed quests** (not GitHub commits). Hovering over a day shows a short description of what was built that day.
6. **Reset at midnight.** (To be finalized: time zone — see open questions.)
7. **Look: like GitHub.** Dark theme, the same green palette as the commit calendar, GitHub-style typography and components.

---

## 2. User flow (happy path)

1. The user lands on the site → GitHub-style sign-in screen → "Sign in with GitHub".
2. OAuth: consent to read public data (`read:user`, `public_repo` for reading).
3. First sign-in: the AI scans the user's public repos → builds a **profile** (which languages they use, which project types they've done, what they have NOT done). This is the basis for judging "newness".
4. The system shows **today's quest**: the task description + **the dictated repo name** + the completion criteria.
5. The user completes the quest: creates a public repo with that name and builds what the quest requires.
6. The user clicks **"Done"**.
7. The backend assembles the link `github.com/<username>/<repo-name>` → fetches the contents via the GitHub API → the AI evaluates.
8. Verdict:
   - **Passed (100/100):** streak +1, the day lights up on the heatmap with a description, points toward the leaderboard, and the new project is added to the profile.
   - **Not passed:** a list of what's missing; the user fixes the repo and clicks again.
9. At midnight: the quest resets. If yesterday's wasn't completed → the streak drops (rule to be finalized).

---

## 3. System components

The system has four layers: frontend, backend (API), database, and external services.

### 3.1 Frontend

A GitHub-style interface. Main views:

- **Sign-in** — a single OAuth button.
- **Dashboard / today's quest** — the quest card, the repo name, the criteria, a "Done" button, a countdown to midnight.
- **Player profile** — stats, the streak heatmap (a GitHub-style calendar), the history of completed quests.
- **Leaderboard** — a leaders table (streak, total quest count, points).
- **Live chat** — shared by everyone who's signed in.

### 3.2 Backend (API + logic)

- OAuth handling (code → token exchange, session).
- Repo scanning and profile building.
- Quest generation (AI call).
- Quest verification (GitHub API + AI).
- Midnight-reset scheduler (cron / scheduled job).
- Chat handling (WebSocket).
- Computing the leaderboard and stats.

### 3.3 Database

Persistent storage. Tables (sketch):

- **users** — id, github_login (the `@name` handle), github_name (first/last name, if set), avatar_url (profile picture), profile_url (`html_url`, link to the GitHub profile), join date, token (encrypted).
- **profiles** — for each user: a list of languages, project types, "what they haven't done yet" (updated after each pass).
- **quests** — id, user_id, date, description, dictated repo name, criteria, status (pending/passed/failed), description of the work done (for the heatmap).
- **completions** — a log of completions (user_id, date, quest_id, link to the repo) → the data source for the heatmap and the streak.
- **stats** — user_id, current_streak, longest_streak, total_quests, points.
- **achievements** — user_id, type (e.g. `streak_7`), unlock date. The pair (`user_id` + `type`) is unique — an achievement is granted once. **Rows here are permanent: a streak reset NEVER deletes them** (see section 6).
- **chat_messages** — id, user_id, content, timestamp.

### 3.4 External services

- **GitHub OAuth + REST API** — sign-in and repo reading.
- **AI model** — quest generation and evaluation (requires an API key and incurs a cost for every call).

---

## 4. AI logic — two jobs

The AI does two different things. It's worth separating them.

### 4.1 Quest generation

Input: the player's profile (languages, project types, the "already done" list).
Output (structured, e.g. JSON):

- `description` — what to do,
- `repo_name` — the dictated name,
- `criteria` — a list of measurable requirements (e.g. "at least 1 `.rs` file", "a README describing usage", "a working example"),
- `why_new` — why this is new for this particular user.

Rule: the quest must be something the user **does not have** in their profile (a different language / a different project type / a new technique).

### 4.2 Completion evaluation

Layered verification — from a cheap gate to AI judgment:

**Step 1 — hard gate (code, no AI, zero cost):**

- the repo `github.com/<user>/<name>` exists and is public,
- it is not a fork,
- `created_at` is from the quest's day (the repo couldn't have existed earlier — only the system knew the name),
- it has more than just an empty README.

If the gate fails → immediately "not passed", with no AI call.

**Step 2 — AI evaluation (content):**
The AI receives: the quest text + the criteria + the file list + the README contents + (optionally) code snippets/commits. It returns:

- `passed: true/false` (threshold = 100/100, i.e. all criteria met),
- `missing: [...]` — the specific gaps on rejection,
- `work_description` — a one-sentence "what the user built" (it ends up on the heatmap),
- `reasoning`.

Anti-cheat rule: the AI evaluates the **files and code**, not the README's claims alone. The README is a promise to be verified, not proof.

**Step 3 — newness check:**
The AI compares the repo against the profile. If it's a repeat of something the user has already done → not passed, even with good code.

---

## 5. Streak and heatmap mechanics

- **Data source:** the `completions` table — one entry = one completed quest on a given day.
- **Heatmap:** a grid of weeks × days (Mon–Sun), like a GitHub profile. Green intensity = activity (with 1 quest per day it's simply "did / didn't").
- **Hover:** a tooltip with the date + that day's `work_description` ("Built a CLI for converting CSV in Go").
- **current_streak:** the number of consecutive days with a completed quest up to today.
- **longest_streak:** the record.
- **Reset:** if a day passes without a completion → the streak drops. (Whether to zero, or whether there's a "freeze" — see open questions.)
- **The midnight time zone** affects when a day "ends" — it must be consistent with the streak (see open questions).

---

## 6. Leaderboard and stats

- **Global leaderboard:** sorted by a chosen metric — e.g. current_streak, then total_quests as a tiebreaker.
- **Player stats:** current/longest streak, total completed quests, points, the list of "unlocked" technologies (it grows with every new project type).
- **Points (to be decided):** e.g. a flat amount per quest + a streak bonus. Can be finalized later.

### 6a. Achievements (badges)

**Key rule: achievements are permanent. Resetting the streak to zero does NOT delete them.** This separates two different things:

- `stats.current_streak` — the current value; it rises and falls (reset → 0).
- `achievements` — a record of a past fact ("you once reached 7 days"). Once granted, it stays forever.

Granting mechanics (checked at the moment a quest is completed):

1. Quest passed → `current_streak` grows.
2. The code checks the achievement thresholds (7, 30, 100 days, etc.).
3. If a threshold is reached **and** the user doesn't have this badge yet (no `user_id` + `type` row) → insert a row into `achievements`.
4. If they already have the badge → do nothing (no duplicates — hence the uniqueness of the `user_id` + `type` pair).

Effect of the rule: after a streak resets to zero and climbs back to 7 days, the `streak_7` badge **is not granted a second time** — the user already has it. Badges don't renew and don't disappear.

**Starting achievement list (to be finalized):**

- `streak_7` — 7 days in a row
- `streak_30` — 30 days in a row
- `streak_100` — 100 days in a row
- `quests_10` — 10 completed quests total
- `quests_50` — 50 completed quests total
- `first_quest` — the first completed quest
- `new_language` — the first quest in a new, previously unused language

Adding a new achievement later = adding one rule in the code, with no database schema change.

---

## 7. Live chat

- A shared room for everyone who's signed in.
- Real-time communication via **Pusher** (it keeps a persistent connection and only pushes a message when one appears). Not polling — that would hammer the database non-stop.
- Messages stored in `chat_messages` in Neon (history on entry).
- Each message: avatar + GitHub name + content + time.
- To think about: moderation / length limit / rate limit (spam).

---

## 8. What this means technically (important)

This feature set **requires a real backend and database** — it can't be a static page or frontend-only. Reasons:

- OAuth requires a server (the app secret can't be in the browser),
- live chat requires a realtime service (Pusher), because Vercel doesn't hold persistent connections,
- the midnight reset requires a server-side scheduled job,
- the leaderboard, profiles, and streaks require a persistent database,
- the AI key must be server-side (not in the browser).

The technology stack that delivers all of this is described in section 9c.

---

## 9. Technical decisions (agreed)

1. **AI model:** OpenAI (key server-side).
2. **Midnight time zone:** CET (UTC+1). The quest reset and streak counting are based on Central European midnight — one global zone for all players.
3. **Hosting:** Vercel.
4. **Streak reset:** a missed day → the streak drops to zero. No "freeze".
5. **Database:** Neon (serverless Postgres) — because it runs 24/7 for free without putting the project to sleep.
6. **Live chat:** Pusher — true realtime, protects Neon's limits (it touches the database only on a real message).

## 9b. Still-open questions (can be finalized along the way)

1. **OAuth permission scope:** read-only access to public repos + profile data. The `read:user` scope (or `public_profile`) is enough to fetch, at sign-in, from the `/user` endpoint: the profile picture (`avatar_url`), the name (`login` as the `@name` handle and optionally `name`), and the profile link (`html_url`). We store all three in the `users` table and display them everywhere a player appears — in chat, the leaderboard, and on the profile. The avatar and name are clickable and lead to the user's GitHub profile (opened in a new tab).

   **Display style (like a GitHub profile):** a round avatar, beneath it the `name` (first and last name) in a large, bold font as the primary name, and below that the `login` (`@handle`) in smaller, gray text as a caption. If the user hasn't set a `name`, the primary name becomes the `login` (and the caption isn't duplicated).

2. **Leaderboard points:** at the start "streak + quest count"; a separate points system optionally later.
3. **Chat moderation:** for later (at the start just a length limit + an anti-spam rate limit).
4. **First quest for a user with no public repos at all:** a "warm-up" starter quest is needed when there's nothing to scan.

---

## 9c. Technology stack (tailored to Vercel + OpenAI)

Vercel hosts the frontend and serverless functions beautifully, but it has one limitation: **it doesn't hold long, persistent connections** (which is exactly what a classic WebSocket chat needs). That's why we do chat through an external realtime service. Everything else falls into place naturally.

- **Framework:** Next.js (App Router) — frontend + API routes in one, natively supported by Vercel.
- **Sign-in:** NextAuth (Auth.js) with the GitHub provider — ready-made OAuth handling, the secret kept safely server-side.
- **Database:** Neon (serverless Postgres) — persistence for users, quests, completions, stats, and chat. Chosen over Supabase because it scales to zero on every plan (it doesn't sleep the project after 7 days) → free 24/7 operation with no manual waking. At worst, the first query after a pause has a cold start of ~0.5–2s.
- **AI:** the OpenAI API called from server-side API routes (the key never reaches the browser). Responses in structured (JSON) mode — both for quest generation and for evaluation.
- **Midnight reset (CET):** Vercel Cron Jobs — a scheduled job daily at 00:00 CET that closes yesterday's quests, updates streaks (drop to zero on no completion), and generates new ones.
- **Live chat:** Pusher (or Ably) — a realtime service that keeps a persistent connection and only pushes a message when something appears (zero empty pings). Messages are stored in `chat_messages` in Neon; Pusher fans them out live to everyone. Chosen over polling, because polling would hammer the database every few seconds even during silence — burning through Neon's limits and breaking its scale-to-zero. Pusher touches the database only on a real message.
- **GitHub styling:** Tailwind CSS + a palette and components modeled on GitHub (dark theme, heatmap greens).

A note on cost: every quest generation and every evaluation is a paid OpenAI call. The hard gate (checking the repo without AI) deliberately filters out attempts **before** the model is called, so we don't pay for obvious rejections.

---

## 9d. Costs and free tiers

Goal: the only fixed cost is the OpenAI key. That's realistic at the learning stage; a public 24/7 launch adds small infrastructure costs. Two phases:

### Phase 1 — learning and private testing (goal: OpenAI only)

- **Vercel** — the hobby plan is free (for non-commercial use). Fully sufficient.
- **Neon** — free plan: about 0.5 GB storage per project (across a few projects), 100 CU-hours/month of compute, unlimited branches, autoscaling. Scales to zero without sleeping the project → runs 24/7 with no manual waking. Plenty for tables, streaks, and the leaderboard.
- **Pusher** — free plan (on the order of 200 concurrent connections, ~200k messages/day) — plenty for chat at the learning stage and a small public app.
- **OpenAI** — the only real cost. Note: OpenAI **has no free tier** — you pay from the first call, billed per token (the amount of text in the request + response). The amounts are small (fractions of a cent per request with the cheaper models), but it's a cost from day one. Every quest generation and every evaluation = a separate call. The hard gate limits the number of paid calls.

Conclusion: at this stage "the only paid thing is OpenAI" is true.

### Phase 2 — a public 24/7 app (when/if)

- **Neon — no sleep catch:** unlike Supabase, Neon doesn't put an offline project to sleep. A public 24/7 app runs on free Neon with no pinging workaround. Cost appears only with real traffic growth (exceeding 100 CU-hours or 0.5 GB).
- **Pusher** — with more users it may exceed the free connection/message limit → then a paid plan.
- **Vercel hobby** — officially for non-commercial use; if the app starts earning, you have to move to a paid plan.
- **OpenAI** — cost grows linearly with the number of users and quests (more calls = more tokens).

Conclusion: the Phase 2 cost decision is deferred until a public launch becomes real. Nothing here blocks building at the start.

_(Pricing figures current as of June 2026 — before production it's worth checking neon.tech/pricing and pusher.com/pricing, since rates do get updated.)_

---

## 10. Suggested build order

1. The GitHub-style UI skeleton (static, mock data) — to see the look and the flow.
2. GitHub OAuth + session.
3. Repo scanning and profile building.
4. Quest generation (AI).
5. Quest verification (gate + AI).
6. Streak, heatmap, stats.
7. Leaderboard.
8. Live chat (Pusher + Neon).
9. Midnight-reset scheduler.
10. Polish: moderation, points, edge cases.
