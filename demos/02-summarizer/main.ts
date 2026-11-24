import { availability, call, createAndCacheSession, errText, formatMs, getCachedSession, keynoteMode, stream, timed, warmSession, withTimeout } from '../shared/ai';
import { badge, button, chip, codeBlock, h, pre, section, withBusy } from '../shared/dom';
import { CANNED, REVIEWS } from '../shared/data';

type Length = 'short' | 'medium' | 'long';
type Format = 'plain-text' | 'markdown';

const RUN_TIMEOUT = 30_000;
const SUMMARIZER_BASE = {
  type: 'tldr',
  expectedInputLanguages: ['en', 'fr', 'es', 'ja'],
  outputLanguage: 'en',
} as const;

function summarizerOptions(): Record<string, unknown> {
  return { ...SUMMARIZER_BASE, format, length };
}

const LENGTHS: Array<{ label: string; value: Length }> = [
  { label: '1 sentence', value: 'short' },
  { label: '3 bullets', value: 'medium' },
  { label: 'Short paragraph', value: 'long' },
];

const app = document.querySelector<HTMLDivElement>('#app')!;

const textArea = h('textarea');
textArea.value = REVIEWS;
textArea.rows = 7;

const formatButtons = h('div', { class: 'controls' });
const lengthButtons = h('div', { class: 'controls' });
const runButton = button('Summarize', () => void run(), 'primary');
const stateLine = h('div', { class: 'controls' });
const timings = h('div', { class: 'chips' });
const result = pre('Streaming summary');
const codePanel = codeBlock('');

const fmtBadge = badge('format: plain-text', 'idle');
const lenBadge = badge('length: short', 'idle');
stateLine.append(fmtBadge, lenBadge);
const tCreate = chip('create()', '—');
const tFirst = chip('first token', '—');
const tTotal = chip('total', '—');
timings.append(tCreate.root, tFirst.root, tTotal.root);

let format: Format = 'plain-text';
let length: Length = 'short';

function cannedSummary(value: Length): string {
  if (value === 'medium') return CANNED.summary.bullets;
  if (value === 'long') return CANNED.summary.paragraph;
  return CANNED.summary.short;
}

function syncCode(): void {
  codePanel.set(`const options = {
  type: 'tldr',           // task-specific, not a free-form prompt
  format: '${format}',
  length: '${length}',
  expectedInputLanguages: ['en', 'fr', 'es', 'ja'],
  outputLanguage: 'en',
};

const state = await Summarizer.availability(options);
// 'unavailable' | 'downloadable' | 'downloading' | 'available'

if (state === 'available') {
  const session = await Summarizer.create(options);
  const stream = session.summarizeStreaming(text);
  for await (const chunk of stream) {
    outputEl.textContent += chunk;
  }
}`);
  fmtBadge.textContent = `format: ${format}`;
  lenBadge.textContent = `length: ${length}`;
  for (const b of formatButtons.querySelectorAll('button')) {
    b.classList.toggle('active', (b as HTMLButtonElement).dataset.value === format);
  }
  for (const b of lengthButtons.querySelectorAll('button')) {
    b.classList.toggle('active', (b as HTMLButtonElement).dataset.value === length);
  }
}

/** The deck calls this hook when the demo iframe loads; warm happens in this realm. */
async function warmDemo(): Promise<void> {
  await warmSession('Summarizer', summarizerOptions());
}
(window as any).__warmDemo = () => warmDemo();

for (const item of [
  { label: 'plain text', value: 'plain-text' },
  { label: 'markdown', value: 'markdown' },
] as Array<{ label: string; value: Format }>) {
  const b = button(item.label, () => {
    format = item.value;
    syncCode();
    void warmSession('Summarizer', summarizerOptions());
  });
  b.dataset.value = item.value;
  formatButtons.append(b);
}
for (const item of LENGTHS) {
  const b = button(item.label, () => {
    length = item.value;
    syncCode();
    void warmSession('Summarizer', summarizerOptions());
  });
  b.dataset.value = item.value;
  lengthButtons.append(b);
}
textArea.rows = 7;
app.append(
  h('div', { class: 'wrap', style: 'padding:12px 14px 16px;max-width:1180px;' },
    h('header', { class: 'top', style: 'margin-bottom:10px;padding-bottom:8px;' },
      h('h1', { text: 'Summarize — you pick the shape', style: 'font-size:16px;' }),
      h('span', { class: 'sub', text: 'Summarizer API · streaming' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('div', { class: 'grid two', style: 'gap:10px; align-items:start; grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);' },
      h('div', {},
        section('Input',
          textArea,
          h('div', { class: 'grid two', style: 'gap:8px; margin-top:8px;' },
            h('div', {}, h('label', { text: 'Format' }), formatButtons),
            h('div', {}, h('label', { text: 'Length' }), lengthButtons),
          ),
          h('div', { class: 'controls' }, runButton),
          stateLine,
          timings,
          h('p', { class: 'muted small', text: 'Paste any text. Summarizer is task-specific and streams.' }),
        ),
        codePanel.root,
      ),
      result.root,
    ),
  ),
);
syncCode();

async function run(): Promise<void> {
  await withBusy(runButton, 'Running…', async () => {
    result.set('');
    tCreate.set('—');
    tFirst.set('—');
    tTotal.set('—');

    if (keynoteMode()) {
      result.set(cannedSummary(length));
      tFirst.set('canned');
      tTotal.set('canned');
      setBadge(fmtBadge, 'summarizer: keynote mode', 'warn');
      return;
    }

    const options = summarizerOptions();
    try {
      let session = getCachedSession('Summarizer', options);
      if (session) {
        setBadge(fmtBadge, 'summarizer: ready (cached)', 'ok');
        tCreate.set('cached');
      } else {
        const state = await availability('Summarizer', options, 5_000);
        setBadge(fmtBadge, `summarizer: ${state}`, state === 'available' ? 'ok' : 'warn');
        if (state !== 'available') throw new Error(`Summarizer is ${state} on this machine`);
        const created = await timed(() => createAndCacheSession('Summarizer', options, RUN_TIMEOUT));
        session = created.value;
        tCreate.set(formatMs(created.ms));
      }
      const iterator = call(session!, 'summarizeStreaming', textArea.value);
      let live = true;
      try {
        const out = await withTimeout(stream(iterator, (chunk) => {
          if (!live) return;
          const el = result.root.querySelector('pre');
          if (el) el.textContent = (el.textContent ?? '') + chunk;
        }), RUN_TIMEOUT, 'Summarizer.summarizeStreaming()');
        tFirst.set(formatMs(out.firstTokenMs));
        tTotal.set(formatMs(out.totalMs));
      } finally {
        live = false;
      }
    } catch (error) {
      result.set(`${errText(error)}\n\nKeynote output:\n${cannedSummary(length)}`);
      setBadge(fmtBadge, 'summarizer: fallback', 'warn');
    }
  });
}

function setBadge(el: HTMLElement, label: string, kind: 'ok' | 'warn' | 'bad' | 'idle'): void {
  el.textContent = label;
  el.className = `badge badge-${kind}`;
}
