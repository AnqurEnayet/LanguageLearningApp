import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import type { Chapter, Word } from "../../domain/types";
import { StoryText } from "./StoryText";
import { ReviseList } from "./ReviseList";
import { wordLabel } from "../../ui/WordLabel";

export function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const { content, book, wordsById, progress, log } = useApp();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const [tappedWord, setTappedWord] = useState<Word | null>(null);
  const openLogged = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setChapter(null);
    setError(null);
    setShowEnglish(false);
    setTappedWord(null);
    content
      .getChapter(id)
      .then(setChapter)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [content, id]);

  useEffect(() => {
    // Log chapter_opened once per visit (guard against StrictMode double-run).
    if (id && chapter && openLogged.current !== id) {
      openLogged.current = id;
      void log("chapter_opened", { chapterId: id });
    }
  }, [id, chapter, log]);

  if (error) {
    return (
      <main className="page stack">
        <p className="muted">{error}</p>
        <Link to="/">Back to chapters</Link>
      </main>
    );
  }
  if (!chapter || !book) {
    return (
      <main className="page">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  const finished = progress.finishedChapterIds.has(chapter.id);
  const newWords = chapter.newWords
    .map((wid) => wordsById.get(wid))
    .filter((w): w is Word => w !== undefined);

  // Counter as if this chapter were finished: words learned so far plus
  // this chapter's not-yet-counted words.
  const wouldLearn = new Set(progress.learnedWordIds);
  for (const wid of chapter.newWords) wouldLearn.add(wid);

  const revealEnglish = () => {
    setShowEnglish(true);
    void log("translation_revealed", { chapterId: chapter.id });
  };

  const toggleFinished = () => {
    void log(finished ? "chapter_unfinished" : "chapter_finished", {
      chapterId: chapter.id
    });
  };

  return (
    <main className="page stack">
      <nav className="small">
        <Link to="/">← Chapters</Link>
      </nav>

      <header>
        <h1>
          {chapter.order}. {chapter.title}
        </h1>
      </header>

      {/* Story first: meet the new words in context, highlighted, before
          the table names them. */}
      <section className="card story">
        <h2>Story</h2>
        <StoryText paragraphs={chapter.german} onWordTap={(w) => setTappedWord(w)} />
        {tappedWord && (
          <div className="word-popover spread" role="status">
            <span>
              <strong>{wordLabel(tappedWord)}</strong>{" "}
              <span className="muted">— {tappedWord.en}</span>
            </span>
            <button onClick={() => setTappedWord(null)} aria-label="Close">
              ✕
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <div className="spread">
          <h2>English</h2>
          {!showEnglish && (
            <button className="primary" onClick={revealEnglish}>
              Reveal
            </button>
          )}
        </div>
        {showEnglish && (
          <div className="reveal-body">
            {chapter.english.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </section>

      {newWords.length > 0 && (
        <section className="card">
          <div className="spread">
            <h2>The {newWords.length} new words</h2>
            <span className="badge">
              ranks {Math.min(...newWords.map((w) => w.freqRank))}–
              {Math.max(...newWords.map((w) => w.freqRank))}
            </span>
          </div>
          <div className="word-table-wrap">
            <table className="word-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>German</th>
                  <th>English</th>
                </tr>
              </thead>
              <tbody>
                {newWords.map((w) => (
                  <tr key={w.id}>
                    <td className="muted">{w.freqRank}</td>
                    <td>
                      <strong>{wordLabel(w)}</strong>
                      {w.plural && <span className="muted small"> · pl. {w.plural}</span>}
                    </td>
                    <td>{w.en}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {chapter.grammar && (
        <section className="card">
          <h2>{chapter.grammar.title}</h2>
          <p>{chapter.grammar.body}</p>
          {chapter.grammar.examples.map((ex, i) => (
            <p key={i}>
              <strong>{ex.de}</strong>
              <br />
              <span className="muted">{ex.en}</span>
            </p>
          ))}
        </section>
      )}

      {chapter.revise.length > 0 && (
        <section className="card">
          <h2>Words to revise</h2>
          <ReviseList entries={chapter.revise} />
        </section>
      )}

      {chapter.tip && <p className="tip">{chapter.tip}</p>}

      {chapter.showCounter && (
        <div className="counter-banner">
          {finished
            ? `You now know ${progress.learnedWordCount} of the ${book.goalWords} most common German words.`
            : `Finish this chapter to know ${wouldLearn.size} of the ${book.goalWords} most common German words.`}
        </div>
      )}

      <button className={finished ? "" : "primary"} onClick={toggleFinished}>
        {finished ? "✓ Finished — tap to unmark" : "Mark chapter as finished"}
      </button>
    </main>
  );
}
