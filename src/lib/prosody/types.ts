export type Language = 'en' | 'it'

/** Position of the last strong accent of a word/line, per Italian metric nomenclature. */
export type EndingClass = 'tronco' | 'piano' | 'sdrucciolo' | 'bisdrucciolo'

export interface WordAnalysis {
  /** Token as it appears in the text. */
  text: string
  /** Normalized form used for lookups. */
  base: string
  /** Syllable nuclei as counted. */
  nuclei: string[]
  syllables: number
  /** Index (0-based) of the primary stress within nuclei. */
  stressIndex: number
  /** Per-word ending class. */
  ending: EndingClass
  /** True when the analysis came from a dictionary/hand rule rather than a guess. */
  certain: boolean
  /** Language-specific note (e.g. 'diphthong', 'hiatus', 'error'). */
  note?: string
  /** Phonetic rhyme key (English, from the CMU dictionary). */
  phonicKey?: string
  /** All plausible rhyme keys for this word (CMU primary + later-vowel variants). */
  phonicKeys?: string[]
}

export interface LineAnalysis {
  /** Original line text. */
  text: string
  language: Language
  words: WordAnalysis[]
  /** Raw syllable count before end-of-line normalization. */
  rawSyllables: number
  /** Syllable count normalized to the end-line accent (metrical count). */
  metricalCount: number
  ending: EndingClass
  /** 1-based position of the line's final strong accent within metricalCount. */
  accentPosition: number
  /** Number of cross-word merges applied (sinalefe / elision). */
  merges: number
  rhymeKey: string
  /** Assigned rhyme-class letter (A, B, ...), or undefined when unique/unmatched. */
  rhymeLetter?: string
  /** All rhyme keys this line can match on (set-intersection used for rhyming). */
  rhymeKeys: string[]
  /** Human-readable line type, e.g. "endecasillabo", "iambic pentameter". */
  lineName: string
  /** Short flags for the UI. */
  warnings: string[]
}

export interface StanzaGroup {
  lines: LineAnalysis[]
}

export interface FormResult {
  id: string
  name: string
  tradition: 'it' | 'en' | 'both'
  description: string
  score: number
  breakdown: { label: string; score: number; weight: number }[]
  matchedLines: number[]
  matchedLinesCount: number
  totalLines: number
  detail?: string
}

export interface PoemAnalysis {
  lines: LineAnalysis[]
  /** Blank-line-separated stanzas (or a single grouping). */
  stanzas: StanzaGroup[]
  rhymeScheme: string[]
  /** Dominant metrical count across lines. */
  dominantCount: number
  rhymeDensity: number
  forms: FormResult[]
  read: string
}

export interface LineLengthSpec {
  /** Target metrical counts accepted, per line. */
  it?: number[]
  en?: number[]
  /** Allow +/- tolerance on the count. */
  tolerance?: number
}