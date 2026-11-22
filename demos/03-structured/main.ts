import { availability, call, createSession, errText, formatMs, keynoteMode, timed } from '../shared/ai';
import { badge, button, chip, codeBlock, h, pre, section } from '../shared/dom';
import { CANNED, INVOICE_EMAIL, SCHEMAS, type SchemaKey } from '../shared/data';

const app = document.querySelector<HTMLDivElement>('#app')!;

const textArea = h('textarea');
textArea.value = INVOICE_EMAIL;
textArea.rows = 14;

const schemaButtons = h('div', { class: 'controls' });
const runButton = button('Extract with a JSON schema', () => void run(), 'primary');
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
      h('h1', { text: 'Extract: from prose to typed data' }),
      h('span', { class: 'sub', text: 'Prompt API · responseConstraint · JSON Schema' }),
      h('a', { href: '../../index.html', text: '← deck' }),
    ),
    h('p', { class: 'muted', text:
      'A JSON Schema in the responseConstraint gives you shaped, machine-usable output from messy text. Same trick works on images when the browser exposes image input.' }),
    h('div', { class: 'grid two' },
      section('Messy input — paste anything', textArea),
      h('div', { class: 'grid' }, resultPanel, rawOutput.root),
    ),
    h('h2', { text: 'Audience decides the shape' }),
    schemaButtons,
    h('div', { class: 'controls' }, runButton),
    stateLine,
    timings,
    codePanel.root,
    h('p', { class: 'muted small', text:
      'Edge note: Edge watermarks Prompt API output, but its documentation says the watermark is not applied when responseConstraint is used. Prompt API is stable on the web in Chrome 148; in Edge 158+ it is a flag-gated developer preview using Aion Instruct 2.3B.' }),
  ),
);
syncSchema();

function renderObject(value: unknown): void {
  fields.replaceChildren();
  if (typeof value !== 'object' || value === null) {
    fields.append(h('dt', { text: 'result' }), h('dd', { text: String(value) }));
    return;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const display = Array.isArray(entry) ? entry.join(', ') : String(entry);
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
    const parsed = JSON.parse(prompted.value) as unknown;
    renderObject(parsed);
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
