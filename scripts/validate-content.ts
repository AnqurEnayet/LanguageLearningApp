/**
 * Validates all content and generates /content/<lang>/book.json.
 *
 * Runs automatically before every build (npm run prebuild). Checks:
 *  - lexicon and every chapter match their Zod schemas
 *  - word IDs and freqRanks are unique in the lexicon
 *  - every word ID referenced by a chapter (newWords, revise, inline
 *    {{id|text}} refs) exists in the lexicon
 *  - no word is introduced as "new" in two chapters
 *  - chapter ids match their language + file name, orders are unique
 *
 * Exits non-zero with a readable list of problems, so a bad chapter file
 * fails the build instead of silently breaking the app.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chapterSchema, lexiconSchema } from "../src/domain/schemas";
import { extractWordRefs } from "../src/domain/story";
import type { Book, BookChapterEntry, Chapter } from "../src/domain/types";

const CONTENT_DIR = join(process.cwd(), "content");
const errors: string[] = [];

function fail(msg: string): void {
  errors.push(msg);
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    fail(`${path}: not valid JSON (${e instanceof Error ? e.message : e})`);
    return null;
  }
}

function validateLanguage(lang: string): void {
  const langDir = join(CONTENT_DIR, lang);
  const lexiconPath = join(langDir, "lexicon.json");
  if (!existsSync(lexiconPath)) {
    fail(`${lang}: missing lexicon.json`);
    return;
  }

  // --- Lexicon ---
  const lexiconRaw = readJson(lexiconPath);
  if (lexiconRaw === null) return;
  const lexiconResult = lexiconSchema.safeParse(lexiconRaw);
  if (!lexiconResult.success) {
    for (const issue of lexiconResult.error.issues) {
      fail(`lexicon.json: ${issue.path.join(".")} — ${issue.message}`);
    }
    return;
  }
  const lexicon = lexiconResult.data;

  const knownIds = new Set<string>();
  const seenRanks = new Map<number, string>();
  for (const word of lexicon.words) {
    if (knownIds.has(word.id)) fail(`lexicon.json: duplicate word id ${word.id}`);
    knownIds.add(word.id);
    if (!word.id.startsWith(`${lang}-`)) {
      fail(`lexicon.json: word ${word.id} does not start with "${lang}-"`);
    }
    const rankHolder = seenRanks.get(word.freqRank);
    if (rankHolder) {
      fail(`lexicon.json: freqRank ${word.freqRank} used by both ${rankHolder} and ${word.id}`);
    }
    seenRanks.set(word.freqRank, word.id);
    if (word.pos === "noun" && !word.article) {
      fail(`lexicon.json: noun ${word.id} (${word.lemma}) has no article`);
    }
  }

  // --- Chapters ---
  const chaptersDir = join(langDir, "chapters");
  const chapterFiles = existsSync(chaptersDir)
    ? readdirSync(chaptersDir).filter((f) => f.endsWith(".json")).sort()
    : [];
  if (chapterFiles.length === 0) fail(`${lang}: no chapter files in chapters/`);

  const chapters: Chapter[] = [];
  const newWordOwner = new Map<string, string>(); // wordId -> chapterId
  const seenOrders = new Map<number, string>();

  for (const file of chapterFiles) {
    const raw = readJson(join(chaptersDir, file));
    if (raw === null) continue;
    const result = chapterSchema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        fail(`${file}: ${issue.path.join(".")} — ${issue.message}`);
      }
      continue;
    }
    const chapter = result.data;
    chapters.push(chapter);

    const expectedId = `${lang}-${file.replace(/\.json$/, "")}`;
    if (chapter.id !== expectedId) {
      fail(`${file}: id "${chapter.id}" should be "${expectedId}" (derived from file name)`);
    }
    const orderHolder = seenOrders.get(chapter.order);
    if (orderHolder) fail(`${file}: order ${chapter.order} already used by ${orderHolder}`);
    seenOrders.set(chapter.order, chapter.id);

    for (const wordId of chapter.newWords) {
      if (!knownIds.has(wordId)) fail(`${file}: newWords references unknown word ${wordId}`);
      const owner = newWordOwner.get(wordId);
      if (owner) fail(`${file}: word ${wordId} already introduced as new in ${owner}`);
      else newWordOwner.set(wordId, chapter.id);
    }
    for (const entry of chapter.revise) {
      if (!knownIds.has(entry.wordId)) {
        fail(`${file}: revise references unknown word ${entry.wordId}`);
      }
    }
    chapter.german.forEach((paragraph, i) => {
      for (const ref of extractWordRefs(paragraph)) {
        if (!knownIds.has(ref)) {
          fail(`${file}: german[${i}] references unknown word {{${ref}|…}}`);
        }
      }
    });
    if (chapter.german.length === 0) fail(`${file}: story has no German paragraphs`);
    if (chapter.english.length !== chapter.german.length) {
      fail(
        `${file}: ${chapter.german.length} German paragraphs but ${chapter.english.length} English — must match 1:1`
      );
    }
  }

  // --- Story continuity: a chapter may only use words it has already taught ---
  // This is the core rule of a frequency reader, and the one an author breaks
  // by accident. Walk the chapters in reading order, accumulating vocabulary.
  const inReadingOrder = [...chapters].sort((a, b) => a.order - b.order);
  const availableSoFar = new Set<string>();
  for (const chapter of inReadingOrder) {
    for (const wordId of chapter.newWords) availableSoFar.add(wordId);

    const referenced = new Set<string>();
    chapter.german.forEach((paragraph, i) => {
      for (const ref of extractWordRefs(paragraph)) {
        referenced.add(ref);
        if (!availableSoFar.has(ref)) {
          const owner = newWordOwner.get(ref);
          fail(
            `${chapter.id}: german[${i}] uses {{${ref}}}, which is not taught ` +
              `until ${owner ?? "any chapter"} — a chapter may only use words ` +
              `introduced in it or earlier`
          );
        }
      }
    });

    // Every new word should be met in the story, not just listed in the table.
    const unmet = chapter.newWords.filter((id) => !referenced.has(id));
    if (unmet.length > 0) {
      fail(
        `${chapter.id}: ${unmet.length} new word(s) never appear in the story: ` +
          unmet.join(", ")
      );
    }
  }

  if (errors.length > 0) return;

  // --- Generate book.json ---
  const metaPath = join(langDir, "meta.json");
  const meta = existsSync(metaPath)
    ? (readJson(metaPath) as {
        title?: string;
        goalWords?: number;
        goalChapters?: number;
      })
    : {};

  const rankById = new Map(lexicon.words.map((w) => [w.id, w.freqRank]));
  const entries: BookChapterEntry[] = chapters
    .sort((a, b) => a.order - b.order)
    .map((ch) => {
      const ranks = ch.newWords
        .map((id) => rankById.get(id))
        .filter((r): r is number => r !== undefined);
      return {
        id: ch.id,
        order: ch.order,
        title: ch.title,
        newWords: ch.newWords,
        freqRange:
          ranks.length > 0
            ? { from: Math.min(...ranks), to: Math.max(...ranks) }
            : { from: 0, to: 0 }
      };
    });

  const goalWords = meta.goalWords ?? lexicon.words.length;
  const goalChapters = meta.goalChapters ?? chapters.length;

  const book: Book = {
    schemaVersion: 1,
    lang,
    title: meta.title ?? "German Frequency Reader",
    goalWords,
    goalChapters,
    lexiconSize: lexicon.words.length,
    chapters: entries
  };

  writeFileSync(join(langDir, "book.json"), JSON.stringify(book, null, 2) + "\n");

  const perChapter = goalWords / goalChapters;
  console.log(
    `✔ ${lang}: ${lexicon.words.length}/${goalWords} words published, ` +
      `${chapters.length}/${goalChapters} chapters — book.json generated`
  );
  // The course plan implies a words-per-chapter budget; flag drift early.
  for (const ch of entries) {
    if (ch.newWords.length !== perChapter) {
      console.log(
        `  note: ${ch.id} introduces ${ch.newWords.length} words ` +
          `(plan is ${perChapter} per chapter)`
      );
    }
  }
}

// ---------------------------------------------------------------------------
if (!existsSync(CONTENT_DIR)) {
  console.error("No /content directory found.");
  process.exit(1);
}

for (const lang of readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)) {
  validateLanguage(lang);
}

if (errors.length > 0) {
  console.error(`\n✘ Content validation failed with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
