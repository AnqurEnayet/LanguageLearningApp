# German Frequency Reader

Offline-first PWA for learning German through frequency-ordered stories.
Static site — no server, no accounts. Progress lives on the device as an
append-only event log, ready for cloud sync later.

## The design

Frequency-based and word-focused. Each chapter is a story that introduces
**50 new words**, highlighted where you first meet them; the word table comes
*after* the story, then the revision cards. The course target is
**3000 words across 60 chapters** — roughly 90% coverage of ordinary German.

The 60 chapters are **one continuous story**, not 60 separate texts — the arc,
the cast and the rules for writing a chapter are in
[content/de/STORY.md](content/de/STORY.md). Read it before writing one.

Targets live in `content/de/meta.json` (`goalWords`, `goalChapters`) and drive
the counter, the progress bar, and a build-time warning if a chapter drifts
from its 50-word budget. `npm run validate` also enforces the two rules that
make a frequency reader work: a chapter may use **only words introduced in it
or earlier**, and every new word must actually **appear in the story**.

## Commands

```bash
npm install       # once
npm run dev       # dev server
npm run validate  # check content + regenerate content/de/book.json
npm test          # Vitest (derived state, event merge)
npm run build     # validate + typecheck + production build (dist/)
```

## Architecture (short version)

- **Content** (`/content/de/`) — same for everyone, read-only.
  - `lexicon.json`: every word once, with a stable id (`de-0137`) separate from `freqRank`.
  - `chapters/chNNN.json`: chapters reference word IDs; stories use inline `{{de-0132|seit}}` refs.
  - `book.json`: **generated** by `npm run validate` — never edit by hand.
  - `meta.json`: book title and the course targets (`goalWords`, `goalChapters`).
- **Progress** — append-only `ProgressEvent` log behind the `ProgressStore`
  interface ([src/stores/ProgressStore.ts](src/stores/ProgressStore.ts)).
  Phase 1 adapter: localStorage. Sync later = merge event sets by id
  ([src/domain/events.ts](src/domain/events.ts)); state is always derived from
  the log ([src/domain/derive.ts](src/domain/derive.ts)).
- **UI** — React, only ever talks to `ProgressStore` and `ContentSource`.

## Adding a chapter

1. Add any new words to `content/de/lexicon.json`.
2. Add `content/de/chapters/chNNN.json` (`id` must be `de-chNNN`, matching the file name).
3. Run `npm run validate` — it fails with a clear message on any broken
   reference, duplicate "new" word, or schema mismatch, and regenerates `book.json`.

## Roadmap hooks already in place

- Phase 2 (IndexedDB + sync): implement `ProgressStore` again; export/import
  already uses the sync event format.
- Phase 3 (Supabase): same events, one table, insert `on conflict do nothing`.
- Spaced repetition: `word_reviewed` events already carry full history.
