# DailyQuest — plan architektury

Aplikacja w stylu GitHuba: logujesz się przez GitHub, AI skanuje Twoje publiczne repozytoria, codziennie wymyśla Ci quest „zrób coś, czego jeszcze nie robiłeś", a Ty go realizujesz tworząc nowe repo. Quest resetuje się o północy. Jest czat na żywo dla wszystkich, ranking i statystyki gracza ze streak-heatmapą jak na profilu GitHuba.

Ten dokument to plan — uzgodniona wizja, na podstawie której budujemy. Nie ma tu jeszcze kodu.

---

## 1. Decyzje uzgodnione

Te punkty są przesądzone i to one kształtują całą architekturę.

1. **Logowanie wyłącznie przez GitHub OAuth.** Brak innych metod. Username z OAuth jest tożsamością gracza w całym systemie.
2. **Weryfikacja questa: AI ocenia, ale werdykt jest binarny — 100/100 albo nic.** Nie ma częściowego zaliczenia. Przy odrzuceniu user dostaje konkretną listę braków, żeby wiedział co dokończyć.
3. **AI samo narzuca nazwę repo przy generowaniu questa.** Dzięki temu link do weryfikacji składa się automatycznie z `username` (z OAuth) + narzuconej nazwy. To zamyka oszustwo „podstaw stare repo".
4. **Wymóg: repo musi być publiczne.** Bez tego AI nie ma jak go przeczytać.
5. **Heatmapa-streak liczy ukończone questy** (nie commity z GitHuba). Po najechaniu na dzień pokazuje krótki opis tego, co tego dnia stworzono.
6. **Reset o północy.** (Do dogracia: strefa czasowa — patrz pytania otwarte.)
7. **Wygląd: jak GitHub.** Ciemny motyw, ta sama paleta zieleni co kalendarz commitów, typografia i komponenty w stylu GitHuba.

---

## 2. Przepływ użytkownika (happy path)

1. User wchodzi na stronę → ekran logowania w stylu GitHuba → „Sign in with GitHub".
2. OAuth: zgoda na odczyt publicznych danych (`read:user`, `public_repo` do odczytu).
3. Pierwsze logowanie: AI skanuje publiczne repo usera → buduje **profil** (jakich języków używa, jakie typy projektów robił, czego NIE robił). To baza do oceny „nowości".
4. System pokazuje **questa na dziś**: opis zadania + **narzucona nazwa repo** + kryteria zaliczenia.
5. User realizuje quest: tworzy publiczne repo o tej nazwie i buduje to, czego wymaga quest.
6. User klika **„Zrobione"**.
7. Backend składa link `github.com/<username>/<nazwa-repo>` → pobiera zawartość przez GitHub API → AI ocenia.
8. Werdykt:
   - **Zaliczone (100/100):** streak +1, dzień zapala się na heatmapie z opisem, punkty do rankingu, nowy projekt dopisany do profilu.
   - **Niezaliczone:** lista braków, user poprawia repo i klika ponownie.
9. O północy: quest się resetuje. Jeśli wczorajszy nie był ukończony → streak spada (zasada do dogracia).

---

## 3. Komponenty systemu

System ma cztery warstwy: frontend, backend (API), baza danych i usługi zewnętrzne.

### 3.1 Frontend
Interfejs w stylu GitHuba. Główne widoki:
- **Logowanie** — pojedynczy przycisk OAuth.
- **Dashboard / quest na dziś** — karta questa, nazwa repo, kryteria, przycisk „Zrobione", odliczanie do północy.
- **Profil gracza** — statystyki, streak-heatmapa (kalendarz jak na GitHubie), historia ukończonych questów.
- **Ranking** — tabela liderów (streak, łączna liczba questów, punkty).
- **Czat na żywo** — wspólny dla wszystkich zalogowanych.

### 3.2 Backend (API + logika)
- Obsługa OAuth (wymiana code → token, sesja).
- Skanowanie repo i budowa profilu.
- Generowanie questa (wywołanie AI).
- Weryfikacja questa (GitHub API + AI).
- Scheduler resetu o północy (cron / zaplanowane zadanie).
- Obsługa czatu (WebSocket).
- Wyliczanie rankingu i statystyk.

### 3.3 Baza danych
Trwałe przechowywanie. Tabele (szkic):
- **users** — id, github_login (handle `@nazwa`), github_name (imię/nazwisko, jeśli ustawione), avatar_url (zdjęcie profilowe), profile_url (`html_url`, link do profilu na GitHubie), data dołączenia, token (zaszyfrowany).
- **profiles** — dla każdego usera: lista języków, typów projektów, „czego jeszcze nie robił" (aktualizowane po każdym zaliczeniu).
- **quests** — id, user_id, data, opis, narzucona nazwa repo, kryteria, status (oczekuje/zaliczony/niezaliczony), opis wykonanego dzieła (do heatmapy).
- **completions** — dziennik ukończeń (user_id, data, quest_id, link do repo) → źródło danych dla heatmapy i streaka.
- **stats** — user_id, current_streak, longest_streak, total_quests, punkty.
- **achievements** — user_id, typ (np. `streak_7`), data_odblokowania. Para (`user_id` + `typ`) jest unikalna — osiągnięcie przyznawane raz. **Wiersze tu są trwałe: reset streaka NIGDY ich nie kasuje** (patrz sekcja 6).
- **chat_messages** — id, user_id, treść, timestamp.

### 3.4 Usługi zewnętrzne
- **GitHub OAuth + REST API** — logowanie i odczyt repo.
- **Model AI** — generowanie questów i ocena (wymaga klucza API i wiąże się z kosztem za każde wywołanie).

---

## 4. Logika AI — dwa zadania

AI robi dwie różne rzeczy. Warto je rozdzielić.

### 4.1 Generowanie questa
Wejście: profil gracza (języki, typy projektów, lista „już zrobione").
Wyjście (ustrukturyzowane, np. JSON):
- `opis` — co zrobić,
- `nazwa_repo` — narzucona nazwa,
- `kryteria` — lista wymagań mierzalnych (np. „min. 1 plik .rs", „README opisujący użycie", „działający przykład"),
- `dlaczego_nowe` — czemu to jest dla tego usera nowość.

Zasada: quest musi być czymś, czego user **nie ma** w profilu (inny język / inny typ projektu / nowa technika).

### 4.2 Ocena ukończenia
Weryfikacja warstwowa — od taniej bramki do oceny AI:

**Krok 1 — bramka twarda (kod, bez AI, zero kosztu):**
- repo `github.com/<user>/<nazwa>` istnieje i jest publiczne,
- nie jest forkiem,
- `created_at` z dnia questa (repo nie mogło powstać wcześniej — nazwę znał tylko system),
- ma więcej niż sam pusty README.

Jeśli bramka nie przejdzie → od razu „niezaliczone", bez wywołania AI.

**Krok 2 — ocena AI (treść):**
AI dostaje: treść questa + kryteria + listę plików + treść README + (opcjonalnie) fragmenty kodu/commity. Zwraca:
- `zaliczone: true/false` (próg = 100/100, czyli wszystkie kryteria spełnione),
- `brakuje: [...]` — konkretne braki przy odrzuceniu,
- `opis_dziela` — jedno zdanie „co user stworzył" (ląduje na heatmapie),
- `uzasadnienie`.

Zasada anty-oszustwo: AI ocenia **pliki i kod**, nie samą deklarację z README. README to obietnica do zweryfikowania, nie dowód.

**Krok 3 — kontrola nowości:**
AI porównuje repo z profilem. Jeśli to powtórka czegoś, co user już robił → niezaliczone, nawet przy dobrym kodzie.

---

## 5. Mechanika streaka i heatmapy

- **Źródło danych:** tabela `completions` — jeden wpis = jeden ukończony quest danego dnia.
- **Heatmapa:** siatka tygodni × dni (Mon–Sun), jak na profilu GitHuba. Intensywność zieleni = aktywność (przy 1 queście dziennie to po prostu „był / nie był").
- **Hover:** tooltip z datą + `opis_dziela` z tego dnia („Zbudował CLI do konwersji CSV w Go").
- **current_streak:** liczba kolejnych dni z ukończonym questem do dziś.
- **longest_streak:** rekord.
- **Zerowanie:** jeśli dzień minie bez ukończenia → streak spada. (Czy do zera, czy jest „zamrożenie" — patrz pytania otwarte.)
- **Strefa czasowa północy** wpływa na to, kiedy dzień się „kończy" — musi być spójna ze streakiem (patrz pytania otwarte).

---

## 6. Ranking i statystyki

- **Ranking globalny:** sortowanie po wybranej metryce — np. current_streak, potem total_quests jako rozstrzygnięcie.
- **Statystyki gracza:** current/longest streak, łączna liczba ukończonych questów, punkty, lista technologii „odblokowanych" (rośnie z każdym nowym typem projektu).
- **Punkty (do ustalenia):** np. stała za quest + bonus za streak. Można dograć później.

### 6a. Osiągnięcia (odznaki)

**Kluczowa zasada: osiągnięcia są trwałe. Reset streaka do zera ich NIE kasuje.** To rozdzielenie dwóch różnych rzeczy:
- `stats.current_streak` — wartość bieżąca, rośnie i spada (reset → 0).
- `achievements` — zapis faktu z przeszłości („kiedyś osiągnąłeś 7 dni"). Raz przyznane, zostaje na zawsze.

Mechanika przyznawania (sprawdzana w momencie ukończenia questa):
1. Quest zaliczony → `current_streak` rośnie.
2. Kod sprawdza progi osiągnięć (7, 30, 100 dni itd.).
3. Jeśli próg osiągnięty **i** user nie ma jeszcze tej odznaki (brak wiersza `user_id` + `typ`) → dopisz wiersz do `achievements`.
4. Jeśli odznakę już ma → nic nie rób (nie dublujemy — stąd unikalność pary `user_id` + `typ`).

Skutek zasady: po resecie streaka do zera i ponownym dobiciu do 7 dni odznaka `streak_7` **nie jest przyznawana drugi raz** — user już ją ma. Odznaki się nie odnawiają i nie znikają.

**Startowa lista osiągnięć (do dograć):**
- `streak_7` — 7 dni z rzędu
- `streak_30` — 30 dni z rzędu
- `streak_100` — 100 dni z rzędu
- `quests_10` — 10 ukończonych questów łącznie
- `quests_50` — 50 ukończonych questów łącznie
- `first_quest` — pierwszy ukończony quest
- `new_language` — pierwszy quest w nowym, nieużywanym wcześniej języku

Dodanie nowego osiągnięcia później = dopisanie jednej reguły w kodzie, bez zmiany struktury bazy.

---

## 7. Czat na żywo

- Wspólny pokój dla wszystkich zalogowanych.
- Komunikacja w czasie rzeczywistym przez **Pusher** (utrzymuje stałe połączenie, wysyła wiadomość dopiero gdy się pojawi). Nie polling — ten waliłby w bazę bez przerwy.
- Wiadomości zapisywane w `chat_messages` w Neon (historia po wejściu).
- Każda wiadomość: avatar + nazwa z GitHuba + treść + czas.
- Do przemyślenia: moderacja / limit długości / rate-limit (spam).

---

## 8. Co to oznacza technicznie (ważne)

Ten zestaw funkcji **wymaga prawdziwego backendu i bazy** — to nie może być statyczna strona ani sam frontend. Powody:
- OAuth wymaga serwera (sekret aplikacji nie może być w przeglądarce),
- czat na żywo wymaga usługi realtime (Pusher), bo Vercel nie utrzymuje stałych połączeń,
- reset o północy wymaga zaplanowanego zadania po stronie serwera,
- ranking, profile i streaki wymagają trwałej bazy danych,
- klucz do AI musi być po stronie serwera (nie w przeglądarce).

Stos technologiczny realizujący to wszystko jest opisany w sekcji 9c.

---

## 9. Decyzje techniczne (uzgodnione)

1. **Model AI:** OpenAI (klucz po stronie serwera).
2. **Strefa czasowa północy:** CET (UTC+1). Reset questa i liczenie streaka odnoszą się do północy czasu środkowoeuropejskiego — jedna globalna strefa dla wszystkich graczy.
3. **Hosting:** Vercel.
4. **Zerowanie streaka:** pominięty dzień → streak spada do zera. Bez „zamrożenia".
5. **Baza danych:** Neon (serverless Postgres) — bo działa 24/7 za darmo bez usypiania projektu.
6. **Czat na żywo:** Pusher — prawdziwy realtime, chroni limity Neon (dotyka bazy tylko przy realnej wiadomości).

## 9b. Pytania wciąż otwarte (można dograć w trakcie)

1. **Zakres uprawnień OAuth:** tylko odczyt publicznych repo + dane profilu. Zakres `read:user` (lub `public_profile`) wystarcza, by przy logowaniu pobrać z endpointu `/user`: zdjęcie profilowe (`avatar_url`), nazwę (`login` jako handle `@nazwa` i opcjonalnie `name`) oraz link do profilu (`html_url`). Wszystkie trzy zapisujemy w tabeli `users` i wyświetlamy wszędzie, gdzie pojawia się gracz — w czacie, rankingu i na profilu. Avatar i nazwa są klikalne i prowadzą na profil GitHuba użytkownika (otwierany w nowej karcie).

   **Sposób wyświetlania (jak na profilu GitHuba):** okrągły avatar, pod nim `name` (imię i nazwisko) dużą, pogrubioną czcionką jako główna nazwa, a pod spodem `login` (`@handle`) mniejszym, szarym tekstem jako podpis. Jeśli user nie ma ustawionego `name`, główną nazwą staje się `login` (a podpis się nie dubluje).
2. **Punkty w rankingu:** na start „streak + liczba questów"; osobny system punktów opcjonalnie później.
3. **Moderacja czatu:** na później (na start tylko limit długości + rate-limit anty-spam).
4. **Pierwszy quest dla usera bez żadnego publicznego repo:** potrzebny quest startowy „rozgrzewkowy", gdy nie ma czego skanować.

---

## 9c. Stos technologiczny (dopasowany do Vercel + OpenAI)

Vercel świetnie hostuje frontend i funkcje serverless, ale ma jedno ograniczenie: **nie utrzymuje długich, stałych połączeń** (a tego właśnie wymaga klasyczny WebSocket do czatu). Dlatego czat realizujemy przez zewnętrzną usługę realtime. Reszta wchodzi naturalnie.

- **Framework:** Next.js (App Router) — front + API routes w jednym, natywnie wspierany przez Vercel.
- **Logowanie:** NextAuth (Auth.js) z providerem GitHub — gotowa obsługa OAuth, sekret bezpiecznie po stronie serwera.
- **Baza danych:** Neon (serverless Postgres) — trwałość userów, questów, completions, statystyk, czatu. Wybrany zamiast Supabase, bo skaluje się do zera na wszystkich planach (nie usypia projektu po 7 dniach) → darmowe działanie 24/7 bez ręcznego budzenia. Najwyżej pierwsze zapytanie po przerwie ma zimny start ~0,5–2s.
- **AI:** OpenAI API wołane z serwerowych API routes (klucz nigdy nie trafia do przeglądarki). Odpowiedzi w trybie ustrukturyzowanym (JSON) — i dla generowania questa, i dla oceny.
- **Reset o północy (CET):** Vercel Cron Jobs — zaplanowane zadanie codziennie o 00:00 CET, które zamyka wczorajsze questy, aktualizuje streaki (spadek do zera przy braku ukończenia) i generuje nowe.
- **Czat na żywo:** Pusher (lub Ably) — usługa realtime utrzymująca stałe połączenie, wysyłająca wiadomość dopiero gdy coś się pojawi (zero pustych pingów). Wiadomości zapisywane w `chat_messages` w Neon; Pusher rozsyła je live do wszystkich. Wybrany zamiast pollingu, bo polling waliłby w bazę co kilka sekund nawet przy ciszy — co przepalałoby limit Neon i psuło jego skalowanie do zera. Pusher dotyka bazy tylko przy realnej wiadomości.
- **Styl GitHuba:** Tailwind CSS + paleta i komponenty wzorowane na GitHubie (ciemny motyw, zielenie heatmapy).

Uwaga o kosztach: każde generowanie questa i każda ocena to płatne wywołanie OpenAI. Bramka twarda (sprawdzenie repo bez AI) celowo odsiewa próby **przed** wywołaniem modelu, żeby nie płacić za oczywiste odrzucenia.

---

## 9d. Koszty i darmowe limity

Cel: jedyny stały koszt to klucz OpenAI. To realne na etapie nauki; przy publicznym uruchomieniu 24/7 dochodzą drobne koszty infrastruktury. Dwie fazy:

### Faza 1 — nauka i prywatne testy (cel: tylko OpenAI)
- **Vercel** — plan hobby darmowy (do użytku niekomercyjnego). Wystarcza w pełni.
- **Neon** — darmowy plan: ok. 0,5 GB storage na projekt (do kilku projektów), 100 CU-hours/mc compute, nieograniczone branche, autoscaling. Skaluje się do zera bez usypiania projektu → działa 24/7 bez ręcznego budzenia. Na tabele, streaki i ranking z zapasem.
- **Pusher** — darmowy plan (rzędu 200 jednoczesnych połączeń, ~200 tys. wiadomości/dzień) — z zapasem na czat na etapie nauki i niewielką publiczną apkę.
- **OpenAI** — jedyny realny koszt. Uwaga: OpenAI **nie ma darmowego progu** — płacisz od pierwszego wywołania, rozliczane za tokeny (ilość tekstu w zapytaniu + odpowiedzi). Kwoty są małe (ułamki centa za zapytanie przy tańszych modelach), ale to koszt od startu. Każde generowanie questa i każda ocena = osobne wywołanie. Bramka twarda ogranicza liczbę płatnych wywołań.

Wniosek: na tym etapie „jedyna płatna rzecz to OpenAI" jest prawdą.

### Faza 2 — publiczna aplikacja 24/7 (gdy/jeśli)
- **Neon — bez haczyka usypiania:** w przeciwieństwie do Supabase, Neon nie usypia projektu offline. Publiczna apka 24/7 działa na darmowym Neon bez proteza z pingowaniem. Koszt pojawia się dopiero przy realnym wzroście ruchu (przekroczenie 100 CU-hours albo 0,5 GB).
- **Pusher** — przy większej liczbie userów może przekroczyć darmowy limit połączeń/wiadomości → wtedy płatny plan.
- **Vercel hobby** — oficjalnie do użytku niekomercyjnego; jeśli aplikacja zacznie zarabiać, trzeba przejść na płatny plan.
- **OpenAI** — koszt rośnie liniowo z liczbą userów i questów (więcej wywołań = więcej tokenów).

Wniosek: decyzję o kosztach Fazy 2 odkładamy do momentu, gdy publiczne uruchomienie stanie się realne. Na start nic z tego nie blokuje budowy.

*(Liczby cennikowe aktualne na czerwiec 2026 — przed produkcją warto zerknąć na neon.tech/pricing i pusher.com/pricing, bo stawki bywają aktualizowane.)*

---

## 10. Proponowana kolejność budowy

1. Szkielet UI w stylu GitHuba (statyczny, dane udawane) — żeby zobaczyć wygląd i przepływ.
2. GitHub OAuth + sesja.
3. Skanowanie repo i budowa profilu.
4. Generowanie questa (AI).
5. Weryfikacja questa (bramka + AI).
6. Streak, heatmapa, statystyki.
7. Ranking.
8. Czat na żywo (Pusher + Neon).
9. Scheduler resetu o północy.
10. Szlify: moderacja, punkty, przypadki brzegowe.
