import { mergeEvents } from "../domain/events";
import { progressEventSchema } from "../domain/schemas";
import type { ProgressEvent } from "../domain/types";
import type { ProgressStore } from "./ProgressStore";

const STORAGE_KEY = "gfr:events:v1";

export class LocalStorageProgressStore implements ProgressStore {
  private listeners = new Set<() => void>();

  constructor() {
    // Cross-tab updates: the storage event fires in *other* tabs.
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) this.notify();
      });
    }
  }

  private read(): ProgressEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Drop anything malformed instead of crashing the whole app.
      return parsed.flatMap((item) => {
        const result = progressEventSchema.safeParse(item);
        return result.success ? [result.data] : [];
      });
    } catch {
      return [];
    }
  }

  private write(events: ProgressEvent[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  private notify(): void {
    for (const cb of this.listeners) cb();
  }

  async append(events: ProgressEvent[]): Promise<void> {
    if (events.length === 0) return;
    this.write(mergeEvents(this.read(), events));
    this.notify();
  }

  async list(since?: string): Promise<ProgressEvent[]> {
    const all = mergeEvents(this.read());
    return since ? all.filter((e) => e.createdAt > since) : all;
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    this.notify();
  }
}
