import type { Language } from './types'

const IT_MEASURES: Record<number, string> = {
  2: 'binario',
  3: 'ternario',
  4: 'quaternario',
  5: 'quinario',
  6: 'senario',
  7: 'settenario',
  8: 'ottonario',
  9: 'novenario',
  10: 'decasillabo',
  11: 'endecasillabo',
  12: 'doppio senario',
  14: 'doppio settenario',
  16: 'doppio ottonario',
}

const EN_LINE_NAMES: Record<number, string> = {
  2: 'monometer',
  4: 'dimeter',
  6: 'trimeter',
  8: 'tetrameter',
  10: 'pentameter',
  12: 'hexameter (alexandrine)',
  14: 'heptameter',
}

export function lineName(count: number, language: Language): string {
  if (language === 'it') {
    return IT_MEASURES[count] ?? `${count} sillabe`
  }
  return EN_LINE_NAMES[count] ?? `${count}-syllable line`
}

export const ENDING_LABELS: Record<string, string> = {
  tronco: 'tronco / masculine',
  piano: 'piano / feminine',
  sdrucciolo: 'sdrucciolo / dactylic',
  bisdrucciolo: 'bisdrucciolo',
}