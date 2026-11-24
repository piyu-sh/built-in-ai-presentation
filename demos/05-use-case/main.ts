import { availability, call, createAndCacheSession, errText, formatMs, getCachedSession, keynoteMode, timed, warmSession, withTimeout } from '../shared/ai';
import { badge, button, chip, h, pre, section, withBusy } from '../shared/dom';

type Suggestion = { api: string; why: string; fallback: string; firstStep: string };

const OPTIONS = { expectedOutputs: [{ type: 'text', languages: ['en'] }] };
const RUN_TIMEOUT = 30_000;
const DOWNLOAD_TIMEOUT = 180_000;

const app = document.querySelector<HTMLDivElement>('#app')!;

const useCase = h('textarea');
useCase.rows = 2;
useCase.placeholder = 'Type the audience use case here…';
useCase.value = 'Summarize support emails on-device so agents can respond faster.';

const constraint = h('select');
for (const opt of [
  ['private', 'Private/sensitive'],
  ['offline', 'Offline'],
  ['latency', 'Low latency / low cost'],
  ['reach', 'Mobile reach / latest knowledge'],
] as const) constraint.append(h('option', { value: opt[0], text: opt[1] }));

const runButton = button('Turn into plan', () => void run(), 'primary');
const downloadButton = button('Download model', () => void downloadModel(), 'ghost');
const state = badge('Prompt API: —', 'idle');
const chips = h('div', { class: 'chips' });
const tCreate = chip('create()', '—');
const tPrompt = chip('prompt()', '—');
chips.append(tCreate.root, tPrompt.root);

const output = pre('Plan');
// Keep layout minimal for slide viewport.

function localSuggest(text: string, c: string): Suggestion {
  const t = text.toLowerCase();
  const fallback = c === 'reach'
    ? 'Use cloud/hybrid when users need mobile reach, latest knowledge, or the built-in model is unavailable.'
    : 'Check availability(); if unavailable, fall back to cloud/server or a reduced non-AI UX.';
  if (/(translate|language|multilingual|locale)/.test(t)) return { api: 'Language Detector + Translator', why: 'Narrow multilingual job; task APIs are simpler than prompting.', fallback, firstStep: 'Detect language, then translate only when needed; show original text on fallback.' };
  if (/(summary|summarize|tldr|condense|notes)/.test(t)) return { api: 'Summarizer', why: 'Purpose-built for condensing text; good default for private/offline summaries.', fallback, firstStep: 'Start with type:tldr/key-points, stream output, and cap input length.' };
  if (/(extract|json|form|receipt|invoice|email fields|schema)/.test(t)) return { api: 'Prompt API + responseConstraint', why: 'Custom extraction needs flexible prompting, but schema keeps output machine-usable.', fallback, firstStep: 'Define a small JSON Schema, prompt with responseConstraint, parse and validate.' };
  if (/(rewrite|proofread|grammar|tone|draft|write)/.test(t)) return { api: 'Writer / Rewriter / Proofreader (or Prompt API fallback)', why: 'Writing-assist APIs map directly; check origin-trial/availability.', fallback, firstStep: 'Feature-detect the specific writing API; use Prompt API/cloud fallback when unavailable.' };
  return { api: 'Prompt API', why: 'Custom job; Prompt API is flexible, especially with structured output.', fallback, firstStep: 'Prototype with a small prompt, add responseConstraint if output feeds code, keep fallback.' };
}

function renderSuggestion(s: Suggestion, source: string): void {
  state.textContent = `Plan: ${source}`;
  state.className = `badge ${source.includes('Prompt API') ? 'badge-ok' : 'badge-warn'}`;
  output.set(`Use case: ${useCase.value.trim()}\n\nBest fit: ${s.api}\nWhy: ${s.why}\nFallback: ${s.fallback}\nFirst step: ${s.firstStep}`);
}

app.append(
  h('div', { class: 'wrap', style: 'padding:12px 14px 16px;max-width:1180px;' },
    h('header', { class: 'top', style: 'margin-bottom:10px;padding-bottom:8px;' },
      h('h1', { text: 'Audience use case → plan', style: 'font-size:16px;' }),
      h('span', { class: 'sub', text: 'Ask the room, type it live' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('div', { class: 'grid two', style: 'gap:10px; align-items:start; grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);' },
      section('Audience input',
        h('label', { text: 'Use case' }), useCase,
        h('div', { class: 'controls' }, h('label', { text: 'Constraint', style: 'margin:0 4px 0 0;' }), constraint),
        h('div', { class: 'controls' }, runButton, downloadButton, state),
        chips,
        h('p', { class: 'muted small', style: 'margin:6px 0 0;', text: 'GitHub Pages is static: no live audience submissions. Ask verbally and type answers here.' }),
      ),
      h('div', { class: 'grid', style: 'gap:8px;' }, output.root),
    ),
  ),
);

/** The deck calls this hook when the demo iframe loads; warm happens in this realm. */
async function warmDemo(): Promise<void> {
  await warmSession('LanguageModel', OPTIONS);
}
(window as any).__warmDemo = () => warmDemo();

async function downloadModel(): Promise<void> {
  await withBusy(downloadButton, 'Downloading…', async () => {
    state.textContent = 'Prompt API: checking/downloading…';
    state.className = 'badge badge-warn';
    try {
      if (getCachedSession('LanguageModel', OPTIONS)) {
        state.textContent = 'Prompt API: ready (cached)';
        state.className = 'badge badge-ok';
        return;
      }
      const st = await availability('LanguageModel', OPTIONS);
      if (st === 'unavailable') {
        state.textContent = `Prompt API: ${st}`;
        state.className = 'badge badge-warn';
        return;
      }
      await createAndCacheSession('LanguageModel', OPTIONS, DOWNLOAD_TIMEOUT);
      state.textContent = 'Prompt API: ready (cached)';
      state.className = 'badge badge-ok';
    } catch (e) {
      state.textContent = `Prompt API: ${errText(e)}`;
      state.className = 'badge badge-bad';
    }
  });
}

async function run(): Promise<void> {
  await withBusy(runButton, 'Running…', async () => {
    tCreate.set('—'); tPrompt.set('—');
    const text = useCase.value.trim();
    const c = constraint.value;
    if (!text) return;
    if (keynoteMode()) { renderSuggestion(localSuggest(text, c), 'canned/local'); tPrompt.set('canned'); return; }
    const schema = { type: 'object', properties: { api: { type: 'string' }, why: { type: 'string' }, fallback: { type: 'string' }, firstStep: { type: 'string' } }, required: ['api', 'why', 'fallback', 'firstStep'], additionalProperties: false };
    const prompt = `You are helping a web developer choose a browser built-in AI API.
Audience use case: ${text}
Constraint: ${c}
Pick the best fit from: Language Detector, Translator, Summarizer, Prompt API, Writer, Rewriter, Proofreader, or hybrid/cloud.
Be practical. Prefer narrow task APIs when they fit. Include a fallback. Return JSON.`;
    try {
      let session = getCachedSession('LanguageModel', OPTIONS);
      if (session) {
        tCreate.set('cached');
      } else {
        const st = await availability('LanguageModel', OPTIONS, 5_000);
        if (st !== 'available') throw new Error(`Prompt API is ${st}`);
        const created = await timed(() => createAndCacheSession('LanguageModel', OPTIONS, RUN_TIMEOUT));
        session = created.value;
        tCreate.set(formatMs(created.ms));
      }
      const prompted = await timed(async () => {
        const value = await withTimeout(
          Promise.resolve(call(session!, 'prompt', prompt, { responseConstraint: schema })),
          RUN_TIMEOUT,
          'LanguageModel.prompt()',
        );
        return String(value);
      });
      tPrompt.set(formatMs(prompted.ms));
      renderSuggestion(JSON.parse(prompted.value) as Suggestion, 'Prompt API');
    } catch (error) {
      renderSuggestion(localSuggest(text, c), `local fallback (${errText(error)})`);
    }
  });
}
