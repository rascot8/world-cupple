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
| `dailyQuizzes/{YYYY-MM-DD}` | `questionIds` (10), `status` (`published`/`draft`), `availableAt` |
| `users/{uid}/dailyAnswers/{qid}` | `choice`, `quizDate`, `submittedAt` — create-once, immutable |

Daily quizzes are defined ahead of time and are the same for everybody. To
review or change an upcoming quiz, edit its `dailyQuizzes/{date}` doc in the
Firebase console (swap question ids, or set `status: 'draft'` to pull it).
Quizzes stay unreadable to clients until their date arrives, even if published.

Questions used in seeded daily quizzes have `inPracticePool: false` so practice
mode can never reveal a daily answer ahead of time. When adding new daily-only
questions in the console, keep `inPracticePool: false`.

### One-time setup

1. **Migrate the questions** (while Firestore is still writable from clients):

   ```bash
   npm run migrate:questions            # seeds questions + 14 days of quizzes
   node scripts/migrateQuestions.mjs --days 21   # more days
   node scripts/migrateQuestions.mjs --dry-run   # preview
   ```

   Re-running is safe: questions are upserted under stable ids and existing
   `dailyQuizzes` docs are never overwritten (use `--force-quizzes` to regenerate).

2. **Deploy the security rules** — copy `firestore.rules` into Firebase console →
   Firestore → Rules (or `firebase deploy --only firestore:rules`). This replaces
   test mode. The rules must be deployed for the quiz to be cheat-proof.

3. Keep generating future quizzes by re-running the script periodically, or by
   creating `dailyQuizzes/{date}` docs in the console by hand.

### Known limitations

- Scores/FP are still written by the client, so a determined user could inflate
  their FP directly. Moving scoring into a Cloud Function (compute the score
  server-side from `dailyAnswers`) is the next hardening step.
- The 15s timer runs client-side and can be frozen with devtools; the submitted
  answer is still immutable, but a cheater gets unlimited thinking/googling time.
