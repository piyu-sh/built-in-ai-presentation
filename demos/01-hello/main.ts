import { availability, call, createSession, errText, formatMs, keynoteMode, timed } from '../shared/ai';
import { badge, button, chip, codeBlock, h, pre, section } from '../shared/dom';
import { CANNED, SAMPLES } from '../shared/data';

const app = document.querySelector<HTMLDivElement>('#app')!;

const textArea = h('textarea', {});
textArea.value = SAMPLES[1]!.text;
textArea.rows = 3;
const samples = h('div', { class: 'controls' });
const target = h('select');
for (const lang of ['en', 'fr', 'de', 'es', 'ja']) {
  target.append(h('option', { value: lang, text: lang }));
}
target.value = 'en';

const runButton = button('Run', () => void run(), 'primary');
const state = h('div', { class: 'controls' });
const timings = h('div', { class: 'chips' });
const detected = pre('1 · Language Detector');
const translated = pre('2 · Translator');
const summarized = pre('3 · Summarizer');

const codePanel = codeBlock(`// Three tasks, one shape: availability() → create() → call()
const detector = await LanguageDetector.create();
const [guess] = await detector.detect(text);

const translator = await Translator.create({
  sourceLanguage: guess.detectedLanguage,
  targetLanguage: 'en',
});
const english = await translator.translate(text);

const summarizer = await Summarizer.create({ type: 'tldr', length: 'short' });
const summary = await summarizer.summarize(text);`);

for (const sample of SAMPLES) {
  const b = button(sample.label, () => { textArea.value = sample.text; });
  if (sample.label === 'Français') b.classList.add('active');
  samples.append(b);
}

app.append(
  h('div', { class: 'wrap' },
    h('header', { class: 'top' },
      h('h1', { text: 'Detect → translate → summarize' }),
      h('span', { class: 'sub', text: 'One shape, three APIs' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('div', { class: 'grid two', style: 'gap:10px; align-items:start;' },
      h('div', {},
        section('Input',
          samples,
          textArea,
          h('div', { class: 'controls' }, h('label', { text: 'Translate to', style: 'margin:0 6px 0 0;' }), target, runButton),
          state,
          timings,
        ),
        codePanel.root,
      ),
      h('div', { class: 'grid', style: 'gap:10px;' }, detected.root, translated.root, summarized.root),
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

    const summarizerState = await availability('Summarizer', { type: 'tldr', length: 'short' });
    setBadge(summarizerBadge, `summarizer: ${summarizerState}`, summarizerState === 'available' ? 'ok' : 'warn');
    if (summarizerState !== 'available') throw new Error(`Summarizer is ${summarizerState}`);
    const summarizer = await createSession('Summarizer', { type: 'tldr', format: 'plain-text', length: 'short', outputLanguage: dest });
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
