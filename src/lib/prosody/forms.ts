import type { FormResult, Language, LineAnalysis } from './types'

export interface FormSpec {
  id: string
  name: string
  tradition: 'it' | 'en' | 'both'
  description: string
  /** Exact number of lines the form needs (sonnet: 14, villanelle: 19, haiku: 3...). */
  totalLines?: number
  /** Per-stanza line counts; the last entry repeats for stanzaic poems. */
  stanzaPattern?: number[]
  /** Rhyme scheme per stanza as increasing class numbers; null = unconstrained stanza. */
  rhymeSchemes?: (number[] | null)[]
  /** When true, classes repeat fresh in each stanza (ABAB in every quatrain). */
  localClasses?: boolean
  /** Per-line metrical-count targets (flattened, repeats). */
  lineCounts?: number[]
  countMode?: 'metrical' | 'raw'
  /** Fractional tolerance around each line-count target. */
  countTolerance?: number
  unrhymed?: boolean
  /** Terza rima: chained tercets ABA BCB CDC... */
  terza?: boolean
  /** Villanelle: 5 tercets + closing quatrain, three rhymes. */
  villanelle?: boolean
}

export const FORM_CATALOG: FormSpec[] = [
  {
    id: 'en-sonnet',
    name: 'Sonnet (Shakespearean)',
    tradition: 'en',
    description:
      '14 lines in iambic pentameter, rhymed ABAB CDCD EFEF GG — three quatrains and a closing couplet.',
    totalLines: 14,
    stanzaPattern: [4, 4, 4, 2],
    rhymeSchemes: [[1, 2, 1, 2], [3, 4, 3, 4], [5, 6, 5, 6], [7, 7]],
    lineCounts: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    countMode: 'metrical',
  },
  {
    id: 'it-sonnet',
    name: 'Sonetto (Petrarchan / Italian)',
    tradition: 'it',
    description:
      '14 endecasillabi in two quatrains (ABBA ABBA) and two tercets; the sestet may be CDE CDE, CDC DCD, CDD CDD...',
    totalLines: 14,
    stanzaPattern: [4, 4, 3, 3],
    rhymeSchemes: [[1, 2, 2, 1], [1, 2, 2, 1], null, null],
    lineCounts: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    countMode: 'metrical',
  },
  {
    id: 'ottava-rima',
    name: 'Ottava rima',
    tradition: 'both',
    description: 'Eight hendecasyllables / pentameter lines rhyming ABABABCC.',
    stanzaPattern: [8],
    localClasses: true,
    rhymeSchemes: [[1, 2, 1, 2, 1, 2, 3, 3]],
    lineCounts: [11, 11, 11, 11, 11, 11, 11, 11],
    countMode: 'metrical',
  },
  {
    id: 'strambotto',
    name: 'Strambotto',
    tradition: 'it',
    description: 'Eight endecasillabi rhyming ABABABAB or ABABABCC.',
    stanzaPattern: [8],
    localClasses: true,
    rhymeSchemes: [[1, 2, 1, 2, 1, 2, 3, 3]],
    lineCounts: [11, 11, 11, 11, 11, 11, 11, 11],
    countMode: 'metrical',
  },
  {
    id: 'rispetto',
    name: 'Rispetto',
    tradition: 'it',
    description: 'Eight lines, mostly endecasillabi with an ottava-like or alternating rhyme.',
    stanzaPattern: [8],
    localClasses: true,
    rhymeSchemes: [[1, 2, 1, 2, 1, 2, 3, 3]],
    lineCounts: [11, 11, 11, 11, 11, 11, 11, 11],
    countMode: 'metrical',
  },
  {
    id: 'terza-rima',
    name: 'Terza rima',
    tradition: 'both',
    description: 'Chained tercets ABA BCB CDC... closing on a couplet; Dante\'s measure.',
    terza: true,
    lineCounts: [11, 11, 11],
    countMode: 'metrical',
  },
  {
    id: 'rime-royal',
    name: 'Rime royal',
    tradition: 'both',
    description: 'Seven pentameters / hendecasyllables rhyming ABABBCC.',
    stanzaPattern: [7],
    localClasses: true,
    rhymeSchemes: [[1, 2, 1, 2, 3, 3, 2]],
    lineCounts: [10, 10, 10, 10, 10, 10, 10],
    countMode: 'metrical',
  },
  {
    id: 'ballad',
    name: 'Ballad stanza (common meter)',
    tradition: 'en',
    description: 'Quatrains of 8·6·8·6 syllables rhyming ABCB or ABAB.',
    stanzaPattern: [4],
    localClasses: true,
    rhymeSchemes: [[3, 1, 4, 1], [1, 2, 1, 2]],
    lineCounts: [8, 6, 8, 6],
    countMode: 'metrical',
    countTolerance: 1,
  },
  {
    id: 'common-measure',
    name: 'Common measure',
    tradition: 'en',
    description: 'Quatrains 8·6·8·6 rhyming ABAB.',
    stanzaPattern: [4],
    localClasses: true,
    rhymeSchemes: [[1, 2, 1, 2]],
    lineCounts: [8, 6, 8, 6],
    countMode: 'metrical',
    countTolerance: 1,
  },
  {
    id: 'short-measure',
    name: 'Short measure',
    tradition: 'en',
    description: 'Quatrains 6·6·8·6 rhyming ABAB.',
    stanzaPattern: [4],
    localClasses: true,
    rhymeSchemes: [[1, 2, 1, 2]],
    lineCounts: [6, 6, 8, 6],
    countMode: 'metrical',
    countTolerance: 1,
  },
  {
    id: 'long-measure',
    name: 'Long measure',
    tradition: 'en',
    description: 'Quatrains of octosyllables rhyming AABB.',
    stanzaPattern: [4],
    localClasses: true,
    rhymeSchemes: [[1, 1, 2, 2]],
    lineCounts: [8, 8, 8, 8],
    countMode: 'metrical',
    countTolerance: 1,
  },
  {
    id: 'villanelle',
    name: 'Villanelle',
    tradition: 'both',
    description: 'Five tercets ABA and a closing quatrain ABAA, built from two refrains.',
    villanelle: true,
    totalLines: 19,
    lineCounts: [10, 10, 10],
    countMode: 'metrical',
  },
  {
    id: 'sapphic',
    name: 'Sapphic stanza',
    tradition: 'both',
    description: 'Three hendecasyllables / 11-syllable lines followed by the short "adonic" of five syllables.',
    stanzaPattern: [4],
    localClasses: true,
    lineCounts: [11, 11, 11, 5],
    countMode: 'metrical',
    countTolerance: 0,
  },
  {
    id: 'limerick',
    name: 'Limerick',
    tradition: 'en',
    description: 'Five anapaestic lines AABBA; three long lines followed by two short.',
    stanzaPattern: [5],
    localClasses: true,
    rhymeSchemes: [[1, 1, 2, 2, 1]],
    lineCounts: [9, 9, 6, 6, 9],
    countMode: 'metrical',
    countTolerance: 2,
  },
  {
    id: 'haiku',
    name: 'Haiku',
    tradition: 'both',
    description: 'Three lines of 5-7-5 syllables, unrhymed.',
    totalLines: 3,
    stanzaPattern: [3],
    rhymeSchemes: [null],
    unrhymed: true,
    lineCounts: [5, 7, 5],
    countMode: 'raw',
    countTolerance: 0,
  },
  {
    id: 'tanka',
    name: 'Tanka',
    tradition: 'both',
    description: 'Five lines of 5-7-5-7-7 syllables, unrhymed.',
    totalLines: 5,
    stanzaPattern: [5],
    rhymeSchemes: [null],
    unrhymed: true,
    lineCounts: [5, 7, 5, 7, 7],
    countMode: 'raw',
    countTolerance: 0,
  },
  {
    id: 'blank-verse',
    name: 'Blank verse',
    tradition: 'en',
    description: 'Unrhymed iambic pentameter.',
    unrhymed: true,
    lineCounts: [10],
    countMode: 'metrical',
    countTolerance: 1,
  },
]

interface FlatLine {
  i: number
  length: number
  letter: string | undefined
}

function flatLinesOf(lines: LineAnalysis[], mode: 'metrical' | 'raw'): FlatLine[] {
  return lines.map((ln, i) => ({
    i,
    length: mode === 'raw' ? ln.rawSyllables : ln.metricalCount,
    letter: ln.rhymeLetter,
  }))
}

function makeClassMaker() {
  let n = -1
  return () => {
    n++
    return `c${n}`
  }
}

function terzaExpected(lines: LineAnalysis[]): (string | null)[] {
  const next = makeClassMaker()
  const a = next()
  const b = next()
  const out: (string | null)[] = [a, b, a]
  let prev = b
  for (let start = 3; start < lines.length; start += 3) {
    const chunk = lines.slice(start, start + 3)
    if (chunk.length <= 2) {
      out.push(prev, prev)
      break
    }
    const mid = next()
    out.push(prev, mid, prev)
    prev = mid
  }
  return out
}

function villanelleExpected(): (string | null)[] {
  return [
    'r', 'a', 'b', // tercet 1: A1 b A2
    'c', 'b', 'r', // tercet 2: a b A1
    'c', 'b', 'r', // tercet 3: a b A2
    'c', 'b', 'r', // tercet 4: a b A1
    'c', 'b', 'r', // tercet 5: a b A2
    'c', 'b', 'r', 'r', // closing quatrain: a b A1 A2
  ]
}

function buildExpected(poem: FlatLine[], spec: FormSpec): (string | null)[] {
  if (spec.terza) return terzaExpected(poem as unknown as LineAnalysis[])
  if (spec.villanelle) return villanelleExpected()

  const pattern = spec.stanzaPattern ?? [poem.length]
  const schemes = spec.rhymeSchemes ?? []
  const out: (string | null)[] = []
  const next = makeClassMaker()
  const keyToClass = new Map<string, string>()

  let start = 0
  let stanza = 0
  while (start < poem.length) {
    const chunkSize = pattern[stanza % pattern.length]
    const chunk = poem.slice(start, start + chunkSize)
    const scheme = schemes[stanza % schemes.length]
    if (!scheme || scheme.length === 0) {
      chunk.forEach(() => out.push(null))
    } else {
      chunk.forEach((_, k) => {
        const v = scheme[k]
        if (v === undefined) {
          out.push(null)
          return
        }
        const key = spec.localClasses
          ? `l${Math.floor(stanza / (schemes.length || 1))}:${v}`
          : `v${v}`
        let cls = keyToClass.get(key)
        if (!cls) {
          cls = next()
          keyToClass.set(key, cls)
        }
        out.push(cls)
      })
    }
    start += chunkSize
    stanza++
  }
  return out
}

function matchRhyme(poem: FlatLine[], expected: (string | null)[]): number {
  const positions: { exp: string; got: string | undefined }[] = []
  expected.forEach((e, i) => {
    if (e !== null && i < poem.length) positions.push({ exp: e, got: poem[i].letter })
  })
  if (positions.length === 0) return 1

  const classLetter: Record<string, string | undefined> = {}
  let constraints = 0
  let satisfied = 0
  for (const p of positions) {
    if (classLetter[p.exp] === undefined) {
      classLetter[p.exp] = p.got
    } else {
      constraints++
      if (classLetter[p.exp] === p.got) satisfied++
    }
  }
  const letters = Object.values(classLetter).filter((l) => l !== undefined) as string[]
  const distinct = new Set(letters).size
  const distinctScore = distinct === letters.length ? 1 : Math.max(0, distinct / Math.max(1, letters.length))
  const pairScore = constraints === 0 ? 1 : satisfied / constraints
  return pairScore * 0.7 + distinctScore * 0.3
}

function matchLengths(poem: FlatLine[], spec: FormSpec): { score: number; matched: boolean[] } {
  const targets = spec.lineCounts ?? []
  const tol = spec.countTolerance ?? 1
  if (targets.length === 0) return { score: 1, matched: poem.map(() => true) }
  let hits = 0
  const matched: boolean[] = []
  for (const ln of poem) {
    const t = targets[ln.i % targets.length]
    const ok = Math.abs(ln.length - t) <= tol
    if (ok) hits++
    matched.push(ok)
  }
  return { score: hits / poem.length, matched }
}

function structureShape(spec: FormSpec, lineCount: number): number {
  if (spec.totalLines !== undefined) return lineCount === spec.totalLines ? 1 : 0
  if (!spec.stanzaPattern) return 1
  const perStanza = spec.stanzaPattern.reduce((a, b) => a + b, 0)
  return lineCount % perStanza === 0 ? 1 : Math.max(0, 1 - (lineCount % perStanza) / perStanza)
}

function rhymeDensityOf(lines: LineAnalysis[]): number {
  const counts = new Map<string, number>()
  for (const ln of lines) {
    if (!ln.rhymeLetter) continue
    counts.set(ln.rhymeLetter, (counts.get(ln.rhymeLetter) ?? 0) + 1)
  }
  let repeated = 0
  for (const c of counts.values()) if (c >= 2) repeated += c
  return lines.length === 0 ? 0 : repeated / lines.length
}

export interface DetectionInput {
  lines: LineAnalysis[]
  language: Language
  rhymeDensity: number
}

export function detectForms(input: DetectionInput): FormResult[] {
  const { lines, language } = input
  const density = rhymeDensityOf(lines)
  const results: FormResult[] = []

  for (const spec of FORM_CATALOG) {
    if (spec.tradition !== 'both' && spec.tradition !== language) continue

    const poem = flatLinesOf(lines, spec.countMode ?? 'metrical')
    if (spec.totalLines !== undefined && poem.length !== spec.totalLines) continue

    const expected = buildExpected(poem, spec)
    const len = matchLengths(poem, spec)
    const shape = structureShape(spec, poem.length)

    let rhyme = matchRhyme(poem, expected)
    if (spec.unrhymed) {
      rhyme = density === 0 ? 1 : Math.max(0, 0.5 - density)
    }

    const wLen = 0.45
    const wRh = 0.35
    const wShape = 0.2
    const score = len.score * wLen + rhyme * wRh + shape * wShape

    results.push({
      id: spec.id,
      name: spec.name,
      tradition: spec.tradition,
      description: spec.description,
      score,
      breakdown: [
        { label: 'Line lengths', score: len.score, weight: wLen },
        { label: 'Rhyme scheme', score: rhyme, weight: wRh },
        { label: 'Stanza shape', score: shape, weight: wShape },
      ],
      matchedLines: len.matched.map((m) => (m ? 1 : 0)),
      matchedLinesCount: len.matched.filter(Boolean).length,
      totalLines: len.matched.length,
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

export function bestForm(results: FormResult[]): FormResult | undefined {
  return results.find((r) => r.score >= 0.72)
}