import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { StaticJsonContentSource } from "../content/StaticJsonContentSource";
import type { ContentSource } from "../content/ContentSource";
import { deriveProgress, type DerivedProgress } from "../domain/derive";
import { makeEvent, type EventFactoryContext } from "../domain/events";
import type {
  Book,
  Lexicon,
  ProgressEvent,
  ProgressEventPayload,
  ProgressEventType,
  Word
} from "../domain/types";
import { LocalStorageProgressStore } from "../stores/LocalStorageProgressStore";
import type { ProgressStore } from "../stores/ProgressStore";

export const LANG = "de";

function getDeviceId(): string {
  const KEY = "gfr:deviceId";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "unknown-device";
  }
}

export interface AppContextValue {
  store: ProgressStore;
  content: ContentSource;
  book: Book | null;
  lexicon: Lexicon | null;
  wordsById: ReadonlyMap<string, Word>;
  events: ProgressEvent[];
  progress: DerivedProgress;
  contentError: string | null;
  /** Create + persist one event. */
  log(type: ProgressEventType, payload: ProgressEventPayload): Promise<void>;
  /** Re-read events from the store (after import/reset). */
  refresh(): Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_PROGRESS = deriveProgress([], new Map());

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useMemo<ProgressStore>(() => new LocalStorageProgressStore(), []);
  const content = useMemo<ContentSource>(() => new StaticJsonContentSource(), []);
  const factoryCtx = useMemo<EventFactoryContext>(
    () => ({ userId: "local", deviceId: getDeviceId() }),
    []
  );

  const [book, setBook] = useState<Book | null>(null);
  const [lexicon, setLexicon] = useState<Lexicon | null>(null);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [contentError, setContentError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setEvents(await store.list());
  }, [store]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([content.getBook(LANG), content.getLexicon(LANG)])
      .then(([b, l]) => {
        if (cancelled) return;
        setBook(b);
        setLexicon(l);
      })
      .catch((err: unknown) => {
        if (!cancelled) setContentError(err instanceof Error ? err.message : String(err));
      });
    void refresh();
    const unsubscribe = store.subscribe(() => void refresh());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [content, store, refresh]);

  const wordsById = useMemo(() => {
    const map = new Map<string, Word>();
    for (const w of lexicon?.words ?? []) map.set(w.id, w);
    return map;
  }, [lexicon]);

  const newWordsByChapter = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const ch of book?.chapters ?? []) map.set(ch.id, ch.newWords);
    return map;
  }, [book]);

  const progress = useMemo(
    () => (book ? deriveProgress(events, newWordsByChapter) : EMPTY_PROGRESS),
    [events, newWordsByChapter, book]
  );

  const log = useCallback(
    async (type: ProgressEventType, payload: ProgressEventPayload) => {
      await store.append([makeEvent(factoryCtx, type, payload)]);
    },
    [store, factoryCtx]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      store,
      content,
      book,
      lexicon,
      wordsById,
      events,
      progress,
      contentError,
      log,
      refresh
    }),
    [store, content, book, lexicon, wordsById, events, progress, contentError, log, refresh]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
