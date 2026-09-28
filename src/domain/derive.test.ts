import { describe, expect, it } from "vitest";
import { deriveProgress } from "./derive";
import type { ProgressEvent, ProgressEventPayload, ProgressEventType } from "./types";

let counter = 0;
function ev(
  type: ProgressEventType,
  payload: ProgressEventPayload,
  createdAt: string
): ProgressEvent {
  counter += 1;
  return {
    id: `ev-${String(counter).padStart(4, "0")}`,
    userId: "local",
    deviceId: "test-device",
    type,
    payload,
    createdAt,
    schemaVersion: 1
  };
}

const newWordsByChapter = new Map<string, string[]>([
  ["de-ch001", ["de-0001", "de-0002", "de-0003"]],
  ["de-ch002", ["de-0003", "de-0004"]], // de-0003 shared on purpose
  ["de-ch003", ["de-0005"]]
]);

describe("deriveProgress", () => {
  it("starts empty", () => {
    const d = deriveProgress([], newWordsByChapter);
    expect(d.finishedChapterIds.size).toBe(0);
    expect(d.learnedWordCount).toBe(0);
  });

  it("counts unique words across finished chapters", () => {
    const d = deriveProgress(
      [
        ev("chapter_finished", { chapterId: "de-ch001" }, "2026-01-01T10:00:00.000Z"),
        ev("chapter_finished", { chapterId: "de-ch002" }, "2026-01-02T10:00:00.000Z")
      ],
      newWordsByChapter
    );
    expect(d.finishedChapterIds).toEqual(new Set(["de-ch001", "de-ch002"]));
    // de-0003 appears in both chapters but counts once
    expect(d.learnedWordCount).toBe(4);
  });

  it("resolves finish/unfinish toggles in time order regardless of array order", () => {
    const finish = ev("chapter_finished", { chapterId: "de-ch001" }, "2026-01-01T10:00:00.000Z");
    const unfinish = ev("chapter_unfinished", { chapterId: "de-ch001" }, "2026-01-03T10:00:00.000Z");
    const refinish = ev("chapter_finished", { chapterId: "de-ch001" }, "2026-01-02T10:00:00.000Z");

    // Shuffled input: latest event (unfinish) must win
    const d = deriveProgress([unfinish, finish, refinish], newWordsByChapter);
    expect(d.finishedChapterIds.has("de-ch001")).toBe(false);
    expect(d.learnedWordCount).toBe(0);
  });

  it("re-finishing after unfinishing restores learned words", () => {
    const d = deriveProgress(
      [
        ev("chapter_finished", { chapterId: "de-ch001" }, "2026-01-01T10:00:00.000Z"),
        ev("chapter_unfinished", { chapterId: "de-ch001" }, "2026-01-02T10:00:00.000Z"),
        ev("chapter_finished", { chapterId: "de-ch001" }, "2026-01-03T10:00:00.000Z")
      ],
      newWordsByChapter
    );
    expect(d.finishedChapterIds.has("de-ch001")).toBe(true);
    expect(d.learnedWordCount).toBe(3);
  });

  it("tracks opened chapters separately from finished ones", () => {
    const d = deriveProgress(
      [ev("chapter_opened", { chapterId: "de-ch003" }, "2026-01-01T10:00:00.000Z")],
      newWordsByChapter
    );
    expect(d.openedChapterIds.has("de-ch003")).toBe(true);
    expect(d.finishedChapterIds.has("de-ch003")).toBe(false);
  });

  it("keeps full review history and the latest result per word", () => {
    const d = deriveProgress(
      [
        ev("word_reviewed", { wordId: "de-0002", result: "unsure" }, "2026-01-01T10:00:00.000Z"),
        ev("word_reviewed", { wordId: "de-0002", result: "known" }, "2026-01-02T10:00:00.000Z")
      ],
      newWordsByChapter
    );
    expect(d.reviewsByWord.get("de-0002")).toHaveLength(2);
    expect(d.lastReviewByWord.get("de-0002")?.result).toBe("known");
  });

  it("ignores events for chapters missing from the book index", () => {
    const d = deriveProgress(
      [ev("chapter_finished", { chapterId: "de-ch099" }, "2026-01-01T10:00:00.000Z")],
      newWordsByChapter
    );
    expect(d.finishedChapterIds.has("de-ch099")).toBe(true); // finished, but…
    expect(d.learnedWordCount).toBe(0); // …contributes no words
  });
});
