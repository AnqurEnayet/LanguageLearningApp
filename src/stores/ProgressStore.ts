import type { ProgressEvent } from "../domain/types";

/**
 * The only way the app touches progress data.
 *
 * Adapters over time:
 *  - Phase 1: LocalStorageProgressStore
 *  - Phase 2: IndexedDbProgressStore + SyncEngine
 *  - Phase 3: SupabaseProgressStore (remote), IndexedDB as local cache
 *
 * The log is append-only: events are never edited or deleted, so any two
 * copies can be reconciled by a set union on event id (see mergeEvents).
 */
export interface ProgressStore {
  /** Append events; duplicates (by id) are silently ignored. */
  append(events: ProgressEvent[]): Promise<void>;
  /** All events, sorted by (createdAt, id); `since` filters createdAt > since. */
  list(since?: string): Promise<ProgressEvent[]>;
  /** Notify on any change (including from other tabs). Returns unsubscribe. */
  subscribe(cb: () => void): () => void;
  /** Wipe the log. Only used by the explicit "reset progress" setting. */
  clear(): Promise<void>;
}
