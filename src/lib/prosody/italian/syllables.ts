import type { EndingClass, WordAnalysis } from '../types'
import { isItVowelChar, stripAccents, normalizeItWord, ITALIAN_ACCENTS, DIACHRESIS } from '../text'
import { ITALIAN_LEXICON } from './lexicon'

/** Consonant sequences that palatalise a following '-i' into a glide ('-gia', '-scia', '-glie'). */
const PALATAL_PRECEDERS = new Set(['c', 'g', 'ch', 'gh', 'sc', 'gl', 'gn'])

interface Segment {
  text: string
  start: number
}

export interface ItWordDetail {
  analysis: WordAnalysis
  /** Orthographic offset of each nucleus within the base. */
  starts: number[]
  /** Raw lowercased, accent-stripped base used for lookups. */
  lookup: string
}

function groupRuns(base: string): Segment[] {
  const runs: Segment[] = []
  let i = 0
  while (i < base.length) {
    if (isItVowelChar(base[i])) {
      let j = i
      while (j < base.length && isItVowelChar(base[j])) j++
      runs.push({ text: base.slice(i, j), start: i })
      i = j
    } else {
      i++
    }
  }
  return runs
}

/** Letters of a vowel group that count as strong (a, e, o and accented weaks). */
function strongPositions(group: string): number[] {
  const out: number[] = []
  for (let i = 0; i < group.length; i++) {
    const ch = group[i].toLowerCase()
    const base = stripAccents(ch)
    const accentedWeak = (ch === 'í' || ch === 'ì' || ch === 'ú' || ch === 'ù') && (base === 'i' || base === 'u')
    if (base === 'a' || base === 'e' || base === 'o' || accentedWeak) out.push(i)
  }
  return out
}

function splitGroup(group: string): string[] {
  if (group.split('').some((ch) => DIACHRESIS[ch.toLowerCase()] !== undefined)) {
    return group.split('')
  }
  const strongs = strongPositions(group)
  if (strongs.length === 0) return [group]
  if (strongs.length === 1) return [group]

  const parts: string[] = []
  for (let s = 0; s < strongs.length; s++) {
    const startIdx = s === 0 ? 0 : strongs[s]
    const endIdx = s + 1 < strongs.length ? strongs[s + 1] : group.length
    const piece = group.slice(startIdx, endIdx)
    if (piece) parts.push(piece)
  }
  if (parts.length === 0) parts.push(group)
  return parts
}

function consonantBefore(base: string, start: number): string {
  let idx = start - 1
  let s = ''
  while (idx >= 0 && !isItVowelChar(base[idx]) && base[idx] !== "'") {
    s = base[idx] + s
    idx--
  }
  return s
}

/** Splits a normalized Italian word into its syllable nuclei, applying the
 *  diphthong/hiatus rules and lexicon overrides. */
function segmentNuclei(lookup: string): { nuclei: string[]; starts: number[] } {
  const lexicon = ITALIAN_LEXICON[lookup]
  const runs = groupRuns(lookup)
  let nuclei: string[] = []
  let starts: number[] = []

  for (const run of runs) {
    // Separate runs into nuclei, then handle word-contextual final groups below.
    const split = splitGroup(run.text)
    for (let k = 0; k < split.length; k++) {
      const runStart = run.start + run.text.indexOf(split[k])
      nuclei.push(split[k])
      starts.push(runStart)
    }
  }

  // Word-contextual rules (only when not overridden by the lexicon).
  if (!lexicon) {
    // Word-final '-i' + strong: hiatus unless a palatal cluster precedes, in which
    // case the 'i' is a glide (vowel-final words like via/mio/zio split; and the
    // '-ìa'-type nouns such as follia split too).
    const lastNucleus = nuclei[nuclei.length - 1]
    if (lastNucleus && lastNucleus.length === 2 && lastNucleus[0] === 'i' && /[aeo]/.test(stripAccents(lastNucleus[1]).toLowerCase())) {
      const preceding = consonantBefore(lookup, starts[starts.length - 1])
      if (!PALATAL_PRECEDERS.has(preceding)) {
        const base = starts[starts.length - 1]
        starts = [...starts.slice(0, -1), base, base + 1]
        nuclei = [...nuclei.slice(0, -1), lastNucleus[0], lastNucleus[1]]
      }
    }
  }

  if (lexicon) {
    if (lexicon.n !== nuclei.length) {
      const pad = Array.from({ length: lexicon.n }, (_, i) => nuclei[i % Math.max(1, nuclei.length)] ?? '*')
      nuclei = pad
      starts = Array.from({ length: lexicon.n }, (_, i) => starts[i % Math.max(1, starts.length)] ?? starts[starts.length - 1] ?? 0)
    }
  }

  if (nuclei.length === 0) {
    nuclei = []
    starts = []
  }
  return { nuclei, starts }
}

export function itEndingFor(stressIndex: number, syllables: number): EndingClass {
  if (syllables <= 1) return 'tronco'
  const fromEnd = syllables - stressIndex
  if (fromEnd === 1) return 'tronco'
  if (fromEnd === 2) return 'piano'
  if (fromEnd === 3) return 'sdrucciolo'
  return 'bisdrucciolo'
}

function stressIndexFor(base: string, nuclei: string[], starts: number[]): { index: number; certain: boolean } {
  if (nuclei.length === 0) return { index: 0, certain: true }
  const lex = ITALIAN_LEXICON[base]
  if (lex) return { index: Math.min(lex.acc, nuclei.length - 1), certain: true }

  // Written accent marks the tonic vowel.
  for (let i = 0; i < base.length; i++) {
    const ch = base[i]
    if (ITALIAN_ACCENTS[ch]) {
      for (let n = 0; n < nuclei.length; n++) {
        if (i >= starts[n] && i < starts[n] + nuclei[n].length) {
          return { index: n, certain: true }
        }
      }
    }
  }
  // Words ending in a consonant carry the accent on the final vowel.
  if (!isItVowelChar(base[base.length - 1]) && nuclei.length > 1) {
    return { index: nuclei.length - 1, certain: true }
  }
  // Common sdrucciolo suffixes.
  if (/(abile|ibile|evole|vole)$/.test(base) && nuclei.length >= 3) {
    return { index: nuclei.length - 3, certain: true }
  }
  // Passato-remoto type: two syllables ending in a falling diphthong are tronche.
  if (nuclei.length === 2 && /(ai|ei|oi|ui)$/.test(base)) {
    return { index: 1, certain: true }
  }
  if (nuclei.length <= 1) return { index: 0, certain: true }
  // Default: penult ('parola piana'), the most frequent pattern.
  return { index: nuclei.length - 2, certain: false }
}

export function analyzeItWordDetail(text: string): ItWordDetail {
  const lookup = normalizeItWord(text)
  const { nuclei, starts } = segmentNuclei(lookup)
  const stress = stressIndexFor(lookup, nuclei, starts)
  const ending = itEndingFor(stress.index, nuclei.length)

  const analysis: WordAnalysis = {
    text,
    base: lookup,
    nuclei,
    syllables: nuclei.length,
    stressIndex: stress.index,
    ending,
    certain: stress.certain,
    note: stress.certain ? 'rule/lexicon' : 'accent estimated',
  }
  return { analysis, starts, lookup }
}

export function analyzeItWord(text: string): WordAnalysis {
  return analyzeItWordDetail(text).analysis
}