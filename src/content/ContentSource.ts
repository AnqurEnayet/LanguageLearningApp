import type { Book, Chapter, Lexicon } from "../domain/types";

/**
 * The only way the app reads content. Phase 1 bundles static JSON;
 * a CDN or CMS adapter can replace it later without UI changes.
 */
export interface ContentSource {
  getBook(lang: string): Promise<Book>;
  getLexicon(lang: string): Promise<Lexicon>;
  getChapter(id: string): Promise<Chapter>;
}
