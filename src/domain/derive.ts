import { compareEvents } from "./events";
import type { ProgressEvent, ReviewResult } from "./types";

export interface WordReview {
  result: ReviewResult;
  at: string; // ISO timestamp
}

/** Everything the UI needs, computed purely from the event log. */
export interface DerivedProgress {
  /** Chapters currently marked finished (finish/unfinish toggles resolved in time order). */
  finishedChapterIds: ReadonlySet<string>;
  /** Chapters the user has opened at least once. */
  openedChapterIds: ReadonlySet<string>;
  /** Union of newWords over finished chapters. */
  learnedWordIds: ReadonlySet<string>;
  learnedWordCount: number;
  /** Full review history per word, oldest first. */
  reviewsByWord: ReadonlyMap<string, WordReview[]>;
  /** Latest review per word, for quick "still unsure?" checks. */
  lastReviewByWord: ReadonlyMap<string, WordReview>;
}

/**
 * Fold the append-only event log into current state.
 *
 * @param events            the raw log, in any order
 * @param newWordsByChapter chapterId -> word IDs introduced there (from book.json)
 */
export function deriveProgress(
  events: ProgressEvent[],
  newWordsByChapter: ReadonlyMap<string, string[]>
): DerivedProgress {
  const sorted = [...events].sort(compareEvents);

  const finishedChapterIds = new Set<string>();
  const openedChapterIds = new Set<string>();
  const reviewsByWord = new Map<string, WordReview[]>();
  const lastReviewByWord = new Map<string, WordReview>();

  for (const event of sorted) {
    const { chapterId, wordId, result } = event.payload;
    switch (event.type) {
      case "chapter_opened":
        if (chapterId) openedChapterIds.add(chapterId);
        break;
      case "chapter_finished":
        if (chapterId) finishedChapterIds.add(chapterId);
        break;
      case "chapter_unfinished":
        if (chapterId) finishedChapterIds.delete(chapterId);
        break;
      case "word_reviewed":
        if (wordId && result) {
          const review: WordReview = { result, at: event.createdAt };
          const history = reviewsByWord.get(wordId) ?? [];
          history.push(review);
          reviewsByWord.set(wordId, history);
          lastReviewByWord.set(wordId, review);
        }
        break;
      case "translation_revealed":
        break; // logged for future stats, no derived state yet
    }
  }

  const learnedWordIds = new Set<string>();
  for (const chapterId of finishedChapterIds) {
    for (const id of newWordsByChapter.get(chapterId) ?? []) {
      learnedWordIds.add(id);
    }
  }

  return {
    finishedChapterIds,
    openedChapterIds,
    learnedWordIds,
    learnedWordCount: learnedWordIds.size,
    reviewsByWord,
    lastReviewByWord
  };
}
