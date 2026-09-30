import { describe, expect, it, beforeAll } from 'vitest'
import { analyzePoem } from '../src/lib/prosody/poem'
import { analyzeLine } from '../src/lib/prosody/verse'
import { ensureCmuLoaded } from '../src/lib/prosody/english/cmu'

const SHAKESPEARE_LIKE = [
  'Shall I compare thee to a summer\'s day?',
  'Thou art more lovely and more temperate:',
  'Rough winds do shake the darling buds of May,',
  'And summer\'s lease hath all too short a date;',
  'Sometime too hot the eye of heaven shines,',
  'And often is his gold complexion dimm\'d;',
  'And every fair from fair sometime declines,',
  'By chance or nature\'s changing course untrimm\'d;',
  'But thy eternal summer shall not fade,',
  'Nor lose possession of that fair thou ow\'st;',
  'Nor shall death brag thou wander\'st in his shade,',
  'When in eternal lines to time thou grow\'st:',
  'So long as men can breathe or eyes can see,',
  'So long lives this, and this gives life to thee.',
].join('\n')

const DANTE_TERZA = [
  'Nel mezzo del cammin di nostra vita',
  'mi ritrovai per una selva oscura,',
  'ché la diritta via era smarrita.',
  'Ahi quanto a dir qual era è cosa dura',
  'esta selva selvaggia e aspra e forte',
  'che nel pensier rinova la paura!',
  'Tant\'è amara che poco è più morte',
  'ma per trattar del ben ch\'i\' vi trovai',
  'dirò de l\'altre cose ch\'i\' v\'ho scorte.',
].join('\n')

const HAIKU = ['a quiet morning', 'the grey bell tolls through cold mist', 'deep as the snowfall'].join('\n')

describe('poem analysis', () => {
  beforeAll(async () => {
    await ensureCmuLoaded()
  })

  it('returns line analyses and rhyme letters', () => {
    const poem = analyzePoem(SHAKESPEARE_LIKE, { language: 'en', stanzaOnBlankLines: true })
    expect(poem.lines.length).toBe(14)
    expect(poem.lines.every((l) => l.rawSyllables >= 9 && l.rawSyllables <= 12)).toBe(true)
    expect(poem.rhymeScheme.length).toBe(14)
    expect(poem.read.length).toBeGreaterThan(10)
  })

  it('detects a Shakespearean sonnet', () => {
    const poem = analyzePoem(SHAKESPEARE_LIKE, { language: 'en', stanzaOnBlankLines: true })
    expect(poem.forms[0]).toBeDefined()
    expect(poem.forms[0].id).toBe('en-sonnet')
    expect(poem.forms[0].score).toBeGreaterThan(0.8)
  })

  it('detects terza rima in Italian', () => {
    const poem = analyzePoem(DANTE_TERZA, { language: 'it', stanzaOnBlankLines: true })
    expect(poem.forms[0].id).toBe('terza-rima')
    expect(poem.forms[0].score).toBeGreaterThan(0.75)
  })

  it('detects a haiku by raw syllable counts', () => {
    const poem = analyzePoem(HAIKU, { language: 'en', stanzaOnBlankLines: true })
    expect(poem.forms[0].id).toBe('haiku')
  })

  it('groups stanzas on blank lines', () => {
    const poem = analyzePoem('a\nb\n\nc\nd', { language: 'en', stanzaOnBlankLines: true })
    expect(poem.stanzas.length).toBe(2)
  })

  it('assigns rhyme letters from stressed-nucleus keys', () => {
    const p1 = analyzeLine('en', 'I love thee in the morning')
    const p2 = analyzeLine('en', 'I love thee with a warning')
    expect(p1.rhymeKey).toBe(p2.rhymeKey)
  })

  it('rhymes descent with content through alternate stress', () => {
    const poem = analyzePoem('a slow descent\nand deep content', { language: 'en', stanzaOnBlankLines: true })
    expect(poem.lines[0].rhymeKeys).toContain('EHNT')
    expect(poem.lines[1].rhymeKeys).toContain('EHNT')
    expect(poem.lines[0].rhymeLetter).toBe(poem.lines[1].rhymeLetter)
  })
})