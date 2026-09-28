import { useState } from "react";
import { useApp } from "../../app/AppContext";
import type { ReviseEntry } from "../../domain/types";
import { wordLabel } from "../../ui/WordLabel";

/** Tap-to-reveal revision entries inside a chapter. */
export function ReviseList({ entries }: { entries: ReviseEntry[] }) {
  const { wordsById, log } = useApp();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const reveal = (wordId: string) => {
    setRevealed((prev) => new Set(prev).add(wordId));
  };

  const review = (wordId: string, result: "known" | "unsure") => {
    void log("word_reviewed", { wordId, result });
    setRevealed((prev) => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
  };

  return (
    <div className="stack">
      {entries.map((entry) => {
        const word = wordsById.get(entry.wordId);
        if (!word) return null;
        const isRevealed = revealed.has(entry.wordId);
        return (
          <div
            key={entry.wordId}
            className="rev-card"
            onClick={() => !isRevealed && reveal(entry.wordId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isRevealed) reveal(entry.wordId);
            }}
          >
            <div className="front">{entry.exampleDe}</div>
            {isRevealed ? (
              <>
                <div className="back">
                  <strong>{wordLabel(word)}</strong> — {word.en}
                  <br />
                  <span className="muted small">{entry.exampleEn}</span>
                </div>
                <div className="rev-actions">
                  <button onClick={(e) => { e.stopPropagation(); review(entry.wordId, "unsure"); }}>
                    Still unsure
                  </button>
                  <button className="primary" onClick={(e) => { e.stopPropagation(); review(entry.wordId, "known"); }}>
                    I knew it
                  </button>
                </div>
              </>
            ) : (
              <div className="muted small">tap to reveal</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
