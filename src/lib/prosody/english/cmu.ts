import { EN_VOWEL_PHONEMES } from '../text'

export interface CmuEntry {
  syllables: number
  /** Index of the primary stressed vowel within the ordered list of vowels. */
  stressIndex: number
  /** Phonemes from the stressed vowel (inclusive) to the end. Basis for rhyme keys. */
  rhymePhonemes: string[]
  /** All phonemes of the pronunciation (stress marks stripped). */
  phonemes: string[]
  /** Token positions of every vowel phoneme within `phonemes`. */
  vowelTokens: number[]
}

let cache: Map<string, CmuEntry> | null = null

function parsePronunciation(pron: string): CmuEntry | null {
  const clean = pron.split('#')[0].trim()
  const tokens = clean.split(/\s+/)
  const vowels: { stress: string; tokenIndex: number }[] = []
  const bare = tokens.map((t) => t.replace(/[0-2]$/, ''))
  for (let i = 0; i < tokens.length; i++) {
    const phoneme = bare[i]
    if (EN_VOWEL_PHONEMES.has(phoneme)) {
      const stress = tokens[i].slice(-1)
      if (/[0-2]/.test(stress)) vowels.push({ stress, tokenIndex: i })
    }
  }
  if (vowels.length === 0) return null
  const primary = vowels.find((v) => v.stress === '1') ?? vowels[vowels.length - 1]
  const stressIndex = vowels.indexOf(primary)
  return {
    syllables: vowels.length,
    stressIndex,
    rhymePhonemes: bare.slice(primary.tokenIndex),
    phonemes: bare,
    vowelTokens: vowels.map((v) => v.tokenIndex),
  }
}

/** All plausible rhyme keys for a pronunciation: one from the primary stressed
 *  vowel plus one from each vowel after it. Homographs such as "content"
 *  (noun /ˈkɑːntɛnt/ vs adjective /kənˈtɛnt/) then rhyme through their shared
 *  final-syllable key ("EHNT" with "descent"). */
export function rhymeKeysFor(entry: CmuEntry): string[] {
  const primaryToken = entry.vowelTokens[entry.stressIndex]
  const keys = [entry.rhymePhonemes.join('')]
  for (const v of entry.vowelTokens) {
    if (v > primaryToken) keys.push(entry.phonemes.slice(v).join(''))
  }
  return [...new Set(keys)]
}

async function loadDictionary(): Promise<Map<string, CmuEntry>> {
  if (cache) return cache
  const mod = await import('cmu-pronouncing-dictionary')
  const dict = (mod as { dictionary: Record<string, string> }).dictionary
  cache = new Map()
  for (const [key, pron] of Object.entries(dict)) {
    if (key.includes('(')) continue
    if (key.includes(' ') || key === '') continue
    const entry = parsePronunciation(pron)
    if (entry) cache.set(key, entry)
  }
  return cache
}

export function lookupEnWord(base: string): CmuEntry | undefined {
  if (!cache) return undefined
  const direct = cache.get(base)
  if (direct) return direct
  const alpha = base.replace(/[^a-z]/g, '')
  if (alpha !== base) return cache.get(alpha)
  return undefined
}

export async function ensureCmuLoaded(): Promise<void> {
  await loadDictionary()
}

export function cmuReady(): boolean {
  return cache !== null
}