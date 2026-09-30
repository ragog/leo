# Leo

A metrical scanner for Italian and English poetry. Analyzes meter, syllable count, sinalefe, rhyme schemes, and detects poetic forms.

## Features

- **Syllable counting** with language-specific rules (Italian sinalefe, English stress patterns)
- **Rhyme scheme detection** and classification
- **Poetic form recognition**: sonnets, terza rima, haiku, endecasillabi, etc.
- **Word-level detail**: stress patterns, nuclei, ending classes (piano/tronco/sdrucciolo)
- **Elision handling**: correctly processes apostrophes (c'è, l'amore, etc.)

## Usage

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and paste a poem. Try the built-in examples (Dante, Leopardi, Shakespeare).

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm test` — run tests
- `npm run check` — TypeScript validation

## Algorithm

Italian syllable counting uses vowel nucleus detection with diphthong/hiatus rules and a lexicon for irregular words. Sinalefe merges adjacent vowels across word boundaries, with transparent handling of elided consonants (c, g, m, t). English uses the CMU Pronouncing Dictionary for phoneme-based syllable counting.

Form detection scores candidates by rhyme scheme match, line length consistency, and stanza structure.
