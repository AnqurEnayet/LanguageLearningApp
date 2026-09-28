import { describe, expect, it } from "vitest";
import { mergeEvents } from "./events";
import type { ProgressEvent } from "./types";

function ev(id: string, createdAt: string, deviceId = "a"): ProgressEvent {
  return {
    id,
    userId: "local",
    deviceId,
    type: "chapter_opened",
    payload: { chapterId: "de-ch001" },
    createdAt,
    schemaVersion: 1
  };
}

describe("mergeEvents", () => {
  it("deduplicates by id", () => {
    const a = [ev("e1", "2026-01-01T10:00:00.000Z")];
    const b = [ev("e1", "2026-01-01T10:00:00.000Z"), ev("e2", "2026-01-01T11:00:00.000Z")];
    const merged = mergeEvents(a, b);
    expect(merged.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("sorts by createdAt with id as tie-breaker", () => {
    const merged = mergeEvents(
      [ev("b", "2026-01-01T10:00:00.000Z"), ev("z", "2026-01-01T09:00:00.000Z")],
      [ev("a", "2026-01-01T10:00:00.000Z")]
    );
    expect(merged.map((e) => e.id)).toEqual(["z", "a", "b"]);
  });

  it("is idempotent — merging the same lists twice changes nothing", () => {
    const a = [ev("e1", "2026-01-01T10:00:00.000Z"), ev("e2", "2026-01-02T10:00:00.000Z")];
    const b = [ev("e3", "2026-01-03T10:00:00.000Z")];
    const once = mergeEvents(a, b);
    const twice = mergeEvents(once, a, b);
    expect(twice).toEqual(once);
  });

  it("is commutative — merge order does not matter", () => {
    const a = [ev("e1", "2026-01-01T10:00:00.000Z", "phone")];
    const b = [ev("e2", "2026-01-01T10:00:00.000Z", "laptop")];
    expect(mergeEvents(a, b)).toEqual(mergeEvents(b, a));
  });

  it("keeps events from different devices at the same instant", () => {
    const merged = mergeEvents(
      [ev("phone-1", "2026-01-01T10:00:00.000Z", "phone")],
      [ev("laptop-1", "2026-01-01T10:00:00.000Z", "laptop")]
    );
    expect(merged).toHaveLength(2);
  });

  it("handles empty inputs", () => {
    expect(mergeEvents([], [])).toEqual([]);
    expect(mergeEvents()).toEqual([]);
  });
});
