import type { FormResult, Language, LineAnalysis, PoemAnalysis, StanzaGroup } from './types'
import { analyzeLine, groupStanzas, assignRhymeLetters } from './verse'
import { splitLines } from './text'
import { detectForms } from './forms'
import { lineName } from './names'
import { detectLanguage } from './language'

export interface AnalyzeOptions {
  language: Language
  stanzaOnBlankLines: boolean
}

function dominantCount(lines: LineAnalysis[]): number {
  const counts = new Map<number, number>()
  for (const ln of lines) {
    if (ln.metricalCount === 0) continue
    counts.set(ln.metricalCount, (counts.get(ln.metricalCount) ?? 0) + 1)
  }
  let best = 0
  let bestCount = 0
  for (const [count, n] of counts) {
    if (n > bestCount) {
      best = count
      bestCount = n
    }
  }
  return best
}

function rhymeDensity(lines: LineAnalysis[]): number {
  const counts = new Map<string, number>()
  for (const ln of lines) {
    if (!ln.rhymeLetter) continue
    counts.set(ln.rhymeLetter, (counts.get(ln.rhymeLetter) ?? 0) + 1)
  }
  let repeated = 0
  for (const c of counts.values()) if (c >= 2) repeated += c
  return lines.length === 0 ? 0 : repeated / lines.length
}

function schemeString(lines: LineAnalysis[]): string {
  let out = ''
  for (const ln of lines) out += ln.rhymeLetter ?? '·'
  return out
}

function buildRead(ctx: {
  lines: LineAnalysis[]
  stanzas: StanzaGroup[]
  dominantCount: number
  rhymeDensity: number
  forms: FormResult[]
  language: Language
}): string {
  const { lines, stanzas, dominantCount: dom, rhymeDensity: density, forms, language } = ctx
  const best = forms[0]
  const parts: string[] = []

  if (best && best.score >= 0.72) {
    parts.push(`Looks like a ${best.name} (${Math.round(best.score * 100)}% match). ${best.description}`)
  } else if (best && best.score >= 0.45) {
    parts.push(`No exact form matched; closest is ${best.name} (${Math.round(best.score * 100)}%). ${best.description}`)
  } else {
    parts.push('No recognized canonical form.')
  }

  const stanzaShape = stanzas.map((s) => s.lines.length).join(' · ') || '1 stanza'
  parts.push(`${lines.length} line(s), ${stanzas.length} stanza(s) [${stanzaShape}]`)
  if (dom > 0) parts.push(`dominant metre: ${lineName(dom, language)} (${dom})`)
  if (density >= 0.5) parts.push(`rhymed — scheme ${schemeString(lines)}`)
  else if (density > 0) parts.push(`partially rhymed — scheme ${schemeString(lines)}`)
  else parts.push('unrhymed')
  if (best) parts.push(`line fit: ${best.matchedLinesCount}/${best.totalLines}`)
  return parts.join('. ')
}

export function analyzePoem(text: string, opts: AnalyzeOptions): PoemAnalysis {
  const rawLines = splitLines(text)
  const lines: LineAnalysis[] = []
  const breakGrid: boolean[] = []
  let pendingBreak = false
  for (const raw of rawLines) {
    if (raw.trim() === '') {
      if (lines.length > 0) pendingBreak = true
    } else {
      breakGrid.push(pendingBreak)
      pendingBreak = false
      lines.push(analyzeLine(opts.language, raw))
    }
  }
  assignRhymeLetters(lines)

  const stanzas = opts.stanzaOnBlankLines ? groupStanzas(lines, breakGrid) : groupStanzas(lines, breakGrid.map(() => false))
  const density = rhymeDensity(lines)
  const dom = dominantCount(lines)
  const forms = detectForms({ lines, language: opts.language, rhymeDensity: density })

  const read = buildRead({ lines, stanzas, dominantCount: dom, rhymeDensity: density, forms, language: opts.language })
  const rhymeScheme = lines.map((ln) => ln.rhymeLetter ?? '')

  return {
    lines,
    stanzas,
    dominantCount: dom,
    rhymeDensity: density,
    forms,
    read,
    rhymeScheme,
  }
}

export function autoDetectAnalyze(text: string, opts: Omit<AnalyzeOptions, 'language'>): PoemAnalysis {
  const lang = detectLanguage(splitLines(text).filter((l) => l.trim() !== ''))
  return analyzePoem(text, { ...opts, language: lang })
}

export type { Language }