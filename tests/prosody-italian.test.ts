import { describe, expect, it } from 'vitest'
import { analyzeItWord } from '../src/lib/prosody/italian'
import { analyzeLine } from '../src/lib/prosody/verse'

describe('Italian word analysis', () => {
  it('counts plain words', () => {
    expect(analyzeItWord('amore').syllables).toBe(3)
    expect(analyzeItWord('cuore').syllables).toBe(2)
    expect(analyzeItWord('cielo').syllables).toBe(2)
    expect(analyzeItWord('fiume').syllables).toBe(2)
    expect(analyzeItWord('sempre').syllables).toBe(2)
    expect(analyzeItWord('qualcosa').syllables).toBe(3)
  })

  it('applies hiatus and diphthong rules', () => {
    expect(analyzeItWord('paura').syllables).toBe(3)
    expect(analyzeItWord('follia').syllables).toBe(3)
    expect(analyzeItWord('poesia').syllables).toBe(4)
    expect(analyzeItWord('via').syllables).toBe(2)
    expect(analyzeItWord('mio').syllables).toBe(2)
    expect(analyzeItWord('suo').syllables).toBe(1)
    expect(analyzeItWord('famiglia').syllables).toBe(3)
    expect(analyzeItWord('grazia').syllables).toBe(2)
    expect(analyzeItWord('zio').syllables).toBe(2)
  })

  it('classifies written accents (tronco)', () => {
    const citta = analyzeItWord('città')
    expect(citta.syllables).toBe(2)
    expect(citta.ending).toBe('tronco')
    const perche = analyzeItWord('perché')
    expect(perche.ending).toBe('tronco')
  })

  it('classifies sdrucciole', () => {
    expect(analyzeItWord('portico').ending).toBe('sdrucciolo')
    expect(analyzeItWord('amabile').ending).toBe('sdrucciolo')
  })
})

describe('Italian line analysis', () => {
  it('scans the first line of L\'infinito as endecasillabo', () => {
    const line = analyzeLine('it', "Sempre caro mi fu quest'ermo colle,")
    expect(line.rawSyllables).toBe(11)
    expect(line.metricalCount).toBe(11)
    expect(line.lineName).toBe('endecasillabo')
  })

  it('scans the second line without sinalefe', () => {
    const line = analyzeLine('it', 'e questa siepe, che da tanta parte')
    expect(line.metricalCount).toBe(11)
    expect(line.merges).toBe(0)
  })

  it('applies sinalefe across word boundaries', () => {
    const line = analyzeLine('it', 'che amore')
    expect(line.rawSyllables).toBe(3)
    expect(line.merges).toBe(1)
  })

  it('handles elision through apostrophes', () => {
    const line = analyzeLine('it', "l'amore")
    expect(line.rawSyllables).toBe(3)
  })

  it('scans a Petrarch hendecasyllable', () => {
    const line = analyzeLine('it', "Sì traviato è 'l folle mio desio")
    expect(line.metricalCount).toBe(11)
    expect(line.lineName).toBe('endecasillabo')
  })
})