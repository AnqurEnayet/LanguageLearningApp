import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./app/AppContext";
import { ChapterPage } from "./features/chapter/ChapterPage";
import { RevisionPage } from "./features/revision/RevisionPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { TocPage } from "./features/toc/TocPage";
import { WordListPage } from "./features/wordlist/WordListPage";
import { BottomNav } from "./ui/BottomNav";

export default function App() {
  const { contentError } = useApp();

  if (contentError) {
    return (
      <main className="page">
        <h1>Content failed to load</h1>
        <p className="muted">{contentError}</p>
        <p className="muted">
          Check that /content/de contains lexicon.json, chapters/, and a generated
          book.json (npm run validate).
        </p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<TocPage />} />
        <Route path="/chapter/:id" element={<ChapterPage />} />
        <Route path="/revise" element={<RevisionPage />} />
        <Route path="/words" element={<WordListPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
