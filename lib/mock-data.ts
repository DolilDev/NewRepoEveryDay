// ---------------------------------------------------------------------------
// DailyQuest — tymczasowy stub czatu.
//
// Po Kroku C wszystkie dane gracza (profil, statystyki, questy, repozytoria,
// ranking, kalendarz ukończeń, osiągnięcia) pochodzą z bazy (Prisma/Neon).
// Ten plik trzyma już WYŁĄCZNIE zaślepkę czatu: kilka przykładowych wiadomości
// do wspólnego pokoju, dopóki nie podłączymy realtime (Pusher) i tabeli
// chat_messages. Nie ma tu żadnych danych pojedynczego gracza.
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  authorName: string;
  authorLogin: string;
  content: string;
  time: string; // HH:MM
}

export const chatMessages: ChatMessage[] = [
  { id: "m1", authorName: "Zofia Wójcik", authorLogin: "zojka", content: "Dzień dobry! Kto już ogarnął dzisiejszy quest? 👀", time: "08:41" },
  { id: "m2", authorName: "Sam Carter", authorLogin: "samc", content: "Rust CLI... pierwszy raz dotykam cargo, życzcie mi szczęścia 😅", time: "08:43" },
  { id: "m3", authorName: "Marek Lewandowski", authorLogin: "mlewy", content: "@samc clap crate załatwia parsowanie argów w 5 minut, polecam", time: "08:47" },
  { id: "m4", authorName: "Aisha Khan", authorLogin: "aishak", content: "Zrobiłam wordcount, czyta z stdin i z pliku. README gotowe ✅", time: "09:02" },
  { id: "m5", authorName: "Hiro Tanaka", authorLogin: "hiro_t", content: "borrow checker mnie dziś pokonał ze 3 razy zanim się skompilowało 🦀", time: "09:15" },
  { id: "m6", authorName: "Olena Kovalenko", authorLogin: "olenak", content: "haha klasyk. ale jak już przejdzie to działa idealnie", time: "09:16" },
  { id: "m7", authorName: "Mateusz Dolny", authorLogin: "dolil", content: "Robię konwerter CSV→JSON. cargo build przeszło za pierwszym razem 🎉", time: "09:31" },
  { id: "m8", authorName: "Lukas Müller", authorLogin: "lmueller", content: "Nice @dolil! Wrzuć link jak skończysz, zerknę", time: "09:33" },
  { id: "m9", authorName: "Priya Nair", authorLogin: "priyan", content: "ktoś wie czy enum z match liczy się jako 'idiomatyczny rust' dla AI? 🤔", time: "09:40" },
  { id: "m10", authorName: "Zofia Wójcik", authorLogin: "zojka", content: "@priyan ocena patrzy na kryteria z questa, nie na styl. liczy się że działa", time: "09:42" },
  { id: "m11", authorName: "Tomáš Novák", authorLogin: "tnovak", content: "mój 3. dzień z rzędu, idziemy po siódemkę 🔥", time: "10:05" },
  { id: "m12", authorName: "Aisha Khan", authorLogin: "aishak", content: "Zaliczone! 100/100 za pierwszym podejściem 💪", time: "10:11" },
  { id: "m13", authorName: "Marek Lewandowski", authorLogin: "mlewy", content: "gratki 🎊 jutro pewnie dadzą nam coś z WebAssembly...", time: "10:14" },
  { id: "m14", authorName: "Hiro Tanaka", authorLogin: "hiro_t", content: "oby nie, dopiero co ogarnąłem ten borrow checker 😭", time: "10:16" },
];
