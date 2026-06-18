<div align="center">

# 🧙‍♂️ NERD — New Every Day Repo

**An AI mentor that hands you one ambitious coding project every single day — then actually checks whether you built it.**

Sign in with GitHub, and the AI reads your public repos to learn what you already know. Every day it invents a _new_ quest in a language or domain you **haven't** touched yet — something that looks like a week of work but is doable in one focused day. You build it, push it, and submit it. The AI grades every requirement and only passes you at **100/100**. Keep the streak alive. 🔥

### [▶ Launch the app → newrepoeveryday.vercel.app](https://newrepoeveryday.vercel.app)

<sub>No install. No clone. Just sign in with GitHub and generate your first quest.</sub>

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?logo=tailwindcss&logoColor=white)
![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-00E599?logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-grading_engine-412991?logo=openai&logoColor=white)
![Hosted on Vercel](https://img.shields.io/badge/Hosted_on-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## 🎯 What is NERD?

NERD turns "I should build more side projects" into a **daily ritual with stakes**.

Most learning apps give everyone the same exercises. NERD is different: it looks at _your_ GitHub history and deliberately pushes you **outside** it. Only ever shipped web apps in JavaScript? It might hand you a Rust CLI, a Go concurrency puzzle, or a parser in a language you've never written. The point is **deliberate discomfort** — you grow by building the thing you'd normally avoid.

And there's no cheating your way through it:

- 🎲 **The AI names the project for you** when it generates the quest, so you can't quietly swap in an old repo.
- 🔍 **The AI reads your actual code**, not just your README's promises. Every completion criterion is checked one by one.
- 💯 **It's all‑or‑nothing.** You pass at 100/100 or you get a precise list of what's still missing — then you fix it and resubmit.
- 🔥 **One quest per day.** Miss a day and your streak resets. The pressure is the feature.

> 💡 NERD is styled to feel like GitHub itself — dark theme, the familiar green contribution heatmap, the same typography — so the whole loop feels like a natural extension of your dev life.

---

## 🔁 The daily loop

```
   ┌──────────────────────────────────────────────────────────────┐
   │  1. Sign in with GitHub                                        │
   │  2. Generate today's quest  ──►  AI reads your profile,        │
   │                                  invents something new for you │
   │  3. Read the brief (QUEST.md) in your container repo           │
   │  4. Build it & push your code to the quest folder              │
   │  5. Submit for evaluation   ──►  AI grades every criterion     │
   │        ├─ Passed 100/100  ──►  🔥 streak +1, points, heatmap   │
   │        └─ Not yet         ──►  fix what's missing, resubmit    │
   │  6. Quest resets at midnight CET — come back tomorrow          │
   └──────────────────────────────────────────────────────────────┘
```

---

## 🚀 How to use it (step by step)

Everything happens on the website — **[newrepoeveryday.vercel.app](https://newrepoeveryday.vercel.app)**. There is nothing to download.

### 1. Sign in with GitHub

Click **“Sign in with GitHub”**. NERD only needs to **read your public profile and repositories** — it uses your GitHub username as your identity across the leaderboard, profile, and chat. On your first sign‑in, the AI scans your public repos to build a picture of the languages and project types you already use.

### 2. Generate today's quest

On the dashboard, hit **“Generate today's quest.”** Behind the scenes NERD will:

- ask the AI for a fresh, multi‑layered project tailored to push you beyond your comfort zone,
- make sure your personal **container repo** exists on GitHub (created automatically, public — see below),
- create a new **subfolder** for the quest and drop a `QUEST.md` brief inside it.

You'll see the quest title, the folder name, and two buttons: **Open quest folder ↗** and **View QUEST.md ↗**.

> ⏳ You get **exactly one quest per day** (resets at midnight **CET**). A live countdown on the card shows when the next one unlocks.

### 3. Read the brief

Open **`QUEST.md`**. Every brief is structured the same way:

| Section                 | What it is                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Why this task**       | Why the AI picked _this_ for _you_ — what it's stretching.                                                                   |
| **Instructions**        | The project itself, broken into modules/stages — what to build and how to structure it (layers, components, error handling). |
| **Add your own twist**  | An optional, ambitious extension for when you want to go further.                                                            |
| **Completion criteria** | A concrete, measurable checklist (6–10 items) — this is exactly what gets graded.                                            |
| **README (required)**   | Every quest must ship a `README.md` written **in English** describing what you built, how to run it, and what you used.      |

### 4. Build it & push

Solve the quest **inside its folder** in your container repo. Use whatever editor and workflow you like — just make sure your code lands in that folder on GitHub and the repo stays **public** (the AI can't read a private repo). The `QUEST.md` file is treated as the starting brief, not as your work — only the files _you_ add count.

### 5. Submit for evaluation

Back on the dashboard, click **“Submit for evaluation.”** NERD reads the files in your quest folder and the AI checks **each criterion separately**, citing the specific file/code that satisfies it.

- ✅ **Passed (100/100)** → the quest is marked complete, your streak ticks up, points and (where earned) achievements are awarded, and the day lights up on your heatmap.
- 🔧 **Not yet** → you get a bullet list of exactly what's missing. Fix the repo and **submit again**.

> 🛡️ To keep things fair there's a short **cooldown (~30s)** between evaluation attempts, and a folder containing only `QUEST.md` (no actual work) is rejected instantly without bothering the AI.

### 6. Keep the streak alive

Come back every day. A completed quest extends your 🔥 streak; a missed day resets it. Your longest streak, total quests, and points all live on your public profile and the leaderboard.

---

## 📦 Your container repo

NERD doesn't litter your GitHub with a new repository per quest. Instead it creates **one** public repo — **`NERD-NewEveryDayRepo`** — and every quest becomes a **subfolder** inside it (e.g. `NERD-rust-wasm/`, `NERD-go-scheduler/`).

Its `README.md` is an **auto‑generated index** that NERD rebuilds every time you add or pass a quest:

| Status | Quest                          | Description                                                                                                                                   | Stack                               | Folder              |
| :----: | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------- |
|   ✅   | Concurrent log aggregator      | A multi-module CLI that ingests log files, parses them concurrently with a worker pool, and emits JSON reports with error handling and tests. | Rust                                | [NERD-rust-logs](#) |
|   ✅   | Mini task scheduler API        | A small HTTP service that reads cron-like job definitions, validates them, queues and runs jobs, and exposes status endpoints.                | Next.js, React, Node.js, TypeScript | [NERD-job-api](#)   |
|   ⏳   | Markdown static-site generator | …                                                                                                                                             | —                                   | [NERD-ssg](#)       |

The **Stack** column is detected automatically from the files you push (languages by extension, plus frameworks/runtime read from your `package.json` — Next.js, React, Express, Node.js, …). A brand‑new, not‑yet‑started quest simply shows `—`.

---

## 🏆 Progress, stats & rewards

| Feature                     | What you get                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 🔥 **Streak**               | Consecutive days with a completed quest. Resets at midnight CET if you miss a day.                                                        |
| 🟩 **Contribution heatmap** | A GitHub‑style calendar on your profile — hover a day to see what you built.                                                              |
| ⭐ **Points**               | `100 + 10 × current streak` per passed quest, so streaks compound.                                                                        |
| 🥇 **Leaderboard**          | Global ranking by current streak (tie‑breakers: total quests, then points).                                                               |
| 🎖️ **Achievements**         | Permanent badges — `first_quest`, `streak_7 / 30 / 100`, `quests_10 / 50`. Once earned, they never disappear, even if your streak resets. |
| 👤 **Public profile**       | Your stats, heatmap, and quest history live at `newrepoeveryday.vercel.app/profile/<your-github-login>`.                                  |
| 💬 **Live chat**            | A shared room for everyone — _currently a local preview; realtime is on the roadmap._                                                     |

---

## 📜 The rules, in one place

- **One quest per day**, reset at **midnight CET** (Europe/Warsaw).
- **Pass = 100/100.** No partial credit — meet every criterion (plus the required English `README.md`).
- **Your repo must be public** for the whole time — the AI reads the code directly.
- **The folder name is dictated by the AI**, so you can't substitute pre‑existing work.
- **~30‑second cooldown** between evaluation attempts.

---

## 🧩 Under the hood

You don't need any of this to _use_ NERD — it's a hosted app, so just open the site. But for the curious:

- **Next.js 14 (App Router)** — UI and server‑side API routes in one, on **Vercel**.
- **NextAuth (Auth.js)** with the **GitHub** provider — OAuth handled server‑side; the token never reaches the browser.
- **Neon (serverless Postgres)** via **Prisma** — users, quests, completions, stats, achievements.
- **OpenAI** — two distinct jobs, both server‑side and in structured‑JSON mode: **generating** quests from your profile and **grading** submissions criterion‑by‑criterion.
- **GitHub REST API** — creating your container repo, writing `QUEST.md`, and reading your submitted code.
- **Tailwind CSS** — the GitHub‑flavored dark theme and contribution‑green palette.
- **Vercel Cron** — the daily midnight rollover that closes out the day and updates streaks.

The original design rationale lives in [`architecture-plan.md`](./architecture-plan.md).

---

<div align="center">

**Ready to be uncomfortable?**

### [Start your first quest → newrepoeveryday.vercel.app](https://newrepoeveryday.vercel.app)

<sub>Build something new. Every. Single. Day.</sub>

</div>
