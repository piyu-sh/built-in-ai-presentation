import { h } from '../demos/shared/dom';
import { slides, TOTAL_PLANNED } from '../deck/slides';
import { DeckSync, clock, type DeckState, type Message, type PresenterCommand } from '../deck/sync';
import './style.css';

function q<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

const app = q<HTMLDivElement>('.presenter-app');

const clockEl = h('div', { class: 'p-clock', text: '00:00' });
const countEl = h('div', { class: 'p-count' });
const progressFill = h('i');
const header = h('header', { class: 'p-head' },
  h('div', {}, h('div', { class: 'p-brand', text: 'PRESENTER' }), h('div', { class: 'p-deck', text: 'Built-In AI in the Browser' })),
  h('div', { class: 'p-time' }, clockEl, countEl),
);
const progress = h('div', { class: 'p-progress' }, progressFill);

const currentTitle = h('h1', { class: 'p-current' });
const notesList = h('ul', { class: 'p-notes' });
const notesPanel = h('section', { class: 'p-panel' },
  h('h2', { text: 'Speaker notes' }),
  currentTitle,
  notesList,
);

const nextText = h('div', { class: 'p-next-text' });
const readinessEl = h('div', { class: 'p-readiness' });
const linksList = h('div', { class: 'p-links' });

function commandButton(label: string, onClick: () => void, extraClass = ''): HTMLButtonElement {
  const node = h('button', { class: `p-btn ${extraClass}`.trim(), type: 'button', text: label });
  node.addEventListener('click', onClick);
  return node;
}

const prevBtn = commandButton('← Prev', () => send({ action: 'prev' }));
const nextBtn = commandButton('Next →', () => send({ action: 'next' }));
const cannedBtn = commandButton('Canned output: OFF', () => send({ action: 'canned', enabled: !state.canned }));
const warmBtn = commandButton('Warm model', () => send({ action: 'warm' }));
const themeBtn = commandButton('Theme: dark', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  send({ action: 'theme', value: next });
});
const focusBtn = commandButton('Focus deck', () => window.opener?.focus());

const side = h('aside', { class: 'p-side' },
  h('section', { class: 'p-panel' }, h('h2', { text: 'Next' }), nextText),
  h('section', { class: 'p-panel' }, h('h2', { text: 'References' }), linksList),
  h('section', { class: 'p-panel' }, h('h2', { text: 'Model' }), readinessEl,
    h('div', { class: 'p-buttons' }, warmBtn, cannedBtn),
    h('p', { class: 'p-hint', text: 'Canned output uses recorded demo results when the live model is unavailable.' }),
  ),
  h('section', { class: 'p-panel' }, h('h2', { text: 'Control' }),
    h('div', { class: 'p-buttons' }, prevBtn, nextBtn),
    h('div', { class: 'p-buttons' }, themeBtn, focusBtn),
    h('p', { class: 'p-hint', text: 'Arrow keys navigate. K toggles canned output. Close this window when using a duplicated display.' }),
  ),
);

app.append(header, progress, h('main', { class: 'p-main' }, notesPanel, side));

const THEME_KEY = 'builtin-ai:theme';
function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = `Theme: ${theme}`;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
}
function initTheme(): void {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved === 'light' ? 'light' : 'dark');
  } catch { applyTheme('dark'); }
}

const defaultState: DeckState = {
  index: 0,
  elapsed: 0,
  running: false,
  canned: false,
  readiness: 'Model: checking…',
  readinessTone: 'muted',
  updatedAt: Date.now(),
};

let state: DeckState = defaultState;

const sync = new DeckSync('presenter', (message: Message) => {
  if (message.source === 'audience') applyState(message.state);
});

function send(command: PresenterCommand): void {
  sync.postCommand(command);
}

function applyState(nextState: DeckState): void {
  state = nextState;
  const slide = slides[state.index] ?? slides[0]!;
  const next = slides[state.index + 1];

  clockEl.textContent = clock(state.elapsed);
  clockEl.classList.toggle('over', state.elapsed > TOTAL_PLANNED);
  countEl.textContent = `${state.index + 1} / ${slides.length} · ${clock(slide.seconds)} planned`;
  progressFill.style.width = `${Math.min(100, (state.elapsed / TOTAL_PLANNED) * 100)}%`;

  currentTitle.textContent = slide.title;
  notesList.replaceChildren(...slide.notes.map((line) => h('li', { text: line })));
  nextText.textContent = next ? `${next.kicker ? `${next.kicker} - ` : ''}${next.title}` : 'End of content · 5 min Q&A';
  linksList.replaceChildren(
    ...(slide.links?.length
      ? slide.links.map((link) => h('a', { class: 'p-link', href: link.url, target: '_blank', rel: 'noopener noreferrer', text: `${link.label} ↗` }))
      : [h('div', { class: 'p-hint', text: 'No references for this slide.' })]),
  );

  readinessEl.textContent = state.readiness;
  readinessEl.className = `p-readiness tone-${state.readinessTone}`;
  warmBtn.disabled = state.readinessTone === 'ok';
  warmBtn.textContent = state.readinessTone === 'ok' ? 'Model warm' : 'Warm model';
  cannedBtn.textContent = `Canned output: ${state.canned ? 'ON' : 'OFF'}`;
  cannedBtn.classList.toggle('warn', state.canned);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
    event.preventDefault();
    send({ action: 'next' });
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    send({ action: 'prev' });
  } else if (event.key.toLowerCase() === 'k') {
    send({ action: 'canned', enabled: !state.canned });
  } else if (event.key === 'Escape') {
    window.close();
  }
});

initTheme();
state = sync.readState() ?? defaultState;
applyState(state);
