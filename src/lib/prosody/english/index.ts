import type { EndingClass, WordAnalysis } from '../types'
import { normalizeEnWord } from '../text'
import { lookupEnWord, rhymeKeysFor } from './cmu'
import { estimateEnSyllables, estimateEnStressIndex, vowelNuclei } from './fallback'

export function enEndingFor(stressIndex: number, syllables: number): EndingClass {
  if (syllables <= 1) return 'tronco'
  const fromEnd = syllables - stressIndex
  if (fromEnd === 1) return 'tronco'
  if (fromEnd === 2) return 'piano'
  if (fromEnd === 3) return 'sdrucciolo'
  return 'bisdrucciolo'
}

export function analyzeEnWord(text: string): WordAnalysis {
  const base = normalizeEnWord(text)
  const video = vowelNuclei(base)

  const entry = lookupEnWord(base)
  if (entry) {
    const ending = enEndingFor(entry.stressIndex, entry.syllables)
    return {
      text,
      base,
      nuclei: video.nuclei,
      syllables: entry.syllables,
      stressIndex: Math.min(entry.stressIndex, entry.syllables - 1),
      ending,
      certain: true,
      note: 'dictionary',
      phonicKey: entry.rhymePhonemes.join(''),
      phonicKeys: rhymeKeysFor(entry),
    }
  }

  const syllables = estimateEnSyllables(base)
  const stressIndex = Math.max(0, Math.min(estimateEnStressIndex(video.nuclei, base), syllables - 1))
  const ending = enEndingFor(stressIndex, syllables)
  return {
    text,
    base,
    nuclei: video.nuclei,
    syllables,
    stressIndex,
    ending,
    certain: false,
    note: 'estimated',
  }
}