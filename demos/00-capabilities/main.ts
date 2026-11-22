import {
  API_NAMES,
  apiExists,
  availability,
  call,
  createSession,
  errText,
  formatMs,
  getCtor,
  timed,
  withTimeout,
  type Availability,
} from '../shared/ai';
import { badge, button, h, pre } from '../shared/dom';

type Result = {
  api: string;
  exists: boolean;
  availability: Availability;
  createMs?: number;
  firstTokenMs?: number;
  totalMs?: number;
  sample?: string;
  error?: string;
};

const DETECT_TEXT = 'Ceci est une phrase en français.';
const SHORT_TEXT = 'The app is fast and lovely, but PDF export crashes every time.';

const PROBE_OPTIONS: Record<string, Record<string, unknown>> = {
  LanguageModel: { expectedOutputs: [{ type: 'text', languages: ['en'] }] },
  Translator: { sourceLanguage: 'en', targetLanguage: 'fr' },
  LanguageDetector: {},
  Summarizer: {
    type: 'tldr',
    format: 'plain-text',
    length: 'short',
    expectedInputLanguages: ['en'],
    outputLanguage: 'en',
  },
  Writer: { expectedInputLanguages: ['en'], outputLanguage: 'en' },
  Rewriter: { expectedInputLanguages: ['en'], outputLanguage: 'en' },
  Proofreader: { expectedInputLanguages: ['en'], outputLanguage: 'en' },
};

async function invoke(session: Record<string, (...args: unknown[]) => unknown>, name: string): Promise<string> {
  const attempts = {
    LanguageModel: [['prompt', ['Reply with exactly the word OK.']]],
    Translator: [['translate', ['Hello world']]],
    LanguageDetector: [['detect', [DETECT_TEXT]]],
    Summarizer: [
      ['summarize', [SHORT_TEXT]],
      ['summarize', [{ input: SHORT_TEXT }]],
    ],
    Writer: [
      ['write', [{ prompt: 'Write a one sentence note declining a meeting.' }]],
      ['write', ['Write a one sentence note declining a meeting.']],
    ],
    Rewriter: [
      ['rewrite', ['hey can u send the file today']],
      ['rewrite', [{ input: 'hey can u send the file today' }]],
    ],
    Proofreader: [
      ['proofread', ["Their going too the store."]],
      ['proofread', [{ input: 'Their going too the store.' }]],
    ],
  }[name] ?? [] as Array<[string, unknown[]]>;

  const attemptsTyped = attempts as Array<[string, unknown[]]>;
  let last = '';
  for (const [method, args] of attemptsTyped) {
    if (typeof session[method] !== 'function') {
      last = `session.${method}() is not a function`;
      continue;
    }
    try {
      const value = await withTimeout(Promise.resolve(call(session, method, ...args)), 40_000, `${name}.${method}()`);
      if (typeof value === 'string') return value;
      return JSON.stringify(value);
    } catch (error) {
      last = errText(error);
    }
  }
  throw new Error(last || 'no callable inference method found');
}

async function probe(name: string): Promise<Result> {
  const options = PROBE_OPTIONS[name] ?? {};
  const exists = apiExists(name);
  const state = await availability(name, options);
  if (!exists || state === 'unavailable' || state === 'error') {
    return { api: name, exists, availability: state, error: exists ? `availability: ${state}` : 'global is not defined' };
  }
  if (state === 'downloading' || state === 'downloadable') {
    return {
      api: name,
      exists,
      availability: state,
      error: 'Model is not provisioned on this machine. Open the API in a supported browser on an unmetered connection with 20–22 GB free.',
    };
  }

  try {
    const created = await timed(() => createSession(name, options, 60_000));
    const ran = await timed(() => invoke(created.value, name));
    const streamLike = ran.value.length > 0;
    const destroy = created.value['destroy'];
    if (typeof destroy === 'function') destroy.call(created.value);
    return {
      api: name,
      exists,
      availability: state,
      createMs: created.ms,
      totalMs: ran.ms,
      firstTokenMs: streamLike ? ran.ms : undefined,
      sample: ran.value.slice(0, 220),
    };
  } catch (error) {
    return { api: name, exists, availability: state, error: errText(error) };
  }
}

async function imageProbe(): Promise<Result> {
  const name = 'LanguageModel';
  const options = {
    expectedInputs: [{ type: 'image', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
  };
  const state = await availability(name, options);
  if (state !== 'available') {
    return {
      api: 'Prompt API (image input)',
      exists: apiExists(name),
      availability: state,
      error: state === 'downloadable' || state === 'downloading'
        ? 'Model not provisioned for this modality yet'
        : 'Image input is not available in this browser/build',
    };
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, 0, 32, 32);
    }
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/png'));
    const session = await createSession(name, options, 60_000);
    const ran = await timed(async () => {
      const value = await withTimeout(
        Promise.resolve(call(session, 'prompt', [blob, 'What color is the shape? Answer one word.'])),
        60_000,
        'image prompt',
      );
      return String(value);
    });
    return {
      api: 'Prompt API (image input)',
      exists: true,
      availability: state,
      totalMs: ran.ms,
      sample: ran.value.slice(0, 220),
    };
  } catch (error) {
    return { api: 'Prompt API (image input)', exists: true, availability: state, error: errText(error) };
  }
}

function stateBadge(state: Availability): HTMLElement {
  if (state === 'available') return badge('available', 'ok');
  if (state === 'downloadable' || state === 'downloading') return badge(state, 'warn');
  if (state === 'error') return badge('error', 'bad');
  return badge(state, 'idle');
}

const app = document.querySelector<HTMLDivElement>('#app')!;
const tableBody = h('tbody');
const summary = h('p', { class: 'muted', text: 'No probes run yet. This page tests every built-in AI API in this browser.' });
const raw = pre('JSON results (paste this back to the presenter)');
const runButton = button('Run all capability probes', () => void runAll(), 'primary');
const copyButton = button('Copy JSON', () => void copy());

app.append(
  h('div', { class: 'wrap' },
    h('header', { class: 'top' },
      h('h1', { text: 'Capability matrix' }),
      h('span', { class: 'sub', text: 'Chrome 138+ / Edge 158+ with flags · one browser per run' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('p', { class: 'muted', text:
      'This is the rehearsal instrument. It checks whether each API exists, what its availability state is, how long create() takes, and how long a real inference takes. No byte-progress events are used — the browser owns that download.' }),
    h('div', { class: 'controls' }, runButton, copyButton),
    summary,
    h('section', { class: 'panel' },
      h('h3', { text: 'Results' }),
      h('table', {},
        h('thead', {}, h('tr', {},
          h('th', { text: 'API' }), h('th', { text: 'State' }), h('th', { text: 'create()' }),
          h('th', { text: 'Inference' }), h('th', { text: 'Sample / error' }),
        )),
        tableBody,
      ),
    ),
    raw.root,
    h('p', { class: 'muted small', text:
      'Inference numbers on the rehearsal laptop (CPU path, Performance Class: Medium): cold first token ~19.2s, warm first token ~0.4s, warm total ~2.0s for ~150 characters.' }),
  ),
);

let results: Result[] = [];
let running = false;

function render(): void {
  tableBody.replaceChildren();
  for (const result of results) {
    tableBody.append(h('tr', {},
      h('td', { class: 'mono', text: result.api }),
      h('td', {}, stateBadge(result.availability)),
      h('td', { class: 'mono', text: result.createMs === undefined ? '—' : formatMs(result.createMs) }),
      h('td', { class: 'mono', text: result.totalMs === undefined ? '—' : formatMs(result.totalMs) }),
      h('td', { class: 'mono', text: result.error ?? result.sample ?? '—' }),
    ));
  }
  raw.set(JSON.stringify({ browser: navigator.userAgent, testedAt: new Date().toISOString(), results }, null, 2));
}

async function runAll(): Promise<void> {
  if (running) return;
  running = true;
  runButton.disabled = true;
  results = [];
  try {
    for (const name of API_NAMES) {
      summary.textContent = `Probing ${name}…`;
      results.push(await probe(name));
      render();
    }
    summary.textContent = 'Probing image modality…';
    results.push(await imageProbe());
    render();
    summary.textContent = 'Done. Copy the JSON and send it to the presenter.';
  } finally {
    running = false;
    runButton.disabled = false;
  }
}

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(JSON.stringify({ browser: navigator.userAgent, testedAt: new Date().toISOString(), results }, null, 2));
    copyButton.textContent = 'Copied ✓';
    window.setTimeout(() => { copyButton.textContent = 'Copy JSON'; }, 1400);
  } catch {
    copyButton.textContent = 'Select the JSON manually';
  }
}

// Report globals immediately so an unsupported browser isn't a blank page.
summary.textContent = `Globals present: ${API_NAMES.filter(apiExists).join(', ') || 'none'}. ${getCtor('LanguageModel') ? '' : 'Prompt API requires Chrome 148+ or the Edge flag.'}`;
