import { availability, call, createSession, errText, formatMs, keynoteMode, timed } from '../shared/ai';
import { badge, button, chip, codeBlock, h, pre, section } from '../shared/dom';
import { CANNED, INVOICE_EMAIL, SCHEMAS, type SchemaKey } from '../shared/data';

const app = document.querySelector<HTMLDivElement>('#app')!;

const textArea = h('textarea');
textArea.value = INVOICE_EMAIL;
textArea.rows = 6;

const schemaButtons = h('div', { class: 'controls' });
const runButton = button('Extract', () => void run(), 'primary');
const stateLine = h('div', { class: 'controls' });
const timings = h('div', { class: 'chips' });
const rawOutput = pre('Raw model output');
const fields = h('dl', { class: 'kv' });
const resultPanel = section('Parsed object', fields);
const codePanel = codeBlock('');

let schemaKey: SchemaKey = 'invoice';

const stateBadge = badge('Prompt API: —', 'idle');
const audienceBadge = badge('audience picked: invoice fields', 'idle');
stateLine.append(stateBadge, audienceBadge);
const tCreate = chip('create()', '—');
const tPrompt = chip('prompt()', '—');
const tParse = chip('parse', '—');
timings.append(tCreate.root, tPrompt.root, tParse.root);

function syncSchema(): void {
  const schema = SCHEMAS[schemaKey].schema;
  codePanel.set(`const schema = ${JSON.stringify(schema, null, 2)};

const session = await LanguageModel.create({
  initialPrompts: [{
    role: 'system',
    content: 'Extract the requested fields. Use an empty string when a field is genuinely absent. Never guess.',
  }],
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
  responseConstraint: schema,   // JSON Schema OR RegExp
});

const text = await session.prompt(documentText);
const data = JSON.parse(text);`);
  audienceBadge.textContent = `audience picked: ${schemaKey === 'invoice' ? 'invoice fields' : 'review fields'}`;
  for (const b of schemaButtons.querySelectorAll('button')) {
    b.classList.toggle('active', (b as HTMLButtonElement).dataset.key === schemaKey);
  }
}

for (const key of Object.keys(SCHEMAS) as SchemaKey[]) {
  const b = button(key === 'invoice' ? 'Invoice fields' : 'Review fields', () => {
    schemaKey = key;
    syncSchema();
  });
  b.dataset.key = key;
  if (key === schemaKey) b.classList.add('active');
  schemaButtons.append(b);
}

app.append(
  h('div', { class: 'wrap' },
    h('header', { class: 'top' },
      h('h1', { text: 'Prose in → typed object out' }),
      h('span', { class: 'sub', text: 'Prompt API + JSON Schema' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('div', { class: 'grid two', style: 'gap:10px; align-items:start;' },
      h('div', {},
        section('Input',
          textArea,
          h('label', { text: 'Schema' }),
          schemaButtons,
          h('div', { class: 'controls' }, runButton),
          stateLine,
          timings,
        ),
        codePanel.root,
      ),
      h('div', { class: 'grid', style: 'gap:10px;' }, resultPanel, rawOutput.root),
    ),
  ),
);
syncSchema();

function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const candidates = [cleaned];
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) candidates.push(cleaned.slice(first, last + 1));
  let error = 'Invalid JSON';
  for (const candidate of candidates) {
    try { return { ok: true, value: JSON.parse(candidate) }; }
    catch (e) { error = errText(e); }
  }
  return { ok: false, error };
}

function renderObject(value: unknown): void {
  fields.replaceChildren();
  if (typeof value !== 'object' || value === null) {
    fields.append(h('dt', { text: 'result' }), h('dd', { text: String(value) }));
    return;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const display = Array.isArray(entry) ? entry.join(', ') : typeof entry === 'string' ? entry : JSON.stringify(entry);
    fields.append(h('dt', { text: key }), h('dd', { text: display || '—' }));
  }
}

async function run(): Promise<void> {
  runButton.disabled = true;
  rawOutput.set('—');
  fields.replaceChildren();
  tCreate.set('—');
  tPrompt.set('—');
  tParse.set('—');

  if (keynoteMode()) {
    const canned = CANNED.structured[schemaKey];
    rawOutput.set(JSON.stringify(canned, null, 2));
    renderObject(canned);
    stateBadge.textContent = 'Prompt API: keynote mode';
    stateBadge.className = 'badge badge-warn';
    tPrompt.set('canned');
    runButton.disabled = false;
    return;
  }

  const options = {
    initialPrompts: [{
      role: 'system',
      content: 'Extract the requested fields. Use an empty string when a field is genuinely absent. Never guess.',
    }],
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
    responseConstraint: SCHEMAS[schemaKey].schema,
  };

  try {
    const state = await availability('LanguageModel', options);
    stateBadge.textContent = `Prompt API: ${state}`;
    stateBadge.className = `badge badge-${state === 'available' ? 'ok' : 'warn'}`;
    if (state !== 'available') throw new Error(`Prompt API is ${state} on this machine`);
    const created = await timed(() => createSession('LanguageModel', options, 60_000));
    tCreate.set(formatMs(created.ms));
    const prompted = await timed(async () => String(await call(created.value, 'prompt', textArea.value)));
    rawOutput.set(prompted.value);
    tPrompt.set(formatMs(prompted.ms));
    const parsed = tryParseJson(prompted.value);
    if (!parsed.ok) throw new Error(parsed.error);
    renderObject(parsed.value);
    tParse.set('ok');
    const destroy = created.value['destroy'];
    if (typeof destroy === 'function') destroy.call(created.value);
  } catch (error) {
    rawOutput.set(`${errText(error)}\n\nKeynote output:\n${JSON.stringify(CANNED.structured[schemaKey], null, 2)}`);
    stateBadge.textContent = 'Prompt API: fallback';
    stateBadge.className = 'badge badge-warn';
  } finally {
    runButton.disabled = false;
  }
}
