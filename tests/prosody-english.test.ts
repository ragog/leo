import { describe, expect, it, beforeAll } from 'vitest'
import { analyzeEnWord } from '../src/lib/prosody/english'
import { analyzeLine } from '../src/lib/prosody/verse'
import { ensureCmuLoaded, cmuReady } from '../src/lib/prosody/english/cmu'

describe('English word analysis', () => {
  beforeAll(async () => {
    await ensureCmuLoaded()
  })

  it('loads the CMU dictionary', () => {
    expect(cmuReady()).toBe(true)
  })

  it('counts dictionary words', () => {
    expect(analyzeEnWord('celebrate').syllables).toBe(3)
    expect(analyzeEnWord('celebration').syllables).toBe(4)
    expect(analyzeEnWord('question').syllables).toBe(2)
    expect(analyzeEnWord('orange').syllables).toBe(2)
    expect(analyzeEnWord('beautiful').syllables).toBe(3)
    expect(analyzeEnWord('world').syllables).toBe(1)
    expect(analyzeEnWord('hello').syllables).toBe(2)
  })

  it('marks dictionary words as certain', () => {
    expect(analyzeEnWord('orange').certain).toBe(true)
    const unknown = analyzeEnWord('plurigalactisome')
    expect(unknown.certain).toBe(false)
  })

  it('handles final-syllable stress (masculine) words', () => {
    const urban = analyzeEnWord('obey')
    expect(urban.ending).toBe('tronco')
    const travel = analyzeEnWord('letter')
    expect(travel.ending).toBe('piano')
  })
})

describe('English line analysis', () => {
  beforeAll(async () => {
    await ensureCmuLoaded()
  })

  it('scans iambic pentameter with a feminine ending', () => {
    const line = analyzeLine('en', "To be, or not to be, that is the question")
    expect(line.rawSyllables).toBe(11)
    expect(line.metricalCount).toBe(10)
    expect(line.ending).toBe('piano')
    expect(line.lineName).toBe('pentameter')
  })

  it('keeps contractions to one syllable', () => {
    const line = analyzeLine('en', "Don't be")
    expect(line.rawSyllables).toBe(2)
  })

  it('counts a classic pentameter line', () => {
    const line = analyzeLine('en', "Shall I compare thee to a summer's day?")
    expect(line.metricalCount).toBe(10)
    expect(line.lineName).toBe('pentameter')
  })
})