import { availability, call, createAndCacheSession, errText, getCachedSession, keynoteMode, timed } from '../shared/ai';
import { badge, button, codeBlock, h, pre, section } from '../shared/dom';
import { INJECTION_INPUT, INJECTION_OUTPUT_CANNED } from '../shared/data';

const OPTIONS = { sourceLanguage: 'fr', targetLanguage: 'en' };

const app = document.querySelector<HTMLDivElement>('#app')!;

const input = h('textarea', { spellcheck: 'false' });
input.value = INJECTION_INPUT;

const runButton = button('Translate', () => void run(), 'primary');
const downloadButton = button('Download model', () => void downloadModel(), 'ghost');
const stateLine = h('div', { class: 'controls' });
const timingLine = h('div', { class: 'chips' });
const translated = pre('Translated output — rendered as TEXT, never as HTML');

const code = codeBlock(`const translator = await Translator.create({
  sourceLanguage: 'fr',
  targetLanguage: 'en',
});

// The API translates TEXT. It does not sanitize markup.
const output = await translator.translate(userInput);

// ✅ Safe: textContent, or setHTML() with a sanitizer / Trusted Types
outputEl.textContent = output;

// ❌ Never do this:
// outputEl.innerHTML = output;`);

const unsafeBox = h('div', { class: 'callout bad' },
  h('strong', { text: 'Why this matters: ' }),
  document.createTextNode('a mistyped tag in the source becomes a working '),
  h('code', { text: '<script>' }),
  document.createTextNode(' in the output. If that string is assigned to innerHTML, it executes. HTML handling in a text-only translation API is coincidental.'),
);

input.rows = 2;
app.append(
  h('div', { class: 'wrap', style: 'padding:12px 14px 16px;max-width:1180px;' },
    h('header', { class: 'top', style: 'margin-bottom:10px;padding-bottom:8px;' },
      h('h1', { text: 'Translated text is not safe HTML', style: 'font-size:16px;' }),
      h('span', { class: 'sub', text: 'Text in · text out' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('div', { class: 'grid two', style: 'gap:10px; align-items:start; grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);' },
      section('Input',
        input,
        h('div', { class: 'controls' }, runButton, downloadButton),
        stateLine,
        timingLine,
        unsafeBox,
        h('p', { class: 'muted small', text: 'Chrome reports the pair as “downloadable” until this page creates it. After Download model, Translate reuses the ready session.' }),
      ),
      h('div', { class: 'grid', style: 'gap:10px;' }, translated.root, code.root),
    ),
  ),
);

const stateBadge = badge('translator: not checked', 'idle');
stateLine.append(stateBadge);

async function downloadModel(): Promise<void> {
  downloadButton.disabled = true;
  stateBadge.textContent = 'translator: downloading…';
  stateBadge.className = 'badge badge-warn';
  try {
    const cached = getCachedSession('Translator', OPTIONS);
    if (cached) {
      stateBadge.textContent = 'translator: ready (cached)';
      stateBadge.className = 'badge badge-ok';
    } else {
      const st = await availability('Translator', OPTIONS);
      if (st === 'unavailable') {
        stateBadge.textContent = 'translator: unavailable';
        stateBadge.className = 'badge badge-warn';
      } else {
        await createAndCacheSession('Translator', OPTIONS, 180_000);
        stateBadge.textContent = 'translator: ready (cached)';
        stateBadge.className = 'badge badge-ok';
      }
    }
  } catch (e) {
    stateBadge.textContent = `translator: ${errText(e)}`;
    stateBadge.className = 'badge badge-bad';
  } finally { downloadButton.disabled = false; }
}

async function run(): Promise<void> {
  runButton.disabled = true;
  timingLine.replaceChildren();
  const text = input.value.trim() || INJECTION_INPUT;
  try {
    let output: string;
    let ms = 0;
    if (keynoteMode()) {
      output = INJECTION_OUTPUT_CANNED;
      stateBadge.textContent = 'translator: keynote mode';
      stateBadge.className = 'badge badge-warn';
    } else {
      const cached = getCachedSession('Translator', OPTIONS);
      let session;
      if (cached) {
        session = cached;
        stateBadge.textContent = 'translator: ready (cached)';
        stateBadge.className = 'badge badge-ok';
      } else {
        const state = await availability('Translator', OPTIONS);
        stateBadge.textContent = `translator: ${state}`;
        stateBadge.className = `badge badge-${state === 'available' ? 'ok' : state === 'error' ? 'bad' : 'warn'}`;
        if (state !== 'available') throw new Error(`Translator is ${state}. Click “Download model” once from this demo (user gesture). Recorded output below shows the risk.`);
        session = await createAndCacheSession('Translator', OPTIONS);
      }
      const result = await timed(async () => String(await call(session, 'translate', text)));
      output = result.value;
      ms = result.ms;
    }
    translated.set(output);
    timingLine.append(
      h('span', { class: 'chip' }, h('span', { class: 'chip-label', text: 'source' }), h('span', { class: 'chip-value', text: 'fr → en' })),
      h('span', { class: 'chip' }, h('span', { class: 'chip-label', text: 'time' }), h('span', { class: 'chip-value', text: ms ? `${ms}ms` : 'canned' })),
    );
  } catch (error) {
    translated.set(`${errText(error)}\n\nExpected output from the recorded demo:\n${INJECTION_OUTPUT_CANNED}`);
    stateBadge.textContent = 'translator: fallback';
    stateBadge.className = 'badge badge-warn';
  } finally {
    runButton.disabled = false;
  }
}
