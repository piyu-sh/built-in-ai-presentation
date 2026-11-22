import { availability, createSession, errText, keynoteMode, timed, call } from '../shared/ai';
import { badge, button, h, pre, section } from '../shared/dom';
import { INJECTION_INPUT, INJECTION_OUTPUT_CANNED } from '../shared/data';

const OPTIONS = { sourceLanguage: 'fr', targetLanguage: 'en' };

const app = document.querySelector<HTMLDivElement>('#app')!;

const input = h('textarea', { spellcheck: 'false' });
input.value = INJECTION_INPUT;

const runButton = button('Translate it (fr → en)', () => void run(), 'primary');
const stateLine = h('div', { class: 'controls' });
const timingLine = h('div', { class: 'chips' });
const translated = pre('Translated output — rendered as TEXT, never as HTML');

const code = pre('Code');
code.set(`const translator = await Translator.create({
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
  h('div', { class: 'wrap narrow' },
    h('header', { class: 'top' },
      h('h1', { text: 'Translated text is not safe HTML' }),
      h('span', { class: 'sub', text: 'Text in · text out' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('div', { class: 'grid two', style: 'gap:10px; align-items:start;' },
      section('Input',
        input,
        h('div', { class: 'controls' }, runButton),
        stateLine,
        timingLine,
        unsafeBox,
      ),
      h('div', { class: 'grid', style: 'gap:10px;' }, translated.root, code.root),
    ),
  ),
);

const stateBadge = badge('translator: not checked', 'idle');
stateLine.append(stateBadge);

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
      const state = await availability('Translator', OPTIONS);
      stateBadge.textContent = `translator: ${state}`;
      stateBadge.className = `badge badge-${state === 'available' ? 'ok' : state === 'error' ? 'bad' : 'warn'}`;
      if (state !== 'available') throw new Error(`Translator is ${state} on this machine — see keynote mode or the canned output below.`);
      const session = await createSession('Translator', OPTIONS, 60_000);
      const result = await timed(async () => String(call(session, 'translate', text)));
      output = result.value;
      ms = result.ms;
      const destroy = session['destroy'];
      if (typeof destroy === 'function') destroy.call(session);
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
