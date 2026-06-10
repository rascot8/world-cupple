# SomeSingSexy — FIFA Trivia

React + Vite + Firebase (Auth + Cloud Firestore).

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
| `users/{uid}.isAdmin` | `true` grants access to the `/admin` editor (set in the Firebase console only) |

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

2. **Deploy the security rules** — `firebase deploy --only firestore:rules` (or
   paste `firestore.rules` into Firebase console → Firestore → Rules). This
   replaces test mode and is required for both the anti-cheat and admin access.

3. **Make yourself an admin** — in the Firebase console, open your `users/{uid}`
   doc and add `isAdmin: true`. Then visit `/admin`.

4. Keep generating future quizzes from the `/admin` calendar, by re-running the
   migration script periodically, or by creating `dailyQuizzes/{date}` docs by hand.

`firebase.json` is included with an SPA rewrite (so `/admin` deep-links work on
Firebase Hosting) and the Firestore rules wiring; `firebase deploy` ships both.

### Known limitations

- Scores/FP are still written by the client, so a determined user could inflate
  their FP directly. Moving scoring into a Cloud Function (compute the score
  server-side from `dailyAnswers`) is the next hardening step.
- The 15s timer runs client-side and can be frozen with devtools; the submitted
  answer is still immutable, but a cheater gets unlimited thinking/googling time.
