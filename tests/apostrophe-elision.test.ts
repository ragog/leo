import { describe, expect, it } from 'vitest'
import { analyzeLine } from '../src/lib/prosody/verse'

describe('Italian apostrophe elision handling', () => {
  it('handles c\'è with transparent sinalefe', () => {
    // "c'è" from "ci è" - the "c" should be transparent for sinalefe
    const line = analyzeLine('it', "e c'è vita")
    expect(line.rawSyllables).toBe(3) // e(1) + è(1) + vita(2) = 4, minus 1 sinalefe = 3
    expect(line.merges).toBe(1) // sinalefe between "e" and "è"
  })
  
  it('handles l\'amore with blocked sinalefe', () => {
    // "l'altre" from "le altre" - the "l" should block sinalefe
    const line = analyzeLine('it', "de l'altre cose")
    expect(line.rawSyllables).toBe(5) // de(1) + l(0) + altre(2) + cose(2) = 5, no sinalefe
    expect(line.merges).toBe(0)
  })
  
  it('handles v\'ho with blocked sinalefe', () => {
    // "v'ho" from "vi ho" - the "v" should block sinalefe
    const line = analyzeLine('it', "ch'i' v'ho scorte")
    expect(line.merges).toBe(0) // no sinalefe because "v" blocks it
  })
  
  it('correctly scans line 17 of the test poem', () => {
    const line = analyzeLine('it', "e c'è vita in ogni cosa.")
    expect(line.rawSyllables).toBe(7)
    expect(line.merges).toBe(2) // e+è and in+ogni
    expect(line.lineName).toBe('settenario')
  })
})
