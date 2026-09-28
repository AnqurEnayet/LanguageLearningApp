import { z } from "zod";
import type {
  Book,
  Chapter,
  EventLogExport,
  Lexicon,
  ProgressEvent,
  Word
} from "./types";

export const wordIdSchema = z
  .string()
  .regex(/^[a-z]{2}-\d{4}$/, "word id must look like de-0137");

export const chapterIdSchema = z
  .string()
  .regex(/^[a-z]{2}-ch\d{3}$/, "chapter id must look like de-ch003");

export const posSchema = z.enum([
  "noun",
  "verb",
  "adj",
  "adv",
  "pron",
  "prep",
  "conj",
  "art",
  "num",
  "part",
  "interj",
  "phrase"
]);

export const wordSchema: z.ZodType<Word> = z
  .object({
    id: wordIdSchema,
    lemma: z.string().min(1),
    en: z.string().min(1),
    pos: posSchema,
    freqRank: z.number().int().positive(),
    article: z.string().optional(),
    plural: z.string().optional(),
    note: z.string().optional()
  })
  .strict();

export const lexiconSchema: z.ZodType<Lexicon> = z
  .object({
    schemaVersion: z.literal(1),
    words: z.array(wordSchema)
  })
  .strict();

export const grammarExampleSchema = z
  .object({ de: z.string().min(1), en: z.string().min(1) })
  .strict();

export const grammarNoteSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(1),
    examples: z.array(grammarExampleSchema)
  })
  .strict();

export const reviseEntrySchema = z
  .object({
    wordId: wordIdSchema,
    exampleDe: z.string().min(1),
    exampleEn: z.string().min(1)
  })
  .strict();

export const chapterSchema: z.ZodType<Chapter> = z
  .object({
    schemaVersion: z.literal(1),
    id: chapterIdSchema,
    order: z.number().int().positive(),
    title: z.string().min(1),
    newWords: z.array(wordIdSchema),
    german: z.array(z.string()),
    english: z.array(z.string()),
    grammar: grammarNoteSchema.optional(),
    revise: z.array(reviseEntrySchema),
    tip: z.string().optional(),
    showCounter: z.boolean()
  })
  .strict();

export const bookChapterEntrySchema = z
  .object({
    id: chapterIdSchema,
    order: z.number().int().positive(),
    title: z.string().min(1),
    newWords: z.array(wordIdSchema),
    freqRange: z
      .object({ from: z.number().int().nonnegative(), to: z.number().int().nonnegative() })
      .strict()
  })
  .strict();

export const bookSchema: z.ZodType<Book> = z
  .object({
    schemaVersion: z.literal(1),
    lang: z.string().length(2),
    title: z.string().min(1),
    goalWords: z.number().int().positive(),
    goalChapters: z.number().int().positive(),
    lexiconSize: z.number().int().nonnegative(),
    chapters: z.array(bookChapterEntrySchema)
  })
  .strict();

// ---------------------------------------------------------------------------
// Progress events
// ---------------------------------------------------------------------------

export const progressEventSchema: z.ZodType<ProgressEvent> = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    deviceId: z.string().min(1),
    type: z.enum([
      "chapter_opened",
      "chapter_finished",
      "chapter_unfinished",
      "translation_revealed",
      "word_reviewed"
    ]),
    payload: z
      .object({
        chapterId: chapterIdSchema.optional(),
        wordId: wordIdSchema.optional(),
        result: z.enum(["known", "unsure"]).optional()
      })
      .strict(),
    createdAt: z.string().datetime(),
    schemaVersion: z.literal(1)
  })
  .strict();

export const eventLogExportSchema: z.ZodType<EventLogExport> = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    events: z.array(progressEventSchema)
  })
  .strict();
