import type { Language, LineAnalysis, PoemAnalysis, FormResult, WordAnalysis } from './types'
import { analyzePoem, autoDetectAnalyze } from './poem'
import { analyzeLine } from './verse'
import { detectLanguage } from './language'
import { lineName, ENDING_LABELS } from './names'
import { FORM_CATALOG } from './forms'
import { analyzeItWord } from './italian'
import { analyzeEnWord } from './english'
import { ensureCmuLoaded, cmuReady } from './english/cmu'
import { ITALIAN_LEXICON } from './italian'
import { startsWithVowelSound, endsWithVowelSound } from './text'

export { analyzePoem, autoDetectAnalyze, analyzeLine, detectLanguage, lineName, ENDING_LABELS, FORM_CATALOG, analyzeItWord, analyzeEnWord, ensureCmuLoaded, cmuReady, ITALIAN_LEXICON, startsWithVowelSound, endsWithVowelSound }
export type { Language, LineAnalysis, PoemAnalysis, FormResult, WordAnalysis }