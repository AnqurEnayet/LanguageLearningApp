import { useMemo, useState } from "react";
import { useApp } from "../../app/AppContext";
import { wordLabel } from "../../ui/WordLabel";

export function WordListPage() {
  const { lexicon, progress } = useApp();
  const [query, setQuery] = useState("");

  const words = useMemo(() => {
    const sorted = [...(lexicon?.words ?? [])].sort((a, b) => a.freqRank - b.freqRank);
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (w) =>
        w.lemma.toLowerCase().includes(q) ||
        w.en.toLowerCase().includes(q) ||
        String(w.freqRank) === q
    );
  }, [lexicon, query]);

  return (
    <main className="page stack">
      <h1>Word list</h1>
      <input
        type="search"
        placeholder="Search German or English…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search words"
      />
      <p className="muted small">
        {words.length} words · ✅ = in a finished chapter
      </p>
      <div>
        {words.map((w) => (
          <div key={w.id} className="wordlist-row">
            <span className="rank">#{w.freqRank}</span>
            <span className="lemma">
              {wordLabel(w)}
              {w.plural && <span className="muted small"> · pl. {w.plural}</span>}
            </span>
            <span className="en">
              {w.en}
              {progress.learnedWordIds.has(w.id) && " ✅"}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
