import { useMemo } from "react";
import { useApp } from "../../app/AppContext";
import { parseStoryParagraph } from "../../domain/story";
import type { Word } from "../../domain/types";

interface Props {
  paragraphs: string[];
  onWordTap?: (word: Word) => void;
}

/** Renders story paragraphs, turning {{wordId|text}} refs into bold tappable words. */
export function StoryText({ paragraphs, onWordTap }: Props) {
  const { wordsById } = useApp();
  const parsed = useMemo(() => paragraphs.map(parseStoryParagraph), [paragraphs]);

  return (
    <>
      {parsed.map((segments, pi) => (
        <p key={pi}>
          {segments.map((seg, si) => {
            if (seg.kind === "text") return <span key={si}>{seg.text}</span>;
            const word = wordsById.get(seg.wordId);
            if (word && onWordTap) {
              return (
                <button
                  key={si}
                  className="word-ref"
                  onClick={() => onWordTap(word)}
                  title={word.en}
                >
                  {seg.text}
                </button>
              );
            }
            return (
              <strong key={si} className="word-ref">
                {seg.text}
              </strong>
            );
          })}
        </p>
      ))}
    </>
  );
}
