# The story arc — one narrative across 60 chapters

The 60 chapters are **one continuous story**, not 60 separate texts. A reader
who starts at chapter 1 and stops at chapter 40 should feel they have read
part of a book, not forty exercises.

## Premise

A narrator (**Jan**) arrives in a German town with almost no language. He is
taken in by **Karl** and **Eva**, who own a house, and stays for a year. The
sixty chapters are that year. As his German grows, so does what he can say,
think, and ask — the vocabulary *is* the plot.

## Cast (carried forward; introduce nobody who does not return)

| Who | First appears | Role |
|---|---|---|
| Jan — the narrator | ch1 | first person throughout |
| Karl — the man | ch1 | takes him in; says little |
| Eva — the woman | ch1 | the one who first speaks to him |
| Mila — the child by the water | ch2 | the first person he understands; becomes his friend |

## The central device

**The narrator can only say what the reader has learned.** His limits are the
reader's limits, so a word arriving in the lexicon is a real event in the
story. Use this deliberately:

- ch1 has exactly one adjective available (`gut`), so the prose is bare — that
  bareness *is* his arrival.
- In ch2 he wants to say who he is and cannot: `Name` does not exist until
  rank 135.
- In ch3 `Name` (135) finally arrives, so he asks, and the three of them
  exchange names. That beat has been waiting two chapters.

Look for the next such payoff whenever a chapter's band contains a word the
story has been unable to reach.

## Shape of the year (bands of chapters)

| Chapters | Words | Beat |
|---|---|---|
| 1–3 ✅ | 1–150 | Arrival. He stays. He learns the names. |
| 4–12 ✅ | 151–600 | The house and the work. Autumn to summer: the world is named, winter work, illness, the letter, a room of his own, the market, the festival. Ends with a word Jan cannot catch. |
| 13–24 | 601–1200 | The town opens up. He can hold a conversation and gets things wrong. |
| ↳ 13–15 ✅ | 601–750 | Karl's unpaid bill; Jan goes to the office, is confidently wrong, apologises, and takes on the cheese contract. Autumn returns — one year since chapter 1. |
| ↳ 16–20 ✅ | 751–1000 | The cheese business; Karl injures his arm and falls ill; Jan runs everything alone and nurses him; the police ask about a crime; Eva tells Jan the secret — the doctor is Karl's brother. |
| ↳ 21–24 | 1001–1200 | *next to write* — the aftermath of the secret; Jan must decide whether to be a witness. |
| 25–40 | 1201–2000 | Something goes wrong that language cannot fix. Winter. |
| 41–52 | 2001–2600 | He works, argues properly for the first time, is understood. |
| 53–60 | 2601–3000 | The year closes. He can tell the story you have just read. |

### Threads left open (pick these up, don't invent new ones)

- The **doctor** is Karl's brother (revealed ch20). There was a suspicion in
  Karl's youth and no proof. The doctor has written a report; its contents are
  still not fully known to Jan.
- **The court needs a witness** (ch19). Jan said nothing. He has not yet
  decided, and the police are still looking.
- The **cheese business** now has a bank loan behind it (ch19) — it can still
  fail, and Karl's arm has not healed.
- **Mila** is growing up alongside him; she kissed the boy from the school in
  ch11, turned serious in ch12, and nursed Karl with Jan in ch18.

## Rules for writing a chapter

1. **Exactly 50 new words**, the next band by frequency rank.
2. **Use only words introduced in this chapter or earlier.** `npm run validate`
   enforces this and names the chapter where the word is actually taught.
3. **Mark the first occurrence only** of each new word with
   `{{de-NNNN|surface form}}`. Marking every occurrence turns the page into a
   wall of highlighter.
4. **Continue from the previous chapter.** Open where the last one closed, or
   clearly later in the same thread. Never reset the scene.
5. **Every new word must appear in the story**, not just the table — also
   enforced by `npm run validate`.
6. The grammar note explains something the chapter's own sentences do.
7. German and English paragraph arrays must be the same length (1:1).

## A note on how the bands shape each chapter

The frequency list arrives in clumps, and it is easier to write with that than
against it. Ranks 151–200 are almost all nouns, 201–250 almost all verbs,
251–300 almost all adjectives, 301–350 the connectives. So chapter 4 became a
naming chapter, chapter 5 a chapter of doing, chapter 6 a chapter of describing
(and of illness, because adjectives want a body to describe), and chapter 7 the
one where Jan can finally argue, because that is where *weil* and *obwohl*
arrive. Let the band suggest the scene.
