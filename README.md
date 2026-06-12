# World Cupple — the daily World Cup 2026 companion

React + Vite + Firebase (Auth + Cloud Firestore + Functions). A daily-habit
football game built to run for the whole tournament (Jun 11 – Jul 19, 2026):
one 10-question match per day, a wagering market on real fixtures, a 64-sticker
collection album, and a premium-currency economy on top.

## The daily loop (retention by design)

Everything resets at **00:00 UTC**, so every hook points at the same comeback
moment:

1. **Daily Match** — 10 questions, 15s each. Score maps to FP (+50 … −50).
   One play per day; refresh-resume is supported (answers are immutable).
2. **Free pack** — every completed match earns a Bronze Pack + 25 CupCoins.
   The pack-opening ceremony is the dopamine peak; epic+ pulls fire confetti.
3. **Streaks** — consecutive UTC days, Wordle-style week dots on the dashboard.
   Milestones (3/7/14/21/30, then every 7) pay FP + coins + packs.
   **Streak Shields** auto-bridge a single missed day.
4. **Match Day Picks** — wagers settle after real fixtures → check back tomorrow.
5. **Captain's Club daily claim** — VIPs claim a Gold Pack every day.
6. **Daily Deal** — one store item rotates at midnight with a countdown.
7. **Live layer** — activity ticker, online-now counter, and a deterministic
   "ghost" field of 45 competitors whose FP drifts daily so the global
   leaderboard reshuffles every morning (client-side, no writes; same board for
   everyone).

## Monetization

**CupCoins** are the premium currency (`users/{uid}.coins`).

| Bundle | Coins | Price | Anchor |
|---|---|---|---|
| Starter Bag | 500 | $4.99 | — |
| Fan Stash | 1,200 | $9.99 | MOST POPULAR |
| Pro Vault | 2,600 | $19.99 | BEST VALUE |
| Legend Chest | 7,000 | $49.99 | VIP treatment |

First purchase of each bundle is **doubled**. Free players get a slow drip
(25/day + album page rewards) — enough to learn what coins buy.

Coin sinks: **VAR Tokens** (overturn one wrong answer per match, 150),
**Streak Shields** (200), **Gold Packs** (250), **Legendary Packs** (600),
**Golden Wildcards** (pick any missing sticker, 900), and the
**Captain's Club** season VIP (1,500: daily Gold Pack claim, +50% FP on wins,
2× duplicate value, gold leaderboard flair, exclusive badge). A pity counter
guarantees a Legendary sticker at least every 10 packs — and the store shows it.

### Payments

- **Default: sandbox checkout.** Fully working purchase UX in-app, instant
  credit, clearly labeled, no real charges. Crediting is client-side (same
  trust model as FP — see hardening notes).
- **Production: Stripe Payment Links + webhook.**
  1. Create a Payment Link per bundle, put `coins` (amount to credit) in the
     link's metadata.
  2. Set `VITE_STRIPE_LINK_{STARTER|FAN|PRO|LEGEND}` (see `.env.example`) —
     the Buy buttons then hand off to Stripe with `client_reference_id={uid}`.
  3. Deploy `stripeWebhook` (functions/index.js), point a Stripe webhook for
     `checkout.session.completed` at it, and set the secrets:
     `firebase functions:secrets:set STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET`.
     Crediting is transactional and idempotent (`purchases/{sessionId}`).

## The Legends Album

64 stickers across 6 pages (Immortals, Golden Boots, Guardians, Iconic
Moments, Class of '26, Temples & Trophies) in 4 rarities — legendaries get an
animated gold-foil treatment. Duplicates auto-convert to FP (VIP 2×), page
completion pays 120 coins (claim-once), full completion unlocks The Collector
badge. Catalog + roll logic: `src/utils/stickers.js` (pure functions, easy to
rebalance).

## Quiz backend

Quiz questions live in Firestore, not in the client bundle. The correct answer is
stored separately from the question and is only readable **after** a user has
locked in their answer — enforced by `firestore.rules`, so it can't be bypassed
from devtools or the network tab.

### Data model

| Collection | Contents |
|---|---|
| `questions/{id}` | `text`, `options` (3), `category`, `difficulty`, `inPracticePool` — **no answer** |
| `questionAnswers/{id}` | `correctAnswer` — rule-locked |
| `dailyQuizzes/{YYYY-MM-DD}` | `questionIds`, `status` (`published`/`draft`), `availableAt` |
| `users/{uid}/dailyAnswers/{qid}` | `choice`, `quizDate`, `submittedAt` — create-once, immutable |
| `users/{uid}/pickSettlements/{qid}` | settled wager outcomes — written by Cloud Functions only |
| `purchases/{stripeSessionId}` | idempotency record for webhook coin credits — server-only |
| `users/{uid}.isAdmin` | `true` grants access to the `/admin` editor (set in the Firebase console only) |

Economy fields on `users/{uid}` (all client-written, owner-only by rules):
`coins`, `packBronze|packGold|packLegendary`, `varTokens`, `streakFreezes`,
`wildcards`, `stickers` (map id→count), `packsSinceLegendary`, `claimedPages`,
`purchasedBundles`, `vip`, `vipSince`, `vipClaimedDate`, `playStreak`,
`bestStreak`, `lastPlayedDate`, `badges`.

Daily quizzes are defined ahead of time and are the same for everybody. Review
and edit upcoming quizzes in the **`/admin`** calendar UI (see below), or edit the
`dailyQuizzes/{date}` doc directly in the Firebase console. Quizzes stay
unreadable to players until their date arrives **and** `status` is `published`.

Questions used in seeded daily quizzes have `inPracticePool: false` so practice
mode can never reveal a daily answer ahead of time. When adding new daily-only
questions, keep `inPracticePool: false`.

## Admin UI (`/admin`)

Visit `/<host>/admin`. You must be signed in with an account whose user doc has
`isAdmin: true` — set this field by hand in the Firebase console (clients are
forbidden by the rules from granting themselves admin). Admins also get a shield
icon shortcut on the dashboard.

The admin screen is a month calendar; each day shows whether a quiz exists and
its `LIVE`/`DRAFT` status + question count. Click a day to:

- create a draft quiz if none exists,
- edit each question's text, three options, correct answer, category and difficulty,
- add a brand-new question or pull in an existing one via search,
- toggle the quiz between `draft` and `published`, and save.

Saving writes the questions, answers, and the quiz doc in one batch. Admin reads
and writes are allowed by `firestore.rules` (`isAdmin()`); everyone else is
blocked, so the editor can't be used to cheat.

### One-time setup

1. **Migrate the questions** (while Firestore is still writable from clients):

   ```bash
   npm run migrate:questions            # seeds questions + 14 days of quizzes
   node scripts/migrateQuestions.mjs --days 21   # more days
   node scripts/migrateQuestions.mjs --dry-run   # preview
   ```

   Re-running is safe: questions are upserted under stable ids and existing
   `dailyQuizzes` docs are never overwritten (use `--force-quizzes` to regenerate).

   **World Cup 2026 dailies** — the daily now mixes 10 game types (trivia,
   anagram, missing vowels, higher/lower, closest guess, year guesser, career
   path, crest match, timeline, odd one out; see `src/utils/roundTypes.js`).
   Seed a themed daily for every remaining tournament day (each day's rounds
   are generated from that day's real fixtures).

   Unlike `migrate:questions`, this script uses the **Firebase Admin SDK**, so
   it works even with the production security rules already deployed. It needs a
   **service-account key**:

   1. Firebase console → ⚙️ Project settings → **Service accounts** →
      **Generate new private key** → download the JSON.
   2. Either `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json`,
      or save it as `scripts/serviceAccount.json` (already gitignored).

   The key grants full project access — treat it as a secret and never commit it.

   ```bash
   npm run seed:worldcup -- --dry-run             # preview every round (NO key needed)
   npm run seed:worldcup -- --dry-run --verbose   # also print payloads + answers
   npm run seed:worldcup                          # today → July 19, 2026 (needs the key)
   npm run seed:worldcup -- --date 2026-06-15      # just one day
   ```

   Fixture data lives in `scripts/data/wc2026-fixtures.json` and the facts the
   generators draw on in `scripts/data/worldcupFacts.mjs`. Existing quiz docs are
   skipped unless `--force-quizzes` is passed, so admin edits made in `/admin`
   survive re-runs.

2. **Deploy the security rules** — `firebase deploy --only firestore:rules` (or
   paste `firestore.rules` into Firebase console → Firestore → Rules). This
   replaces test mode and is required for both the anti-cheat and admin access.

3. **Make yourself an admin** — in the Firebase console, open your `users/{uid}`
   doc and add `isAdmin: true`. Then visit `/admin`.

4. Keep generating future quizzes from the `/admin` calendar, by re-running the
   migration script periodically, or by creating `dailyQuizzes/{date}` docs by hand.

`firebase.json` is included with an SPA rewrite (so `/admin` deep-links work on
Firebase Hosting) and the Firestore rules wiring; `firebase deploy` ships both.

## The fake-liveliness layer (disclosure)

`src/utils/ghostPlayers.js` and `src/utils/liveFeed.js` synthesize the crowd:
ghost leaderboard entries, the activity ticker, and the online counter are all
**deterministic client-side fictions** (seeded by date/minute so every player
sees the same world). They exist so day-one players join a full stadium, and
they require no backend. Delete both files + their imports to run honest-only.

### Known limitations

- Scores/FP **and the CupCoins economy** are written by the client, so a
  determined user could inflate balances directly. Real-money crediting already
  has a server path (`stripeWebhook`); the next hardening step is moving match
  scoring, pack rolls and item purchases into Cloud Functions too (compute from
  `dailyAnswers`, roll server-side).
- The 15s timer runs client-side and can be frozen with devtools; the submitted
  answer is still immutable, but a cheater gets unlimited thinking/googling time.
- VAR overturns are client-side scoring sugar (the locked `dailyAnswers` record
  keeps the original choice); a refresh restores the overturn from localStorage.
