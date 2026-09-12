# K-Type

A Korean typing trainer that shows you *how* Hangul assembles.

**[Try it →](https://workmate.tools/ktype/?ui=en&target=ko)** · No signup, nothing stored, runs entirely in your browser.

---

## Why

Korean is alphabetic, but it's written in syllable blocks. You type `ㅎ`, then `ㅏ`,
then `ㄴ`, and the three letters fuse into `한` — one block. Every Korean keyboard runs
a small state machine to do this.

Most Korean typing trainers assume you already know that and just throw sentences at
you. K-Type makes the assembly visible: a track under the cursor shows
**initial / medial / final** filling as you type, and the block grows in place the way
a real IME does.

I built it after watching coworkers from Vietnam and China fight a keyboard nobody had
ever explained to them.

## The interesting part: 받침 migration

The IME state machine is trickier than it looks. Type `간` (g-a-n), then `ㅏ`. The `ㄴ`
can't stay — a syllable can't begin with a bare vowel. It migrates forward:

```
ㄱㅏㄴ      → 간
ㄱㅏㄴ + ㅏ → 가나     the final consonant becomes the next initial
```

With a **double final** (겹받침) only the *second* consonant moves:

```
ㄷㅏㄹㄱ      → 닭
ㄷㅏㄹㄱ + ㅏ → 달가    ㄹ stays, ㄱ moves
```

Naive implementations get this wrong constantly. The rules are pinned by tests in
[`src/hangul/ime.test.ts`](src/hangul/ime.test.ts).

## Two keyboard layouts

**두벌식 (2-set)** — the standard desktop layout. Consonants left, vowels right.

**천지인 (Cheonjiin)** — the phone layout, and the part worth a look even if you never
type Korean. Ten keys: seven consonant keys that cycle on repeat taps, and three vowel
keys — `ㅣ`, `ㆍ`, `ㅡ`. Every Korean vowel is composed from those three, because that is
how the alphabet was designed in 1443: `ㅣ` for the standing human, `ㅡ` for flat earth,
`ㆍ` for heaven. A 15th-century compositional scheme that happens to fit a numeric keypad.

## What's in it

- **Speed check** — 15-second warm-up, CPM and accuracy
- **Practice** — graded drills from single jamo to full sentences
- **Games** — falling words, bubble pop, tower defense, all typing-driven
- Sentences are things you'd actually say (`이름이 뭐예요` — *what's your name*), with
  romanization and an English gloss
- UI in Korean or English, independent of the language you're practicing
  (`?ui=en&target=ko` opens English UI + Korean practice)

## Stack

React 19 · TypeScript · Vite · Zustand · Tailwind CSS v4

No backend, no analytics, no cookies. Settings live in `localStorage`.

## Develop

```bash
npm install
npm run dev
npm test        # 1,287 tests across 13 files
npm run build
```

The Hangul engine (`src/hangul/`) is pure and dependency-free — `dubeolsik.ts` maps keys
to jamo, `ime.ts` runs the composition state machine, `syllable.ts` packs jamo into
Unicode syllable blocks. If you want to poke at edge cases, start there.

## License

MIT — see [LICENSE](LICENSE).

---

한국어 사용자에게: 한글 자모가 어떻게 한 음절로 합쳐지는지 보여주는 타자 연습기입니다.
두벌식과 천지인 자판을 모두 지원하고, 받침이 다음 글자로 넘어가는 규칙까지 실제 IME 처럼 동작합니다.
회원가입 없이 [바로 사용](https://workmate.tools/ktype/)하실 수 있습니다.
