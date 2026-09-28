import { Link } from "react-router-dom";
import { useApp } from "../../app/AppContext";

export function TocPage() {
  const { book, progress } = useApp();

  if (!book) {
    return (
      <main className="page">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  const chapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const pct = book.goalWords > 0
    ? Math.round((progress.learnedWordCount / book.goalWords) * 100)
    : 0;

  return (
    <main className="page stack">
      <header>
        <h1>{book.title}</h1>
        <div className="spread small muted">
          <span>
            {progress.learnedWordCount} / {book.goalWords} words
          </span>
          <span>
            {progress.finishedChapterIds.size} / {book.goalChapters} chapters
          </span>
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <p className="small muted" style={{ marginTop: 6 }}>
          {book.lexiconSize} words across {chapters.length} chapters published so far
          {" · "}
          {Math.round((book.goalWords / book.goalChapters))} new words per chapter
        </p>
      </header>

      <ol className="toc-list">
        {chapters.map((ch) => {
          const finished = progress.finishedChapterIds.has(ch.id);
          const opened = progress.openedChapterIds.has(ch.id);
          return (
            <li key={ch.id} className="toc-item">
              <Link to={`/chapter/${ch.id}`} className="card spread">
                <span>
                  <strong>
                    {ch.order}. {ch.title}
                  </strong>
                  <br />
                  <span className="small muted">
                    {ch.newWords.length} new words
                    {ch.freqRange.to > 0 &&
                      ` · ranks ${ch.freqRange.from}–${ch.freqRange.to}`}
                  </span>
                </span>
                <span className="status" aria-label={finished ? "finished" : opened ? "started" : "not started"}>
                  {finished ? "✅" : opened ? "🔶" : "▫️"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
