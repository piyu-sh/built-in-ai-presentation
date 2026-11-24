import { availability, call, createAndCacheSession, errText, formatMs, getCachedSession, keynoteMode, timed, warmSession, withTimeout } from '../shared/ai';
import { badge, button, chip, h, pre, section, withBusy } from '../shared/dom';
import { CANNED, SAMPLES } from '../shared/data';

const RUN_TIMEOUT = 30_000;
const DOWNLOAD_TIMEOUT = 180_000;
const DETECTOR_OPTIONS: Record<string, unknown> = {};
const SUMMARIZER_BASE = { type: 'tldr', format: 'plain-text', length: 'short' } as const;

function translatorOptions(sourceLanguage: string, targetLanguage: string): Record<string, unknown> {
  return { sourceLanguage, targetLanguage };
}

function summarizerOptions(outputLanguage: string): Record<string, unknown> {
  return { ...SUMMARIZER_BASE, outputLanguage };
}

function translationTarget(sourceLanguage: string): string {
  return target.value === sourceLanguage ? 'en' : target.value;
}

const app = document.querySelector<HTMLDivElement>('#app')!;

const textArea = h('textarea', {});
textArea.value = SAMPLES[1]!.text;
textArea.rows = 2;
const samples = h('div', { class: 'controls' });
let sampleSource = SAMPLES[1]!.lang;
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
  const b = button(sample.label, () => {
    textArea.value = sample.text;
    sampleSource = sample.lang;
    for (const x of samples.querySelectorAll('button')) x.classList.remove('active');
    b.classList.add('active');
    void warmSession('Translator', translatorOptions(sampleSource, translationTarget(sampleSource)));
  });
  if (sample.label === 'Français') b.classList.add('active');
  samples.append(b);
}

/** The deck calls this hook when the demo iframe loads; warm happens in this realm. */
async function warmDemo(): Promise<void> {
  await Promise.allSettled([
    warmSession('LanguageDetector', DETECTOR_OPTIONS),
    warmSession('Translator', translatorOptions(sampleSource, translationTarget(sampleSource))),
    warmSession('Summarizer', summarizerOptions(target.value)),
  ]);
}
(window as any).__warmDemo = () => warmDemo();

target.addEventListener('change', () => {
  void warmSession('Translator', translatorOptions(sampleSource, translationTarget(sampleSource)));
  void warmSession('Summarizer', summarizerOptions(target.value));
});

async function downloadModels(): Promise<void> {
  await withBusy(downloadButton, 'Downloading…', async () => {
    const dest = target.value;
    setBadge(detectorBadge, 'detector: checking', 'idle');
    try {
      const cached = getCachedSession('LanguageDetector', DETECTOR_OPTIONS);
      if (cached) {
        setBadge(detectorBadge, 'detector: ready (cached)', 'ok');
      } else {
        const dState = await availability('LanguageDetector', DETECTOR_OPTIONS);
        if (dState === 'unavailable') {
          setBadge(detectorBadge, `detector: ${dState}`, 'warn');
        } else {
          await createAndCacheSession('LanguageDetector', DETECTOR_OPTIONS, DOWNLOAD_TIMEOUT);
          setBadge(detectorBadge, 'detector: ready (cached)', 'ok');
        }
      }
    } catch (e) {
      setBadge(detectorBadge, `detector: ${errText(e)}`, 'bad');
    }

    setBadge(translatorBadge, 'translator: downloading…', 'idle');
    try {
      const tOpts = translatorOptions(sampleSource, translationTarget(sampleSource));
      const cached = getCachedSession('Translator', tOpts);
      if (cached) {
        setBadge(translatorBadge, 'translator: ready (cached)', 'ok');
      } else {
        const tState = await availability('Translator', tOpts);
        if (tState === 'unavailable') {
          setBadge(translatorBadge, 'translator: unavailable', 'warn');
        } else {
          await createAndCacheSession('Translator', tOpts, DOWNLOAD_TIMEOUT);
          setBadge(translatorBadge, 'translator: ready (cached)', 'ok');
        }
      }
    } catch (e) {
      setBadge(translatorBadge, `translator: ${errText(e)}`, 'bad');
    }

    setBadge(summarizerBadge, 'summarizer: checking', 'idle');
    try {
      const sOpts = summarizerOptions(dest);
      const cached = getCachedSession('Summarizer', sOpts);
      if (cached) {
        setBadge(summarizerBadge, 'summarizer: ready (cached)', 'ok');
      } else {
        const sState = await availability('Summarizer', sOpts);
        if (sState === 'unavailable') {
          setBadge(summarizerBadge, `summarizer: ${sState}`, 'warn');
        } else {
          await createAndCacheSession('Summarizer', sOpts, DOWNLOAD_TIMEOUT);
          setBadge(summarizerBadge, 'summarizer: ready (cached)', 'ok');
        }
      }
    } catch (e) {
      setBadge(summarizerBadge, `summarizer: ${errText(e)}`, 'bad');
    }
  });
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
        h('p', { class: 'muted small', style: 'margin:6px 0 0;', text: 'Chrome reports every language pair as “downloadable” until this page creates it. After Download models, Run reuses the ready session.' }),
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
  await withBusy(runButton, 'Running…', async () => {
    const text = textArea.value.trim();
    if (!text) return;
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

      let detector = getCachedSession('LanguageDetector', DETECTOR_OPTIONS);
      if (detector) {
        setBadge(detectorBadge, 'detector: ready (cached)', 'ok');
      } else {
        const detectorState = await availability('LanguageDetector', DETECTOR_OPTIONS, 5_000);
        setBadge(detectorBadge, `detector: ${detectorState}`, detectorState === 'available' ? 'ok' : 'warn');
        if (detectorState !== 'available') throw new Error(`LanguageDetector is ${detectorState}`);
        detector = await createAndCacheSession('LanguageDetector', DETECTOR_OPTIONS, RUN_TIMEOUT);
      }
      const detectResult = await timed(async () => {
        const value = await withTimeout(
          Promise.resolve(call(detector!, 'detect', text)),
          RUN_TIMEOUT,
          'LanguageDetector.detect()',
        );
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
        const options = translatorOptions(source, dest);
        let translator = getCachedSession('Translator', options);
        if (translator) {
          setBadge(translatorBadge, 'translator: ready (cached)', 'ok');
        } else {
          const translatorState = await availability('Translator', options, 5_000);
          setBadge(translatorBadge, `translator: ${translatorState}`, translatorState === 'available' ? 'ok' : 'warn');
          if (translatorState !== 'available') {
            translated.set(`${source}→${dest} is ${translatorState} on this browser. Click “Download models” once, then Run again.\n\nRecorded example (${source}→en):\n${CANNED.hello.translate}`);
            tTranslate.set(translatorState);
            translator = undefined;
          } else {
            translator = await createAndCacheSession('Translator', options, RUN_TIMEOUT);
          }
        }
        if (translator) {
          const result = await timed(async () => {
            const value = await withTimeout(
              Promise.resolve(call(translator, 'translate', text)),
              RUN_TIMEOUT,
              'Translator.translate()',
            );
            return String(value);
          });
          translated.set(result.value);
          tTranslate.set(formatMs(result.ms));
        }
      }

      const sumOpts = summarizerOptions(dest);
      let summarizer = getCachedSession('Summarizer', sumOpts);
      if (summarizer) {
        setBadge(summarizerBadge, 'summarizer: ready (cached)', 'ok');
      } else {
        const summarizerState = await availability('Summarizer', sumOpts, 5_000);
        setBadge(summarizerBadge, `summarizer: ${summarizerState}`, summarizerState === 'available' ? 'ok' : 'warn');
        if (summarizerState !== 'available') throw new Error(`Summarizer is ${summarizerState}`);
        summarizer = await createAndCacheSession('Summarizer', sumOpts, RUN_TIMEOUT);
      }
      const result = await timed(async () => {
        const value = await withTimeout(
          Promise.resolve(call(summarizer!, 'summarize', text)),
          RUN_TIMEOUT,
          'Summarizer.summarize()',
        );
        return String(value);
      });
      summarized.set(result.value);
      tSummarize.set(formatMs(result.ms));
    } catch (error) {
      detected.set(detected.root.querySelector('pre')?.textContent ?? '—');
      summarized.set(`${errText(error)}\n\nKeynote output:\n${CANNED.hello.summary}`);
      setBadge(summarizerBadge, 'fallback', 'warn');
    }
  });
}
