export const ITALIAN_ACCENTS: Record<string, string> = {
  à: 'a',
  é: 'e',
  è: 'e',
  í: 'i',
  ì: 'i',
  ó: 'o',
  ò: 'o',
  ú: 'u',
  ù: 'u',
  â: 'a',
  ê: 'e',
  î: 'i',
  ô: 'o',
  û: 'u',
}

export const DIACHRESIS: Record<string, string> = {
  ä: 'a',
  ë: 'e',
  ï: 'i',
  ö: 'o',
  ü: 'u',
  ÿ: 'y',
}

export function stripAccents(text: string): string {
  return text.replace(/./gu, (ch) => ITALIAN_ACCENTS[ch] ?? DIACHRESIS[ch] ?? ch)
}

/** Italian vowels, including accented forms and diaeresis vowels. */
export function isItVowelChar(ch: string): boolean {
  return /[aeiouàèéìíóòùúäëïöüÿ]/i.test(ch)
}

export function isItStrongVowelChar(ch: string): boolean {
  const base = stripAccents(ch.toLowerCase())
  return base === 'a' || base === 'e' || base === 'o'
}

export function isEnVowelChar(ch: string): boolean {
  return /[aeiou]/i.test(ch)
}

/** Treats 'y' as a vowel only when used as such (not word-initial, mostly). */
export function isEnSyllableVowelChar(ch: string, index: number, word: string): boolean {
  const c = ch.toLowerCase()
  if (c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u') return true
  if (c === 'y') {
    if (index === 0) return false
    if (index === word.length - 1) return true
    const prev = word[index - 1].toLowerCase()
    if (prev === 'a' || prev === 'e' || prev === 'i' || prev === 'o' || prev === 'u') return false
    const next = word[index + 1].toLowerCase()
    if (next === 'a' || next === 'e' || next === 'o' || next === 'u') return false
    return true
  }
  return false
}

/** True when the given phoneme string participates in a syllable (a vowel phoneme). */
export const EN_VOWEL_PHONEMES = new Set([
  'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW',
])

export function splitLines(text: string): string[] {
  return text.split(/\r?\n/)
}

/** Splits a line into word tokens. Apostrophes are left INSIDE the token here
 *  ([l'altra], [don't]); the per-language analyzers decide whether to expand them
 *  (Italian elision) or keep them (English contractions). */
export function tokenizeLine(text: string): string[] {
  return text.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu) ?? []
}

/** Italian: surrender apostrophes as elision boundaries. */
export function splitElisions(tokens: string[]): string[] {
  const out: string[] = []
  for (const tok of tokens) {
    for (const piece of tok.split(/[’']/)) {
      if (piece) out.push(piece)
    }
  }
  return out
}

/** English words need punctuation and apostrophes for dictionary matching. */
export function normalizeEnWord(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[¿¡?!.,;:…—\-()\[\]{}"“”«»]/g, '')
}

export function normalizeItWord(text: string): string {
  return text
    .toLowerCase()
    .replace(/[!?.,;:…—-]/g, '')
    .replace(/^['’]+|['’]+$/g, '')
}

/** True (per-language) when a token begins with a vowel sound.
 *  Italian 'h' followed by a vowel is silent, so 'che ho' does trigger sinalefe. */
export function startsWithVowelSound(text: string, language: 'en' | 'it'): boolean {
  if (text.length === 0) return false
  const first = text[0]
  if (language === 'it') {
    if (isItVowelChar(first)) return true
    if (first === 'h') return text.length > 1 && isItVowelChar(text[1])
    return false
  }
  if (isEnSyllableVowelChar(first, 0, first)) return true
  return false
}

export function endsWithVowelSound(text: string, language: 'en' | 'it'): boolean {
  if (text.length === 0) return false
  const last = text[text.length - 1]
  if (language === 'it') return isItVowelChar(last)
  return isEnVowelChar(last) || last.toLowerCase() === 'y'
}