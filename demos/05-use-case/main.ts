import { availability, call, createSession, errText, formatMs, keynoteMode, timed } from '../shared/ai';
import { badge, button, chip, codeBlock, h, pre, section } from '../shared/dom';

type Suggestion = { api: string; why: string; fallback: string; pattern: string };

const app = document.querySelector<HTMLDivElement>('#app')!;

const useCase = h('textarea');
useCase.rows = 3;
useCase.value = 'I want users to paste long support emails and get a short summary they can act on.';

const constraint = h('select');
for (const opt of [
  ['private', 'Sensitive/private data'],
  ['offline', 'Needs to work offline'],
  ['latency', 'Low latency / no server cost'],
  ['reach', 'Needs mobile reach / latest knowledge'],
] as const) {
  constraint.append(h('option', { value: opt[0], text: opt[1] }));
}

const runButton = button('Map to an API', () => void run(), 'primary');
const state = badge('Prompt API: —', 'idle');
const chips = h('div', { class: 'chips' });
const tCreate = chip('create()', '—');
const tPrompt = chip('prompt()', '—');
chips.append(tCreate.root, tPrompt.root);

const output = pre('Suggestion');
const code = codeBlock(`const session = await LanguageModel.create({
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

const result = await session.prompt(prompt, {
  responseConstraint: schema, // JSON Schema keeps output parseable
});
const suggestion = JSON.parse(result);`);

function localSuggest(text: string, c: string): Suggestion {
  const t = text.toLowerCase();
  const fallback = c === 'reach'
    ? 'Cloud / hybrid fallback for mobile reach or latest knowledge.'
    : 'Cloud fallback when built-in AI is unavailable.';
  if (t.includes('translate') || t.includes('language') || t.includes('multilingual')) {
    return { api: 'Language Detector + Translator', why: 'Narrow multilingual task with clear input/output.', fallback, pattern: 'availability() → create() → detect/translate' };
  }
  if (t.includes('summary') || t.includes('summarize') || t.includes('tldr') || t.includes('condense')) {
    return { api: 'Summarizer', why: 'Purpose-built for condensing text; prefer task API over free-form prompting.', fallback, pattern: 'availability() → create() → summarize/summarizeStreaming' };
  }
  if (t.includes('extract') || t.includes('json') || t.includes('form') || t.includes('receipt') || t.includes('email fields')) {
    return { api: 'Prompt API + responseConstraint', why: 'Custom extraction is a good fit for schema-constrained JSON output.', fallback, pattern: 'availability() → create() → prompt(..., { responseConstraint })' };
  }
  if (t.includes('rewrite') || t.includes('proofread') || t.includes('grammar') || t.includes('tone') || t.includes('draft')) {
    return { api: 'Writer / Rewriter / Proofreader (or Prompt API fallback)', why: 'Writing-assist APIs fit, but check availability because they may be origin-trial.', fallback, pattern: 'availability() → create() → write/rewrite/proofread' };
  }
  return { api: 'Prompt API', why: 'Custom job; start with Prompt API and constrain output when structure matters.', fallback, pattern: 'availability() → create() → prompt()' };
}

function renderSuggestion(s: Suggestion, source: string): void {
  state.textContent = `Suggestion: ${source}`;
  state.className = `badge ${source.includes('Prompt API') ? 'badge-ok' : 'badge-warn'}`;
  output.set(`API: ${s.api}\nWhy: ${s.why}\nFallback: ${s.fallback}\nPattern: ${s.pattern}`);
}

app.append(
  h('div', { class: 'wrap narrow' },
    h('header', { class: 'top' },
      h('h1', { text: 'Audience use case → API' }),
      h('span', { class: 'sub', text: 'Live brainstorm · Prompt API with local fallback' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('div', { class: 'grid two' },
      section('Audience use case',
        h('label', { text: 'What do they want to build?' }), useCase,
        h('label', { text: 'Constraint' }), constraint,
        h('div', { class: 'controls' }, runButton, state),
        chips,
        h('p', { class: 'muted small', text: 'This is a brainstorming aid. Verify API availability and UX constraints before shipping.' }),
      ),
      output.root,
    ),
    code.root,
  ),
);

async function run(): Promise<void> {
  runButton.disabled = true;
  tCreate.set('—'); tPrompt.set('—');
  const text = useCase.value.trim();
  const c = constraint.value;
  if (keynoteMode()) {
    renderSuggestion(localSuggest(text, c), 'canned/local');
    tPrompt.set('canned');
    runButton.disabled = false;
    return;
  }
  const schema = {
    type: 'object',
    properties: {
      api: { type: 'string' },
      why: { type: 'string' },
      fallback: { type: 'string' },
      pattern: { type: 'string' },
    },
    required: ['api', 'why', 'fallback', 'pattern'],
    additionalProperties: false,
  };
  const prompt = `You are helping pick a browser built-in AI API for a web app.
User use case: ${text}
Constraint: ${c}
Choose from: Language Detector, Translator, Summarizer, Prompt API, Writer/Rewriter/Proofreader, or hybrid/cloud fallback.
Return JSON with api, why, fallback, pattern. Keep it practical and short.`;
  try {
    const opts = { expectedOutputs: [{ type: 'text', languages: ['en'] }] };
    const st = await availability('LanguageModel', opts);
    if (st !== 'available') throw new Error(`Prompt API is ${st}`);
    const created = await timed(() => createSession('LanguageModel', opts, 60_000));
    tCreate.set(formatMs(created.ms));
    const prompted = await timed(async () => String(await call(created.value, 'prompt', prompt, { responseConstraint: schema })));
    tPrompt.set(formatMs(prompted.ms));
    renderSuggestion(JSON.parse(prompted.value) as Suggestion, 'Prompt API');
  } catch (error) {
    renderSuggestion(localSuggest(text, c), `local fallback (${errText(error)})`);
  } finally {
    runButton.disabled = false;
  }
}
