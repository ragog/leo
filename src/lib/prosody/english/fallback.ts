import { isEnSyllableVowelChar } from '../text'

export interface NucleiInfo {
  nuclei: string[]
  starts: number[]
}

export function vowelNuclei(word: string): NucleiInfo {
  const nuclei: string[] = []
  const starts: number[] = []
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    if (isEnSyllableVowelChar(ch, i, word)) {
      const cur = nuclei[nuclei.length - 1]
      if (cur !== undefined && cur.charCodeAt(cur.length - 1) === ch.charCodeAt(0)) {
        nuclei[nuclei.length - 1] = cur + ch
      } else {
        nuclei.push(ch)
        starts.push(i)
      }
    }
  }
  return { nuclei, starts }
}

const FALLBACK_EXCEPTIONS: Record<string, number> = {
  different: 3,
  every: 2,
  even: 2,
  given: 2,
  heaven: 2,
  seven: 2,
  daughter: 2,
  business: 2,
  iron: 2,
  interesting: 3,
  comfortable: 4,
  vegetable: 3,
  chocolate: 2,
  favorite: 2,
  thoroughly: 3,
  actually: 3,
  usually: 3,
  children: 2,
  woman: 2,
  women: 2,
  people: 2,
  feeling: 2,
  being: 2,
  doing: 2,
  going: 2,
  however: 3,
  something: 2,
  nothing: 2,
  everything: 3,
  friend: 1,
  pretty: 2,
  yellow: 2,
  follow: 2,
  narrow: 2,
  window: 2,
  morning: 2,
  evening: 2,
  everyone: 3,
  anyone: 3,
  only: 2,
  toward: 2,
}

export function estimateEnSyllables(word: string): number {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '')
  if (lower.length === 0) return 0
  const known = FALLBACK_EXCEPTIONS[lower]
  if (known !== undefined) return known

  const { nuclei } = vowelNuclei(lower)
  let count = nuclei.length
  if (count === 0) return 1

  const endsE = lower.endsWith('e')
  if (endsE) {
    // syllabic 'le': a consonant sits before 'le' and a vowel precedes it.
    const beforeL = lower[lower.length - 3]
    const beforeBeforeL = lower.slice(0, lower.length - 2)
    const syllabicLe = /[bcdfghjklmnpqrstvwxyz]/.test(beforeL) && /[aeiouy]/.test(beforeBeforeL)
    if (!syllabicLe && count > 1) {
      count--
    }
  }
  if (count < 1) count = 1
  return count
}

/** Stresses the penult by default, adjusts for a handful of frequent suffixes. */
export function estimateEnStressIndex(nuclei: string[], word: string): number {
  const n = nuclei.length
  if (n <= 1) return 0
  const lower = word.toLowerCase()
  if (/(tion|sion|cian|ture|ity|ical|able|ible|ous)$/.test(lower)) {
    return Math.max(0, n - 2)
  }
  if (/(ate)$/.test(lower) && lower.length > 6) return 0
  if (n === 2) return 0
  return Math.max(0, n - 2)
}