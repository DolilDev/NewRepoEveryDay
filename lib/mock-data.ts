// ---------------------------------------------------------------------------
// DailyQuest — temporary chat stub.
//
// After Step C, all player data (profile, stats, quests, repositories,
// leaderboard, completions calendar, achievements) comes from the database
// (Prisma/Neon). This file now holds ONLY a chat stub: a few sample messages
// for the shared room, until we wire up realtime (Pusher) and the
// chat_messages table. There is no individual player data here.
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  authorName: string;
  authorLogin: string;
  content: string;
  time: string; // HH:MM
}

export const chatMessages: ChatMessage[] = [
  {
    id: "m1",
    authorName: "Zofia Wójcik",
    authorLogin: "zojka",
    content: "Good morning! Who's already cracked today's quest? 👀",
    time: "08:41",
  },
  {
    id: "m2",
    authorName: "Sam Carter",
    authorLogin: "samc",
    content: "Rust CLI... first time touching cargo, wish me luck 😅",
    time: "08:43",
  },
  {
    id: "m3",
    authorName: "Marek Lewandowski",
    authorLogin: "mlewy",
    content: "@samc the clap crate handles arg parsing in 5 minutes, highly recommend",
    time: "08:47",
  },
  {
    id: "m4",
    authorName: "Aisha Khan",
    authorLogin: "aishak",
    content: "Did the wordcount, it reads from stdin and from a file. README's ready ✅",
    time: "09:02",
  },
  {
    id: "m5",
    authorName: "Hiro Tanaka",
    authorLogin: "hiro_t",
    content: "the borrow checker beat me like 3 times today before it compiled 🦀",
    time: "09:15",
  },
  {
    id: "m6",
    authorName: "Olena Kovalenko",
    authorLogin: "olenak",
    content: "haha classic. but once it passes it works perfectly",
    time: "09:16",
  },
  {
    id: "m7",
    authorName: "Mateusz Dolny",
    authorLogin: "dolil",
    content: "Building a CSV→JSON converter. cargo build passed on the first try 🎉",
    time: "09:31",
  },
  {
    id: "m8",
    authorName: "Lukas Müller",
    authorLogin: "lmueller",
    content: "Nice @dolil! Drop a link when you're done, I'll take a look",
    time: "09:33",
  },
  {
    id: "m9",
    authorName: "Priya Nair",
    authorLogin: "priyan",
    content:
      "anyone know if an enum with match counts as 'idiomatic rust' for the AI? 🤔",
    time: "09:40",
  },
  {
    id: "m10",
    authorName: "Zofia Wójcik",
    authorLogin: "zojka",
    content:
      "@priyan the evaluation looks at the quest criteria, not at style. what matters is that it works",
    time: "09:42",
  },
  {
    id: "m11",
    authorName: "Tomáš Novák",
    authorLogin: "tnovak",
    content: "my 3rd day in a row, going for the seven-day streak 🔥",
    time: "10:05",
  },
  {
    id: "m12",
    authorName: "Aisha Khan",
    authorLogin: "aishak",
    content: "Passed! 100/100 on the first attempt 💪",
    time: "10:11",
  },
  {
    id: "m13",
    authorName: "Marek Lewandowski",
    authorLogin: "mlewy",
    content:
      "congrats 🎊 tomorrow they'll probably give us something with WebAssembly...",
    time: "10:14",
  },
  {
    id: "m14",
    authorName: "Hiro Tanaka",
    authorLogin: "hiro_t",
    content: "I hope not, I just got the hang of this borrow checker 😭",
    time: "10:16",
  },
];
