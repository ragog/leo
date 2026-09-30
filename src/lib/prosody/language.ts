import type { Language } from './types'

const EN_SIGNALS = new Set(['the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'on', 'with', 'as', 'was', 'but', 'be', 'this', 'from', 'a', 'an', 'or', 'by', 'she', 'he', 'we', 'they', 'you', 'my', 'your', 'through', 'these', 'those', 'shall', 'will', 'have', 'has', 'had', 'do', 'not', 'all', 'are'])
const IT_SIGNALS = new Set(['il', 'la', 'lo', 'le', 'gli', 'i', 'gli', 'un', 'una', 'che', 'di', 'e', 'è', 'non', 'per', 'con', 'in', 'del', 'della', 'dello', 'dei', 'delle', 'da', 'a', 'o', 'ma', 'se', 'come', 'quando', 'dove', 'tutto', 'tutta', 'tutti', 'tutte', 'più', 'meno', 'molto', 'ancor', 'ancora', 'questa', 'questo', 'queste', 'questi', 'quel', 'quella', 'su', 'giù', 'fra', 'tra', 'sopra', 'sotto', 'ora', 'poi', 'mi', 'ti', 'si', 'ci', 'vi', 'loro', 'noi', 'voi'])

export function detectLanguage(lines: string[]): Language {
  let en = 0
  let it = 0
  for (const line of lines) {
    const tokens = line.toLowerCase().replace(/[^a-zà-ù\s']/g, ' ').split(/\s+/)
    for (const t of tokens) {
      if (EN_SIGNALS.has(t)) en++
      if (IT_SIGNALS.has(t)) it++
    }
  }
  return it > en ? 'it' : 'en'
}