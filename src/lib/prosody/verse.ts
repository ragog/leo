import type { EndingClass, Language, LineAnalysis, PoemAnalysis, StanzaGroup, WordAnalysis } from './types'
import { analyzeEnWord } from './english'
import { analyzeItWord } from './italian'
import { lineName } from './names'
import { tokenizeLine, splitElisions, startsWithVowelSound, endsWithVowelSound, stripAccents } from './text'

export function metricalAdjust(ending: EndingClass, language: Language): number {
  switch (ending) {
    case 'tronco':
      return language === 'it' ? 1 : 0
    case 'piano':
      return 0
    case 'sdrucciolo':
      return -1
    case 'bisdrucciolo':
      return -2
  }
}

/** Orthographic rhyme key for a word: from its stressed nucleus's first letter to the end. */
export function orthographicRhymeKey(base: string, nuclei: string[], stressIndex: number): string {
  const cleaned = base.replace(/[^a-zàèéìíóòùúäëïöü]/g, '').toLowerCase()
  if (nuclei.length === 0 || stressIndex >= nuclei.length) return cleaned
  let cursor = 0
  for (let i = 0; i < stressIndex; i++) {
    const found = cleaned.indexOf(nuclei[i][0], cursor)
    if (found === -1) break
    cursor = found + nuclei[i].length
  }
  const rest = stripAccents(cleaned.slice(cursor))
  return rest
}

function itLastAccentStats(words: WordAnalysis[], totalSyllables: number): { accentPosition: number; ending: EndingClass } {
  const withVowels = words.filter((w) => w.syllables > 0)
  const last = withVowels[withVowels.length - 1]
  if (!last) return { accentPosition: Math.max(1, totalSyllables), ending: 'piano' }
  const tail = last.syllables - last.stressIndex - 1
  return { accentPosition: Math.max(1, totalSyllables - tail), ending: last.ending }
}

export function analyzeLine(language: Language, text: string): LineAnalysis {
  const tokens = tokenizeLine(text)
  const warnings: string[] = []

  if (tokens.length === 0) {
    return {
      text,
      language,
      words: [],
      rawSyllables: 0,
      metricalCount: 0,
      ending: 'piano',
      accentPosition: 0,
      merges: 0,
      rhymeKey: '',
      rhymeKeys: [],
      lineName: '',
      warnings,
    }
  }

  if (language === 'en') {
    const words = tokenizeLine(text).map((t) => analyzeEnWord(t))
    const raw = words.reduce((s, w) => s + w.syllables, 0)
    const { accentPosition, ending } = itLastAccentStats(words, raw)
    const metrical = accentPosition
    const last = words[words.length - 1]
    const phonicKeys = last.phonicKeys && last.phonicKeys.length ? last.phonicKeys : undefined
    const rhymeKeys = phonicKeys ?? [orthographicRhymeKey(last.base, last.nuclei, last.stressIndex)]
    const rhymeKey = rhymeKeys[0]
    if (!last.certain) warnings.push('final word stress estimated')
    return {
      text,
      language,
      words,
      rawSyllables: raw,
      metricalCount: metrical,
      ending,
      accentPosition,
      merges: 0,
      rhymeKey,
      rhymeKeys,
      lineName: lineName(metrical, 'en'),
      warnings,
    }
  }

  const words = splitElisions(tokens).map((t) => analyzeItWord(t))
  const sum = words.reduce((s, w) => s + w.syllables, 0)

  // Italian elided consonants that are transparent for sinalefe
  // Only single consonants that are sonorants or simple stops
  const TRANSPARENT_ELISIONS = new Set(['c', 'g', 'm', 't'])

  let merges = 0
  // Build a list of syllabic words, tracking if there are only transparent elisions between them
  const syllabicIndices: number[] = []
  for (let i = 0; i < words.length; i++) {
    if (words[i].syllables > 0) syllabicIndices.push(i)
  }
  
  for (let si = 0; si < syllabicIndices.length - 1; si++) {
    const i = syllabicIndices[si]
    const j = syllabicIndices[si + 1]
    const a = words[i]
    const b = words[j]
    
    // Check if all words between i and j are transparent elisions
    let allTransparent = true
    for (let k = i + 1; k < j; k++) {
      if (words[k].syllables > 0 || !TRANSPARENT_ELISIONS.has(words[k].base)) {
        allTransparent = false
        break
      }
    }
    
    if (allTransparent) {
      const ends = endsWithVowelSound(a.base, 'it')
      const starts = startsWithVowelSound(b.base, 'it')
      if (ends && starts) merges++
    }
  }
  const raw = Math.max(0, sum - merges)
  const { accentPosition, ending } = itLastAccentStats(words, raw)
  const metrical = accentPosition + 1
  const last = words[words.length - 1]
  const rhymeKey = orthographicRhymeKey(last.base, last.nuclei, last.stressIndex)
  if (merges > 0) warnings.push(`${merges} sinalefe`)
  if (!last.certain) warnings.push('final word accent estimated')
  return {
    text,
    language,
    words,
    rawSyllables: raw,
    metricalCount: metrical,
    ending,
    accentPosition,
    merges,
    rhymeKey,
    rhymeKeys: [rhymeKey],
    lineName: lineName(metrical, 'it'),
    warnings,
  }
}

/** Groups consecutive lines into stanzas. `breakGrid[i]` is true when a blank line
 *  appeared before `lines[i]`; pass all-false to keep a single group. */
export function groupStanzas(lines: LineAnalysis[], breakGrid: boolean[]): StanzaGroup[] {
  if (breakGrid.length !== lines.length) {
    throw new Error('breakGrid must match lines')
  }
  const groups: StanzaGroup[] = []
  let current: LineAnalysis[] = []
  lines.forEach((ln, i) => {
    if (breakGrid[i] && current.length > 0) {
      groups.push({ lines: current })
      current = []
    }
    current.push(ln)
  })
  if (current.length > 0) groups.push({ lines: current })
  else if (groups.length === 0 && lines.length === 0) groups.push({ lines: [] })
  return groups
}

function assignRhymeLetters(lines: LineAnalysis[]): void {
  const letters: { keySet: Set<string>; letter: string }[] = []
  let next = 0
  for (const ln of lines) {
    const unique = [...new Set(ln.rhymeKeys)].filter((k) => k !== '')
    if (unique.length === 0) {
      ln.rhymeLetter = undefined
      continue
    }
    const match = letters.find((group) => unique.some((k) => group.keySet.has(k)))
    if (match) {
      ln.rhymeLetter = match.letter
      for (const k of unique) match.keySet.add(k)
    } else {
      const letter = String.fromCharCode(65 + (next++ % 26))
      letters.push({ keySet: new Set(unique), letter })
      ln.rhymeLetter = letter
    }
  }
}

export { assignRhymeLetters }