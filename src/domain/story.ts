/** A parsed piece of a story paragraph: plain text or an inline word reference. */
export type StorySegment =
  | { kind: "text"; text: string }
  | { kind: "word"; wordId: string; text: string };

const REF_PATTERN = /\{\{([a-z]{2}-\d{4})\|([^}]+)\}\}/g;

/** Split a paragraph containing {{wordId|text}} refs into renderable segments. */
export function parseStoryParagraph(paragraph: string): StorySegment[] {
  const segments: StorySegment[] = [];
  let lastIndex = 0;
  for (const match of paragraph.matchAll(REF_PATTERN)) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", text: paragraph.slice(lastIndex, match.index) });
    }
    segments.push({ kind: "word", wordId: match[1], text: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < paragraph.length) {
    segments.push({ kind: "text", text: paragraph.slice(lastIndex) });
  }
  return segments;
}

/** All word IDs referenced inline in a paragraph (used by content validation). */
export function extractWordRefs(paragraph: string): string[] {
  return [...paragraph.matchAll(REF_PATTERN)].map((m) => m[1]);
}
