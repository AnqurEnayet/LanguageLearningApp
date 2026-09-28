import { bookSchema, chapterSchema, lexiconSchema } from "../domain/schemas";
import type { Book, Chapter, Lexicon } from "../domain/types";
import type { ContentSource } from "./ContentSource";

// Vite bundles these lazily: each chapter becomes its own chunk, and the PWA
// precaches them all for offline reading.
const bookModules = import.meta.glob<unknown>("/content/*/book.json", {
  import: "default"
});
const lexiconModules = import.meta.glob<unknown>("/content/*/lexicon.json", {
  import: "default"
});
const chapterModules = import.meta.glob<unknown>("/content/*/chapters/*.json", {
  import: "default"
});

export class StaticJsonContentSource implements ContentSource {
  private bookCache = new Map<string, Book>();
  private lexiconCache = new Map<string, Lexicon>();
  private chapterCache = new Map<string, Chapter>();

  async getBook(lang: string): Promise<Book> {
    const cached = this.bookCache.get(lang);
    if (cached) return cached;
    const loader = bookModules[`/content/${lang}/book.json`];
    if (!loader) throw new Error(`No book for language "${lang}". Run: npm run validate`);
    const book = bookSchema.parse(await loader());
    this.bookCache.set(lang, book);
    return book;
  }

  async getLexicon(lang: string): Promise<Lexicon> {
    const cached = this.lexiconCache.get(lang);
    if (cached) return cached;
    const loader = lexiconModules[`/content/${lang}/lexicon.json`];
    if (!loader) throw new Error(`No lexicon for language "${lang}"`);
    const lexicon = lexiconSchema.parse(await loader());
    this.lexiconCache.set(lang, lexicon);
    return lexicon;
  }

  async getChapter(id: string): Promise<Chapter> {
    const cached = this.chapterCache.get(id);
    if (cached) return cached;
    // id "de-ch003" -> /content/de/chapters/ch003.json
    const [lang, file] = [id.slice(0, 2), id.slice(3)];
    const loader = chapterModules[`/content/${lang}/chapters/${file}.json`];
    if (!loader) throw new Error(`Chapter "${id}" not found`);
    const chapter = chapterSchema.parse(await loader());
    this.chapterCache.set(id, chapter);
    return chapter;
  }
}
