<script lang="ts">
  import { onMount } from 'svelte'
  import { analyzePoem, autoDetectAnalyze, ensureCmuLoaded, cmuReady, lineName, ENDING_LABELS, startsWithVowelSound, endsWithVowelSound } from './lib/prosody'
  import type { FormResult, Language } from './lib/prosody'

  type LangOption = 'auto' | Language

  const EXAMPLES: { name: string; text: string }[] = [
    {
      name: 'Dante, Inf. I 1-9',
      text: [
        'Nel mezzo del cammin di nostra vita',
        'mi ritrovai per una selva oscura,',
        'ché la diritta via era smarrita.',
        'Ahi quanto a dir qual era è cosa dura',
        'esta selva selvaggia e aspra e forte',
        'che nel pensier rinova la paura!',
        'Tant\'è amara che poco è più morte;',
        'ma per trattar del ben ch\'i\' vi trovai,',
        'dirò de l\'altre cose ch\'i\' v\'ho scorte.',
      ].join('\n'),
    },
    {
      name: 'Leopardi, L\'infinito',
      text: [
        'Sempre caro mi fu quest\'ermo colle,',
        'e questa siepe, che da tanta parte',
        'de l\'ultimo orizzonte il guardo esclude.',
        'Ma sedendo e mirando, interminati',
        'spazi di là da quella, e sovrumani',
        'silenzi, e profondissima quiete',
        'io nel pensier mi fingo; ove per poco',
        'il cor non si spaura. E come il vento',
        'odo stormir tra queste piante, io quello',
        'infinito silenzio a questa voce',
        'vo comparando: e mi sovvien l\'eterno,',
        'e le morte stagioni, e la presente',
        'e viva, e il suon di lei. Così tra questa',
        'immensità s\'annega il pensier mio:',
        'e il naufragar m\'è dolce in questo mare.',
      ].join('\n'),
    },
    {
      name: 'Shakespeare, Sonnet 18',
      text: [
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
      ].join('\n'),
    },
    {
      name: 'Haiku',
      text: ['a quiet morning', 'the grey bell tolls through cold mist', 'deep as the snowfall'].join('\n'),
    },
  ]

  let text = $state('')
  let langOption = $state<LangOption>('auto')
  let dictReady = $state(false)
  let dictError = $state('')

  onMount(async () => {
    try {
      await ensureCmuLoaded()
      dictReady = true
    } catch (err) {
      dictError = err instanceof Error ? err.message : String(err)
    }
  })

  const poem = $derived.by(() => {
    if (text.trim() === '') return null
    if (langOption === 'auto') return autoDetectAnalyze(text, { stanzaOnBlankLines: true })
    return analyzePoem(text, { language: langOption, stanzaOnBlankLines: true })
  })

  function loadExample(example: { name: string; text: string }) {
    text = example.text
    langOption = 'auto'
  }

  function bondBetween(a: string, b: string): boolean {
    return endsWithVowelSound(a, 'it') && startsWithVowelSound(b, 'it')
  }
</script>

<svelte:head>
  <title>Leo — poem scanner</title>
</svelte:head>

<main>
  <header>
    <h1>Leo</h1>
    <p class="tagline">Metrical scanner — English and Italian</p>
  </header>

  <section class="editor">
    <div class="toolbar">
      <label>
        Language
        <select bind:value={langOption}>
          <option value="auto">Auto</option>
          <option value="it">Italiano</option>
          <option value="en">English</option>
        </select>
      </label>
      <div class="examples">
        {#each EXAMPLES as ex}
          <button class="chip" onclick={() => loadExample(ex)}>{ex.name}</button>
        {/each}
      </div>
      <span class="dict-status">
        {#if dictError}
          <span class="warn">CMU dict failed: {dictError}</span>
        {:else if dictReady}
          <span>CMU dictionary ready</span>
        {:else}
          <span>loading CMU dictionary…</span>
        {/if}
      </span>
    </div>
    <textarea
      bind:value={text}
      placeholder="Paste a poem… e.g. Leopardi's L&#39;infinito or a Shakespearean sonnet."
      rows="10"></textarea>
  </section>

  {#if poem}
    <section class="results">
      <div class="form-card">
        {#if poem.forms.length > 0 && poem.forms[0].score >= 0.72}
          <div class="verdict found">
            <h2>{poem.forms[0].name}</h2>
            <p>{poem.forms[0].description}</p>
            <p class="score">{Math.round(poem.forms[0].score * 100)}% match</p>
          </div>
        {:else if poem.forms.length > 0 && poem.forms[0].score >= 0.45}
          <div class="verdict partial">
            <h2>Closest: {poem.forms[0].name}</h2>
            <p>{poem.forms[0].description}</p>
            <p class="score">{Math.round(poem.forms[0].score * 100)}% · below the 72% threshold</p>
          </div>
        {:else}
          <div class="verdict unknown">
            <h2>No recognizable form</h2>
            <p>{poem.read}</p>
          </div>
        {/if}

        <div class="read">{poem.read}</div>

        {#if poem.forms.length > 0}
          <details open class="breakdown">
            <summary>Score breakdown ({poem.forms.length} candidates)</summary>
            <table>
              <thead>
                <tr><th>Scheme</th><th>Score</th><th>Length</th><th>Rhyme</th><th>Shape</th></tr>
              </thead>
              <tbody>
                {#each poem.forms.slice(0, 8) as f (f.id)}
                  <tr>
                    <td>{f.name}</td>
                    <td>{Math.round(f.score * 100)}%</td>
                    <td>{Math.round((f.breakdown[0]?.score ?? 0) * 100)}%</td>
                    <td>{Math.round((f.breakdown[1]?.score ?? 0) * 100)}%</td>
                    <td>{Math.round((f.breakdown[2]?.score ?? 0) * 100)}%</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </details>
        {/if}

        <div class="scheme-line">
          Scheme: <code>{poem.rhymeScheme.join(' ')}</code>
        </div>
      </div>

      <div class="stanzas">
        {#each poem.stanzas as stanza, si (si)}
          <div class="stanza">
            {#each stanza.lines as line, li (si + ':' + li)}
              <div class="line">
                <div class="line-no">{si * 20 + li + 1}</div>
                <div class="line-body">
                  <span class="verse">
                    {#each line.words as word, wi (si + ':' + li + ':' + wi)}
                      <span class="word" title="{word.text}{word.nuclei.length ? '' : ' (no vowels)'}">
                        {word.text}
                        {#if bondBetween(word.base, line.words[wi + 1]?.base ?? '')}
                          <span class="bond">⌒</span>
                        {/if}
                      </span>
                    {/each}
                  </span>
                  <span class="meta">
                    <b>{line.rawSyllables}</b>
                    {#if line.metricalCount !== line.rawSyllables}
                      → <b>{line.metricalCount}</b>
                    {/if}
                    <span class="dim">metrical · {lineName(line.metricalCount, line.language)} · {ENDING_LABELS[line.ending]}</span>
                    {#if line.rhymeLetter}<span class="rhyme-letter">{line.rhymeLetter}</span>{/if}
                    {#if line.merges > 0}<span class="note" title="sinalefe / elision merges">⧉ {line.merges}</span>{/if}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <details class="words">
        <summary>Word-level detail</summary>
        <table>
          <thead>
            <tr><th>Word</th><th>Nuclei</th><th>Grado di certezza</th><th>Note</th></tr>
          </thead>
          <tbody>
            {#each poem.lines as line, li (li)}
              {#each line.words as word, wi (li + ':' + wi)}
                <tr>
                  <td>{word.text}</td>
                  <td>{word.syllables} ({word.nuclei.join(' ') || '∅'})</td>
                  <td>{word.certain ? 'sure' : 'estimated'}{word.stressIndex !== undefined ? ` · stress ${word.stressIndex + 1}/${word.syllables}` : ''}</td>
                  <td>{word.note ?? ''}</td>
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      </details>
    </section>
  {:else}
    <section class="empty">
      <p>Paste a poem above to scan its metre, count syllables (with sinalefe and elision for Italian), and detect the poetic form.</p>
    </section>
  {/if}
</main>

<style>
  :global(*) { box-sizing: border-box; }

  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 20px 64px;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }

  header h1 {
    font-size: 40px;
    margin: 0 0 4px;
  }
  .tagline { margin: 0 0 24px; color: #888; }

  .editor textarea {
    width: 100%;
    font: 15px/1.6 ui-monospace, 'Cascadia Mono', Consolas, monospace;
    padding: 12px;
    border: 1px solid var(--border, #d8d8d8);
    border-radius: 8px;
    resize: vertical;
  }

  .toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .toolbar label { display: flex; align-items: center; gap: 6px; font-size: 14px; }
  .examples { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip {
    border: 1px solid var(--border, #d8d8d8);
    background: transparent;
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 13px;
    cursor: pointer;
  }
  .chip:hover { border-color: #8b5cf6; color: #8b5cf6; }
  .dict-status { margin-left: auto; font-size: 12px; color: #999; }
  .warn { color: #c2410c; }

  .results { margin-top: 24px; }

  .form-card {
    border: 1px solid var(--border, #d8d8d8);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .verdict h2 { margin: 0 0 6px; }
  .verdict p { margin: 0 0 4px; }
  .verdict .score { font-size: 13px; color: #8b5cf6; font-weight: 600; }
  .read { margin-top: 8px; font-size: 14px; color: #777; }
  .scheme-line { margin-top: 10px; font-size: 14px; }
  code {
    font-family: ui-monospace, Consolas, monospace;
    background: var(--code-bg, #f1f1f1);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }

  .breakdown { margin-top: 12px; font-size: 13px; }
  .breakdown table { border-collapse: collapse; width: 100%; font-size: 12px; }
  .breakdown th, .breakdown td { border: 1px solid var(--border, #eee); padding: 4px 8px; text-align: left; }

  .stanza { margin-bottom: 8px; }
  .line { display: flex; gap: 8px; padding: 3px 0; border-radius: 6px; }
  .line:hover { background: var(--hover, #f7f7f7); }
  .line-no {
    width: 28px; text-align: right; color: #aaa; font-size: 12px; padding-top: 3px;
    flex: none;
  }
  .line-body { flex: 1; display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
  .verse { flex: 1; }
  .word { white-space: nowrap; }
  .bond { color: #8b5cf6; font-weight: 700; margin: 0 1px; }
  .meta { font-size: 13px; color: #555; text-align: right; white-space: nowrap; }
  .dim { color: #aaa; font-size: 12px; }
  .rhyme-letter {
    display: inline-block; margin-left: 6px; padding: 0 6px;
    background: #8b5cf6; color: #fff; border-radius: 4px; font-size: 12px; font-weight: 700;
  }
  .note { margin-left: 6px; font-size: 12px; color: #0e7490; }

  details.words { margin-top: 16px; }
  details.words table { border-collapse: collapse; width: 100%; font-size: 13px; }
  details.words th, details.words td { border: 1px solid var(--border, #eee); padding: 4px 10px; text-align: left; }
  details.words td:first-child { white-space: nowrap; }

  .empty { color: #999; padding: 40px 0; text-align: center; }
</style>