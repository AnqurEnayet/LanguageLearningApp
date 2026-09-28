import type {
  ProgressEvent,
  ProgressEventPayload,
  ProgressEventType
} from "./types";

/**
 * Total order over events: createdAt first, event id as a deterministic
 * tie-breaker so every device sorts an identical set identically.
 */
export function compareEvents(a: ProgressEvent, b: ProgressEvent): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return 0;
}

/**
 * Merge any number of event lists into one, deduplicated by event id and
 * sorted by (createdAt, id). Events are immutable, so on a duplicate id the
 * first occurrence wins — this is the whole sync algorithm.
 */
export function mergeEvents(...lists: ProgressEvent[][]): ProgressEvent[] {
  const byId = new Map<string, ProgressEvent>();
  for (const list of lists) {
    for (const event of list) {
      if (!byId.has(event.id)) byId.set(event.id, event);
    }
  }
  return [...byId.values()].sort(compareEvents);
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older WebViews.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface EventFactoryContext {
  userId: string;
  deviceId: string;
}

export function makeEvent(
  ctx: EventFactoryContext,
  type: ProgressEventType,
  payload: ProgressEventPayload
): ProgressEvent {
  return {
    id: uuid(),
    userId: ctx.userId,
    deviceId: ctx.deviceId,
    type,
    payload,
    createdAt: new Date().toISOString(),
    schemaVersion: 1
  };
}
