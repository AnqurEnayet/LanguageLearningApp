import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import type { Chapter, ReviseEntry, Word } from "../../domain/types";
import { wordLabel } from "../../ui/WordLabel";

const BAND_SIZE = 100;

interface Card {
  entry: ReviseEntry;
  word: Word;
  chapterId: string;
  chapterTitle: string;
}

export function RevisionPage() {
  const { book, wordsById, progress, content, log } = useApp();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [bandFilter, setBandFilter] = useState<string>("all");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const finishedIds = useMemo(
    () =>
      (book?.chapters ?? [])
        .filter((ch) => progress.finishedChapterIds.has(ch.id))
        .sort((a, b) => a.order - b.order)
        .map((ch) => ch.id),
    [book, progress.finishedChapterIds]
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(finishedIds.map((id) => content.getChapter(id)))
      .then((loaded) => {
        if (!cancelled) setChapters(loaded);
      })
      .catch(() => {
        if (!cancelled) setChapters([]);
      });
    return () => {
      cancelled = true;
    };
  }, [content, finishedIds]);

  const allCards: Card[] = useMemo(() => {
    const cards: Card[] = [];
    for (const ch of chapters) {
      for (const entry of ch.revise) {
        const word = wordsById.get(entry.wordId);
        if (word) {
          cards.push({ entry, word, chapterId: ch.id, chapterTitle: ch.title });
        }
      }
    }
    return cards;
  }, [chapters, wordsById]);

  const bands = useMemo(() => {
    const set = new Set<number>();
    for (const card of allCards) {
      set.add(Math.floor((card.word.freqRank - 1) / BAND_SIZE));
    }
    return [...set].sort((a, b) => a - b);
  }, [allCards]);

  const cards = allCards.filter((card) => {
    if (chapterFilter !== "all" && card.chapterId !== chapterFilter) return false;
    if (bandFilter !== "all") {
      const band = Math.floor((card.word.freqRank - 1) / BAND_SIZE);
      if (band !== Number(bandFilter)) return false;
    }
    return true;
  });

  const review = (wordId: string, result: "known" | "unsure") => {
    void log("word_reviewed", { wordId, result });
    setRevealed((prev) => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
  };

  if (finishedIds.length === 0) {
    return (
      <main className="page stack">
        <h1>Revise</h1>
        <p className="muted">
          Finish a chapter first — its revision words will appear here.{" "}
          <Link to="/">Go to chapters</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="page stack">
      <h1>Revise</h1>

      <div className="row">
        <select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)} aria-label="Filter by chapter">
          <option value="all">All chapters</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.order}. {ch.title}
            </option>
          ))}
        </select>
        <select value={bandFilter} onChange={(e) => setBandFilter(e.target.value)} aria-label="Filter by frequency band">
          <option value="all">All ranks</option>
          {bands.map((band) => (
            <option key={band} value={band}>
              {band * BAND_SIZE + 1}–{(band + 1) * BAND_SIZE}
            </option>
          ))}
        </select>
      </div>

      <p className="muted small">{cards.length} cards</p>

      <div className="stack">
        {cards.map((card) => {
          const key = `${card.chapterId}:${card.entry.wordId}`;
          const isRevealed = revealed.has(key);
          const last = progress.lastReviewByWord.get(card.entry.wordId);
          return (
            <div
              key={key}
              className="rev-card"
              role="button"
              tabIndex={0}
              onClick={() => !isRevealed && setRevealed((p) => new Set(p).add(key))}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isRevealed) {
                  setRevealed((p) => new Set(p).add(key));
                }
              }}
            >
              <div className="row" style={{ justifyContent: "center" }}>
                <span className="badge">rank {card.word.freqRank}</span>
                {last && <span className={`badge ${last.result}`}>{last.result}</span>}
              </div>
              <div className="front">{card.entry.exampleDe}</div>
              {isRevealed ? (
                <>
                  <div className="back">
                    <strong>{wordLabel(card.word)}</strong> — {card.word.en}
                    <br />
                    <span className="muted small">{card.entry.exampleEn}</span>
                  </div>
                  <div className="rev-actions">
                    <button onClick={(e) => { e.stopPropagation(); review(card.entry.wordId, "unsure"); }}>
                      Still unsure
                    </button>
                    <button className="primary" onClick={(e) => { e.stopPropagation(); review(card.entry.wordId, "known"); }}>
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
    </main>
  );
}
