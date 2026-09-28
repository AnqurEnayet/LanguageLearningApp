import type { Word } from "../domain/types";

/** "die Frau" for nouns, plain lemma otherwise. */
export function wordLabel(word: Word): string {
  return word.article ? `${word.article} ${word.lemma}` : word.lemma;
}
