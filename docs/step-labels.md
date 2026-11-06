# Step labels: the rulebook

Every step of an amud has one of eight labels (the `hebrewStepName` field). The label sets the step's colour, the sugya map, and what "Guess the kind" tells a learner is correct, so the same thing must always get the same label. These rules were set by David on Nov 6 2026. Change a label only through `tools/apply-repairs.mjs` (field `hebrewStepName`).

| Label | English | Use it for |
|---|---|---|
| מימרא | Statement | A teaching, ruling, opinion or line of a story is stated. |
| שאלה | Question | Someone asks for information or a source (מנא הני מילי, מאי טעמא, היכי דמי, בעי). |
| תשובה | Response | The answer to a Question. |
| קשיא | Challenge | An objection: this seems to contradict something. |
| תירוץ | Resolution | A Challenge is answered. |
| ראיה | Proof | A source is brought to support a position (תא שמע as support, תניא נמי הכי, מסייע ליה, שמע מינה as an inference). |
| דחיה | Rejection | A Proof is pushed aside: it doesn't have to mean that (דילמא, לא, הכא במאי עסקינן answering a proof). |
| מסקנא | Conclusion | Where the discussion lands. |

## The rules

1. **A source quoted to attack something is a Challenge, never a Proof.** A ברייתא or משנה brought with מיתיבי, איתיביה, והתניא, והא תנן, ורמינהו, or a תא שמע that turns out to contradict, is קשיא, and so is every step that quotes the rest of that same source. (David, Nov 6 2026.)
2. **Rejection is only for pushing aside a Proof.** An objection to an answer, a suggestion, a plan or a defence (וכי תימא…, והתניא knocking out an answer, וליטעמיך) is a Challenge. An answer to any Challenge is a Resolution, even when it is worded הכא במאי עסקינן or דילמא.
3. **Inside a story the same rules apply.** When a character objects to a suggestion or plan, it is a Challenge; the reply that answers it is a Resolution; the rest of the story is Statement. (Recommended by Claude, Nov 6 2026; David to confirm.)
4. **Where a thread ends without an answer, it is a Conclusion.** A תיובתא, a תיקו, and a rabbi simply admitting a challenge (לאו אדעתאי, קאי כוותך, and the like) are all מסקנא: that is where the discussion lands, answered or not. (Teiku as Conclusion: David, Nov 6 2026. Admitted challenge: recommended by Claude; David to confirm.)
5. **Conclusion is never a step in the middle.** A step followed straight away by a challenge to it, or that is only the second half of an answer, a list or a statement, takes the label of the whole it belongs to (usually Resolution or Statement). The second half of anything takes the same label as its first half, including across the amud break.
6. **Question and Response go together.** A Response needs a Question before it; an answer to a Challenge is a Resolution, not a Response.
7. **An answer is labelled as an answer, even when it quotes a source.** When a Question or Challenge is answered by citing a pasuk, a ברייתא or a rabbi (מאי טעמא? אמר קרא…; אין, דהכי אמר…), the step is Response (to a Question) or Resolution (to a Challenge), not Proof. Proof is for a source brought to support a position that nobody asked about.
8. **Story lines and illustrations are Statements.** Events in a story, and a מעשה told inside a ברייתא or משנה, are מימרא unless the Gemara itself uses them as a proof (e.g. ומעשה… brought with תא שמע, or followed by שמע מינה).
9. **A question and its תיקו in one step are a Conclusion** (rule 4), not a Question.
10. **Borderline Question vs Challenge** (למה לי, פשיטא, מנא הני מילי) is left as the data has it until a later decision.
