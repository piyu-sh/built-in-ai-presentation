import { availability, call, createSession, errText, formatMs, keynoteMode, timed, withTimeout } from '../shared/ai';
import { badge, button, chip, h, pre, section } from '../shared/dom';
import { CANNED, SAMPLES } from '../shared/data';

const app = document.querySelector<HTMLDivElement>('#app')!;

const textArea = h('textarea', {});
textArea.value = SAMPLES[1]!.text;
textArea.rows = 2;
const samples = h('div', { class: 'controls' });
const target = h('select');
for (const lang of ['en', 'fr', 'de', 'es', 'ja']) target.append(h('option', { value: lang, text: lang }));
target.value = 'en';

const runButton = button('Run', () => void run(), 'primary');
const downloadButton = button('Download models', () => void downloadModels(), 'ghost');
const state = h('div', { class: 'controls' });
const timings = h('div', { class: 'chips' });
const detected = pre('Detected language');
const translated = pre('Translation');
const summarized = pre('Summary');

// Code panel removed from default view for viewport-fit; keep logic minimal.

for (const sample of SAMPLES) {
  const b = button(sample.label, () => { textArea.value = sample.text; for (const x of samples.querySelectorAll('button')) x.classList.remove('active'); b.classList.add('active'); });
  if (sample.label === 'Français') b.classList.add('active');
  samples.append(b);
}

async function downloadModels(): Promise<void> {
  downloadButton.disabled = true;
  try {
    const dest = target.value;
    const src = 'fr';
    setBadge(detectorBadge, 'detector: checking', 'idle');
    const dState = await availability('LanguageDetector');
    if (dState !== 'unavailable') await createSession('LanguageDetector');
    setBadge(detectorBadge, `detector: ${await availability('LanguageDetector')}`, 'ok');

    setBadge(translatorBadge, 'translator: checking', 'idle');
    const tOpts = { sourceLanguage: src, targetLanguage: dest === src ? 'en' : dest };
    const tState = await availability('Translator', tOpts);
    if (tState !== 'unavailable') await withTimeout((globalThis as any).Translator.create(tOpts), 180000, 'Translator.create()');
    setBadge(translatorBadge, `translator: ${await availability('Translator', tOpts)}`, 'ok');

    setBadge(summarizerBadge, 'summarizer: checking', 'idle');
    const sOpts = { type: 'tldr', format: 'plain-text', length: 'short', outputLanguage: dest };
    const sState = await availability('Summarizer', sOpts);
    if (sState !== 'unavailable') await withTimeout((globalThis as any).Summarizer.create(sOpts), 180000, 'Summarizer.create()');
    setBadge(summarizerBadge, `summarizer: ${await availability('Summarizer', sOpts)}`, 'ok');
  } catch (e) {
    setBadge(translatorBadge, `download: ${errText(e)}`, 'bad');
  } finally {
    downloadButton.disabled = false;
  }
}

app.append(
  h('div', { class: 'wrap', style: 'padding:12px 14px 16px;max-width:1180px;' },
    h('header', { class: 'top', style: 'margin-bottom:10px;padding-bottom:8px;' },
      h('h1', { text: 'Detect → translate → summarize', style: 'font-size:16px;' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('div', { class: 'grid two', style: 'gap:10px; align-items:start; grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);' },
      section('Input',
        samples,
        textArea,
        h('div', { class: 'controls' }, h('label', { text: 'To', style: 'margin:0 4px 0 0;' }), target, runButton, downloadButton),
        state,
        h('p', { class: 'muted small', style: 'margin:6px 0 0;', text: 'If a model is downloadable, click “Download models” once (user gesture required).' }),
      ),
      h('div', { class: 'grid', style: 'gap:8px;' }, detected.root, translated.root, summarized.root, timings),
    ),
  ),
);

const detectorBadge = badge('detector: —', 'idle');
const translatorBadge = badge('translator: —', 'idle');
const summarizerBadge = badge('summarizer: —', 'idle');
state.append(detectorBadge, translatorBadge, summarizerBadge);

const tDetect = chip('detect', '—');
const tTranslate = chip('translate', '—');
const tSummarize = chip('summarize', '—');
timings.append(tDetect.root, tTranslate.root, tSummarize.root);

function setBadge(el: HTMLElement, value: string, kind: 'ok' | 'warn' | 'bad' | 'idle'): void {
  el.textContent = value;
  el.className = `badge badge-${kind}`;
}

async function run(): Promise<void> {
  runButton.disabled = true;
  const text = textArea.value.trim();
  if (!text) {
    runButton.disabled = false;
    return;
  }
  const canned = keynoteMode();
  let source = 'fr';

  try {
    if (canned) {
      setBadge(detectorBadge, 'detector: canned', 'warn');
      setBadge(translatorBadge, 'translator: canned', 'warn');
      setBadge(summarizerBadge, 'summarizer: canned', 'warn');
      detected.set(CANNED.hello.detect);
      translated.set(CANNED.hello.translate);
      summarized.set(CANNED.hello.summary);
      tDetect.set('canned');
      tTranslate.set('canned');
      tSummarize.set('canned');
      return;
    }

    const detectorState = await availability('LanguageDetector');
    setBadge(detectorBadge, `detector: ${detectorState}`, detectorState === 'available' ? 'ok' : 'warn');
    if (detectorState !== 'available') throw new Error(`LanguageDetector is ${detectorState}`);
    const detector = await createSession('LanguageDetector');
    const detectResult = await timed(async () => {
      const value = await call(detector, 'detect', text);
      return Array.isArray(value) ? value : [value];
    });
    const guess = (detectResult.value[0] as { detectedLanguage?: string } | undefined)?.detectedLanguage ?? 'und';
    source = guess;
    detected.set(JSON.stringify(detectResult.value, null, 2));
    tDetect.set(formatMs(detectResult.ms));

    const dest = target.value;
    if (source === dest) {
      translated.set(`Already ${dest} — translation skipped.`);
      tTranslate.set('skipped');
    } else {
      const options = { sourceLanguage: source, targetLanguage: dest };
      const translatorState = await availability('Translator', options);
      setBadge(translatorBadge, `translator: ${translatorState}`, translatorState === 'available' ? 'ok' : 'warn');
      if (translatorState !== 'available') {
        translated.set(`${source}→${dest} is ${translatorState} on this browser.\n\nRecorded example (${source}→en):\n${CANNED.hello.translate}`);
        tTranslate.set(translatorState);
      } else {
        const translator = await createSession('Translator', options);
        const result = await timed(async () => String(await call(translator, 'translate', text)));
        translated.set(result.value);
        tTranslate.set(formatMs(result.ms));
      }
    }

    const sumOpts = { type: 'tldr', format: 'plain-text', length: 'short', outputLanguage: dest };
    const summarizerState = await availability('Summarizer', sumOpts);
    setBadge(summarizerBadge, `summarizer: ${summarizerState}`, summarizerState === 'available' ? 'ok' : 'warn');
    if (summarizerState !== 'available') throw new Error(`Summarizer is ${summarizerState}`);
    const summarizer = await createSession('Summarizer', sumOpts);
    const result = await timed(async () => String(await call(summarizer, 'summarize', text)));
    summarized.set(result.value);
    tSummarize.set(formatMs(result.ms));
  } catch (error) {
    detected.set(detected.root.querySelector('pre')?.textContent ?? '—');
    summarized.set(`${errText(error)}\n\nKeynote output:\n${CANNED.hello.summary}`);
    setBadge(summarizerBadge, 'fallback', 'warn');
  } finally {
    runButton.disabled = false;
  }
}
