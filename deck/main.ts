import { h } from '../demos/shared/dom';
import { prewarm, setKeynoteMode, keynoteMode, formatMs } from '../demos/shared/ai';
import { slides, TOTAL_PLANNED, type Card, type Slide } from './slides';
import { DeckSync, clock, type DeckState, type Message, type PresenterCommand, type ReadinessTone } from './sync';
import './style.css';

function q<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

const app = q<HTMLDivElement>('.app');
const stage = h('main', { class: 'stage' });
const drawer = h('aside', { class: 'drawer', 'aria-label': 'Presenter controls' });
app.append(stage, drawer);

let index = 0;
let stepIndex = 0;
let talkStart: number | null = null;
let drawerClock: HTMLElement | null = null;
let readiness = 'Model: checking…';
let readinessTone: ReadinessTone = 'muted';
let drawerNote = '';

const sync = new DeckSync('audience', (message: Message) => {
  if (message.source === 'presenter') handleCommand(message.command);
});

function elapsedSeconds(): number {
  return talkStart === null ? 0 : (performance.now() - talkStart) / 1000;
}

function currentState(): DeckState {
  return {
    index,
    elapsed: elapsedSeconds(),
    running: talkStart !== null,
    canned: keynoteMode(),
    readiness,
    readinessTone,
    updatedAt: Date.now(),
  };
}

function broadcast(): void {
  sync.postState(currentState());
}

function cardNode(card: Card, position: number, variant: 'card' | 'poll' | 'status' | 'project'): HTMLElement {
  const tone = card.tone ?? 'slate';
  const node = h('article', { class: `${variant} tone-${tone}`, style: `--i:${position}` });

  if (variant === 'project') {
    node.append(h('span', { class: 'tag', text: card.tag ?? '' }));
    node.append(h('h3', { text: card.title }));
    if (card.sub) node.append(h('p', { text: card.sub }));
    return node;
  }

  const top = h('div', { class: 'card-top' });
  if (card.n) top.append(h('span', { class: variant === 'poll' ? 'letter' : 'num', text: card.n }));
  else if (card.glyph) top.append(h('span', { class: 'glyph', text: card.glyph }));
  else top.append(h('span', { class: 'dot' }));
  if (card.tag) top.append(h('span', { class: 'tag', text: card.tag }));
  node.append(top);
  node.append(h('h3', { text: card.title }));
  if (card.sub) node.append(h('p', { text: card.sub }));
  return node;
}

function renderCards(slide: Slide): HTMLElement {
  const grid = h('div', { class: 'grid', style: `--cols:${slide.cards?.length ?? 1}` });
  for (const [position, card] of (slide.cards ?? []).entries()) {
    grid.append(cardNode(card, position, slide.kind === 'poll' ? 'poll' : slide.kind === 'status' ? 'status' : 'card'));
  }
  return grid;
}

function renderProjects(slide: Slide): HTMLElement {
  const grid = h('div', { class: 'grid projects', style: `--cols:${slide.projects?.length ?? 1}` });
  for (const [position, card] of (slide.projects ?? []).entries()) {
    grid.append(cardNode(card, position, 'project'));
  }
  return grid;
}

function renderStats(slide: Slide): HTMLElement {
  const grid = h('div', { class: 'stats', style: `--cols:${slide.stats?.length ?? 1}` });
  for (const [position, stat] of (slide.stats ?? []).entries()) {
    const node = h('article', { class: `stat tone-${stat.tone ?? 'slate'}`, style: `--i:${position}` });
    node.append(h('div', { class: 'value', text: stat.value }));
    node.append(h('div', { class: 'label', text: stat.label }));
    if (stat.sub) node.append(h('div', { class: 'stat-sub', text: stat.sub }));
    grid.append(node);
  }
  return grid;
}

function renderBranches(slide: Slide): HTMLElement {
  const wrap = h('div', { class: 'decision-flowchart' });
  const branches = slide.branches ?? [];
  for (const [position, branch] of branches.entries()) {
    const tone = branch.tone ?? 'slate';
    if (position > 0) wrap.append(h('div', { class: 'flow-connector' }, h('span', { class: 'flow-line' }), h('span', { class: 'flow-arrow', text: '▼' })));
    const row = h('article', { class: `flow-node tone-${tone}`, style: `--i:${position}` });
    row.append(h('div', { class: 'flow-step', text: String(position + 1) }));
    const body = h('div', { class: 'flow-body' });
    body.append(h('div', { class: 'flow-q', text: branch.q.replace(/^\d+\s*·\s*/, '') }));
    body.append(h('div', { class: 'flow-a', text: branch.a }));
    row.append(body);
    wrap.append(row);
  }
  return wrap;
}

const CODE_KW = new Set(['const', 'let', 'var', 'await', 'async', 'function', 'return', 'if', 'else', 'for', 'of', 'new', 'throw', 'try', 'catch', 'import', 'from', 'export', 'type']);

function highlight(code: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  const token = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\.|[^`])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;
  let last = 0;
  for (const match of code.matchAll(token)) {
    const idx = match.index ?? 0;
    if (idx > last) frag.append(document.createTextNode(code.slice(last, idx)));
    const text = match[0];
    const span = document.createElement('span');
    if (text.startsWith('//') || text.startsWith('/*')) span.className = 'cm';
    else if (text.startsWith("'") || text.startsWith('"') || text.startsWith('`')) span.className = 'str';
    else if (/^\d/.test(text)) span.className = 'num';
    else if (CODE_KW.has(text)) span.className = 'kw';
    else if (code[idx + text.length] === '(') span.className = 'fn';
    else { frag.append(document.createTextNode(text)); last = idx + text.length; continue; }
    span.textContent = text;
    frag.append(span);
    last = idx + text.length;
  }
  if (last < code.length) frag.append(document.createTextNode(code.slice(last)));
  return frag;
}

function applyCodeStep(node: HTMLElement, slide: Slide, step: number): void {
  const steps = slide.codeSteps ?? [];
  const active = steps[step];
  const lines = node.querySelectorAll<HTMLElement>('.code-line');
  lines.forEach((el) => {
    const n = Number(el.dataset.ln);
    const on = !active || active.lines.includes(n);
    el.classList.toggle('active', !!active && on);
    el.classList.toggle('dim', !!active && !on);
  });
  const note = node.querySelector<HTMLElement>('.code-step-note');
  if (note) note.textContent = active ? active.note : '';
  node.querySelectorAll<HTMLElement>('.code-step-dots .dot').forEach((d, i) => d.classList.toggle('active', i === step));
  const hint = node.querySelector<HTMLElement>('.code-step-hint');
  if (hint) hint.textContent = steps.length ? `Step ${step + 1}/${steps.length} · ← →` : '';
}

function renderSlide(slide: Slide): HTMLElement {
  const node = h('section', { class: `slide ${slide.kind}` });

  if (slide.kind === 'title') node.append(h('div', { class: 'orbit' }));
  if (slide.kicker) node.append(h('div', { class: 'kicker', text: slide.kicker }));
  node.append(h('h1', { text: slide.title }));
  if (slide.subtitle) node.append(h('p', { class: 'subtitle', text: slide.subtitle }));

  if (slide.kind === 'demo' && slide.demo) {
    const src = keynoteMode() ? `${slide.demo}${slide.demo.includes('?') ? '&' : '?'}canned` : slide.demo;
    const iframe = h('iframe', {
      class: 'demo',
      src,
      title: slide.title,
      allow: 'language-model; translator; language-detector; summarizer; writer; rewriter; proofreader',
    });
    iframe.addEventListener('load', () => { void prewarmFor(slide.id); }, { once: true });
    const label = h('div', { class: 'demo-label' }, h('i'), h('span', { text: slide.demoLabel ?? 'LIVE DEMO' }));
    node.append(h('div', { class: 'demo-wrap' }, label, iframe));
    return node;
  }

  if (slide.kind === 'code') {
    const lines = (slide.code ?? '').split('\n');
    const pre = h('pre', { class: 'code code-steps' });
    const stepCount = slide.codeSteps?.length ?? 0;
    for (let i = 0; i < lines.length; i++) {
      const ln = h('span', { class: 'code-line', 'data-ln': String(i + 1) });
      ln.append(highlight(lines[i] ?? ''));
      ln.append(document.createTextNode('\n'));
      pre.append(ln);
    }
    node.append(pre);
    if (stepCount > 0) {
      const note = h('div', { class: 'code-step-note', text: '' });
      const dots = h('div', { class: 'code-step-dots' });
      for (let i = 0; i < stepCount; i++) dots.append(h('span', { class: `dot ${i === 0 ? 'active' : ''}` }));
      const hint = h('div', { class: 'code-step-hint', text: '← → step through code' });
      node.append(h('div', { class: 'code-step-bar' }, dots, note, hint));
      // apply initial step
      applyCodeStep(node, slide, 0);
    }
    return node;
  }

  if (slide.kind === 'cards' || slide.kind === 'status' || slide.kind === 'poll') {
    node.append(renderCards(slide));
    return node;
  }

  if (slide.kind === 'projects') {
    node.append(renderProjects(slide));
    return node;
  }

  if (slide.kind === 'metrics') {
    node.append(renderStats(slide));
    return node;
  }

  if (slide.kind === 'decision') {
    node.append(renderBranches(slide));
    return node;
  }

  if (slide.kind === 'close') {
    const wrap = h('div', { class: 'takeaways' });
    for (const [position, text] of (slide.takeaways ?? []).entries()) {
      wrap.append(h('div', { class: 'takeaway', style: `--i:${position}`, text }));
    }
    node.append(wrap);
    return node;
  }

  if (slide.kind === 'title') {
    if ((slide.id === 'title' || slide.id === 'thanks') && slide.takeaways?.[0]) {
      node.append(h('div', { class: 'title-author', text: slide.takeaways[0] }));
    } else if (slide.takeaways?.length) {
      const wrap = h('div', { class: 'takeaways' });
      for (const [position, text] of slide.takeaways.entries()) {
        wrap.append(h('div', { class: 'takeaway', style: `--i:${position}`, text }));
      }
      node.append(wrap);
    }
    return node;
  }

  return node;
}

function ctrl(label: string, onClick: () => void, extraClass = ''): HTMLButtonElement {
  const node = h('button', { class: `ctrl ${extraClass}`.trim(), type: 'button', text: label });
  node.addEventListener('click', onClick);
  return node;
}

function renderDrawer(): void {
  const slide = slides[index]!;
  const next = slides[index + 1];
  drawerClock = h('div', { class: `drawer-clock ${elapsedSeconds() > TOTAL_PLANNED ? 'over' : ''}`.trim(), text: clock(elapsedSeconds()) });

  const notes = h('ul');
  for (const line of slide.notes) notes.append(h('li', { text: line }));

  const warm = ctrl(readinessTone === 'ok' ? 'Model warm' : 'Warm model', () => void warmNow(), readinessTone === 'ok' ? 'done' : '');
  warm.disabled = readinessTone === 'ok';

  drawer.replaceChildren(
    h('div', { class: 'drawer-head' }, h('span', { text: 'Presenter' }), ctrl('Close  Esc', () => toggleDrawer(false))),
    drawerClock,
    h('div', { class: 'drawer-meta', text: `${index + 1} / ${slides.length} · ${clock(slide.seconds)} planned` }),
    h('h3', { text: 'Notes' }),
    notes,
    h('h3', { text: 'Next' }),
    h('div', { class: 'next', text: next ? `${next.kicker ? `${next.kicker} - ` : ''}${next.title}` : 'End of content · 5 min Q&A' }),
    h('div', { class: 'readiness', text: readiness }),
    h('div', { class: 'drawer-controls' },
      ctrl('← Prev', () => go(index - 1)),
      ctrl('Next →', () => go(index + 1)),
    ),
    h('div', { class: 'drawer-controls' },
      ctrl(`Canned output: ${keynoteMode() ? 'ON' : 'OFF'}`, () => toggleCanned(), keynoteMode() ? 'warn' : ''),
      warm,
    ),
    h('p', { class: 'drawer-tip', text: 'Canned output uses recorded demo results when the model is unavailable or slow.' }),
    ctrl('Open presenter window  W', () => void openPresenterWindow()),
    ...(drawerNote ? [h('p', { class: 'drawer-note', text: drawerNote })] : []),
    h('p', { class: 'drawer-shortcuts', text: '← → navigate · K canned · F fullscreen · P presenter · W window' }),
  );
}

function toggleDrawer(force?: boolean): void {
  const open = force ?? !document.body.classList.contains('presenter');
  document.body.classList.toggle('presenter', open);
  if (open) renderDrawer();
}

async function openPresenterWindow(): Promise<void> {
  const win = window.open('./presenter.html', 'builtin-ai-presenter', 'width=1180,height=820');
  if (!win) {
    drawerNote = 'Popup blocked. Allow popups for this site, or use the drawer on this display.';
    renderDrawer();
  } else {
    drawerNote = '';
    renderDrawer();
    broadcast();
  }
}

function toggleCanned(): void {
  const enabled = !keynoteMode();
  setKeynoteMode(enabled);
  const iframe = stage.querySelector<HTMLIFrameElement>('iframe.demo');
  if (iframe) {
    const url = new URL(iframe.src, location.href);
    if (enabled) url.searchParams.set('canned', '1');
    else url.searchParams.delete('canned');
    iframe.src = url.pathname + url.search + url.hash;
  }
  renderDrawer();
  broadcast();
}

function applyPrewarm(result: { status: 'unsupported' | 'warm' | 'failed'; detail: string }): void {
  const ms = Number(result.detail.match(/(\d+)ms/)?.[1] ?? 0);
  readiness = result.status === 'warm' ? `Model warm · ${formatMs(ms)}` : `Model ${result.status} · ${result.detail}`;
  readinessTone = result.status === 'warm' ? 'ok' : result.status === 'failed' ? 'bad' : 'muted';
  renderDrawer();
  broadcast();
}

async function warmNow(): Promise<void> {
  readiness = 'Model warming — first token can take ~20s on this laptop';
  readinessTone = 'muted';
  renderDrawer();
  broadcast();
  applyPrewarm(await prewarm());
}

async function prewarmFor(slideId: string): Promise<void> {
  if (keynoteMode()) return;
  try {
    const ai = await import('../demos/shared/ai');
    const warmIfAvailable = async (name: string, opts?: Record<string, unknown>) => {
      const st = await ai.availability(name, opts);
      if (st === 'available') { const s = await ai.createSession(name, opts, 60_000); (s as any).destroy?.(); }
    };
    if (slideId === 'cold-open') {
      await Promise.allSettled([
        warmIfAvailable('LanguageDetector'),
        warmIfAvailable('Translator', { sourceLanguage: 'fr', targetLanguage: 'en' }),
        warmIfAvailable('Summarizer', { type: 'tldr', format: 'plain-text', length: 'short', outputLanguage: 'en' }),
      ]);
    } else if (slideId === 'condense') {
      await warmIfAvailable('Summarizer', { type: 'tldr', format: 'plain-text', length: 'short', outputLanguage: 'en' });
    } else if (slideId === 'extract' || slideId === 'audience-input') {
      await prewarm();
    } else if (slideId === 'injection') {
      await warmIfAvailable('Translator', { sourceLanguage: 'fr', targetLanguage: 'en' });
    }
  } catch { /* best effort */ }
}

function go(next: number): void {
  const target = Math.min(Math.max(next, 0), slides.length - 1);
  if (target !== index && target === 1) talkStart = performance.now();
  if (target === 0) talkStart = null;
  index = target;
  stepIndex = 0;

  const slide = slides[index]!;
  const rendered = renderSlide(slide);
  rendered.classList.add('enter');
  stage.replaceChildren(rendered);
  requestAnimationFrame(() => rendered.classList.remove('enter'));

  history.replaceState(null, '', `#/${slide.id}`);
  renderDrawer();
  broadcast();
}

function advance(dir: 1 | -1): void {
  const slide = slides[index]!;
  const steps = slide.codeSteps;
  if (steps && steps.length > 0) {
    const nextStep = stepIndex + dir;
    if (nextStep >= 0 && nextStep < steps.length) {
      stepIndex = nextStep;
      const node = stage.querySelector<HTMLElement>('.slide');
      if (node) applyCodeStep(node, slide, stepIndex);
      return;
    }
  }
  go(index + dir);
}

const THEME_KEY = 'builtin-ai:theme';

function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
}

function initTheme(): void {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') applyTheme(saved);
  } catch { /* ignore */ }
}

function handleCommand(command: PresenterCommand): void {
  if (command.action === 'next') go(index + 1);
  else if (command.action === 'prev') go(index - 1);
  else if (command.action === 'goto') go(command.index);
  else if (command.action === 'canned') {
    if (keynoteMode() !== command.enabled) toggleCanned();
  } else if (command.action === 'theme') applyTheme(command.value);
  else if (command.action === 'warm') void warmNow();
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
    event.preventDefault();
    advance(1);
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    advance(-1);
  } else if (event.key === 'Home') {
    go(0);
  } else if (event.key === 'End') {
    go(slides.length - 1);
  } else if (event.key.toLowerCase() === 'p') {
    toggleDrawer();
  } else if (event.key.toLowerCase() === 'w') {
    void openPresenterWindow();
  } else if (event.key.toLowerCase() === 'k') {
    toggleCanned();
  } else if (event.key.toLowerCase() === 'f') {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  } else if (event.key === 'Escape') {
    toggleDrawer(false);
  }
});

initTheme();
const initialId = location.hash.replace(/^#\/?/, '');
const initialIndex = slides.findIndex((slide) => slide.id === initialId);
go(initialIndex >= 0 ? initialIndex : 0);
void prewarm().then(applyPrewarm);

window.setInterval(() => {
  if (drawerClock) {
    drawerClock.textContent = clock(elapsedSeconds());
    drawerClock.classList.toggle('over', elapsedSeconds() > TOTAL_PLANNED);
  }
  broadcast();
}, 500);
