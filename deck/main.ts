import { h } from '../demos/shared/dom';
import { prewarm, setKeynoteMode, keynoteMode, formatMs } from '../demos/shared/ai';
import { slides, TOTAL_PLANNED, type Slide } from './slides';
import './style.css';

function q<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

function clock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

const app = q<HTMLDivElement>('.app');

const brand = h('div', { class: 'brand', text: 'Built-In AI in the Browser' });
const readiness = h('div', { class: 'readiness', text: 'model: checking…' });
const warmButton = h('button', { class: 'ctrl', type: 'button', text: 'Warm model', style: 'display:none' });
const clockEl = h('div', { class: 'clock', text: '00:00' });
const presenterButton = h('button', { class: 'ctrl', type: 'button', text: 'Presenter  P' });
const keynoteButton = h('button', {
  class: `ctrl ${keynoteMode() ? 'on' : ''}`.trim(),
  type: 'button',
  text: `Keynote: ${keynoteMode() ? 'ON' : 'OFF'}  K`,
});
const top = h('header', { class: 'top' }, brand, h('div', { class: 'spacer' }), readiness, warmButton, clockEl, presenterButton, keynoteButton);

const stage = h('main', { class: 'stage' });
const notesPanel = h('aside', { class: 'notes' });

const prevButton = h('button', { class: 'ctrl', type: 'button', text: '← Prev' });
const nextButton = h('button', { class: 'ctrl', type: 'button', text: 'Next →' });
const progressFill = h('i');
const progress = h('div', { class: 'progress' }, progressFill);
const count = h('div', { class: 'count', text: `1 / ${slides.length}` });
const bottom = h('footer', { class: 'bottom' }, prevButton, nextButton, progress, count);
const hint = h('div', { class: 'hint', text: '← → navigate · P presenter · K keynote · F fullscreen' });

app.append(top, stage, notesPanel, bottom, hint);

function columnsBlock(slide: Slide): HTMLElement {
  const cols = (slide.columns ?? []).map((column) => {
    const table = h('table');
    for (const row of column.rows) {
      table.append(h('tr', {}, ...row.map((cell) => h('td', { text: cell }))));
    }
    return h('div', { class: 'card' }, h('h3', { text: column.head }), table);
  });
  const wrapper = h('div', { class: `cols ${cols.length <= 1 ? 'one' : ''}`.trim() }, ...cols);
  return wrapper;
}

function bodyBlock(slide: Slide, ordered = false): HTMLElement {
  const list = h(ordered ? 'ol' : 'ul');
  for (const line of slide.body ?? []) list.append(h('li', { text: line }));
  return list;
}

function renderSlide(slide: Slide): HTMLElement {
  const node = h('section', { class: `slide ${slide.kind}` });
  node.append(h('div', { class: 'kicker', text: slide.kicker }), h('h1', { text: slide.title }));

  if (slide.kind === 'title') {
    const sub = h('div', { class: 'sub' });
    for (const line of slide.body ?? []) sub.append(h('p', { text: line }));
    node.append(sub);
    node.append(h('div', { class: 'body', text: 'Press → to start the talk. If the badge asks for it, click “Warm model” first.' }));
    return node;
  }

  if (slide.kind === 'demo' && slide.demo) {
    const iframe = h('iframe', {
      class: 'demo',
      src: slide.demo,
      title: slide.title,
      allow: 'language-model; translator; language-detector; summarizer; writer; rewriter; proofreader',
    });
    const note = h('div', { class: 'demo-note' },
      h('span', { text: `${slide.demoNote}   ` }),
      h('a', { href: slide.demo, target: '_blank', rel: 'noopener', text: 'open demo ↗' }),
    );
    node.append(h('div', { class: 'demo-wrap' }, iframe, note));
    return node;
  }

  if (slide.kind === 'code') {
    const split = h('div', { class: 'split code-split' },
      h('pre', { class: 'code', text: slide.code ?? '' }),
      h('div', { class: 'body' }, bodyBlock(slide)),
    );
    node.append(split);
    return node;
  }

  if (slide.kind === 'poll') {
    const options = h('div', { class: 'poll-grid' });
    for (const line of slide.body ?? []) {
      options.append(h('div', { class: 'card poll-option', text: line }));
    }
    const qr = h('div', { class: 'qr', title: 'Placeholder — not wired to a poll service' });
    const note = h('div', { class: 'body', text: 'Hands up is the real interaction. The QR panel is a placeholder for a poll service.' });
    node.append(h('div', { class: 'split' }, options, h('div', {}, qr, note)));
    return node;
  }

  if (slide.kind === 'flow') {
    node.append(bodyBlock(slide, true));
    return node;
  }

  if (slide.kind === 'close') {
    const list = h('ul');
    for (const line of slide.body ?? []) list.append(h('li', { text: line }));
    node.append(h('div', { class: 'body' }, list));
    return node;
  }

  const split = h('div', { class: 'split' }, columnsBlock(slide), h('div', { class: 'body' }, bodyBlock(slide)));
  node.append(split);
  return node;
}

function renderNotes(slide: Slide, index: number): void {
  const next = slides[index + 1];
  const list = h('ul');
  for (const line of slide.notes) list.append(h('li', { text: line }));
  notesPanel.replaceChildren(
    h('h3', { text: 'Speaker notes' }),
    h('div', { class: 'meta', text: `${slide.kicker} · ${clock(slide.seconds)} planned` }),
    list,
    h('h3', { text: 'Next' }),
    h('div', { class: 'meta', text: next ? `${next.kicker} — ${next.title}` : 'End of content · 5 min Q&A' }),
    h('div', { class: 'meta', text: `Total planned: ${clock(TOTAL_PLANNED)} · Q&A: 05:00` }),
  );
}

let index = 0;
let talkStart: number | null = null;

function go(next: number): void {
  const target = Math.min(Math.max(next, 0), slides.length - 1);
  if (target !== index && target === 1) talkStart = performance.now();
  if (target === 0) talkStart = null;
  index = target;

  const slide = slides[index]!;
  const rendered = renderSlide(slide);
  rendered.classList.add('enter');
  stage.replaceChildren(rendered);
  requestAnimationFrame(() => rendered.classList.remove('enter'));
  renderNotes(slide, index);
  count.textContent = `${index + 1} / ${slides.length}`;
  progressFill.style.width = `${((index + 1) / slides.length) * 100}%`;
  history.replaceState(null, '', `#/${slide.id}`);
  updateClock();
}

function updateClock(): void {
  const elapsed = talkStart === null ? 0 : (performance.now() - talkStart) / 1000;
  clockEl.textContent = clock(elapsed);
  clockEl.classList.toggle('over', elapsed > TOTAL_PLANNED);
}

nextButton.addEventListener('click', () => go(index + 1));
prevButton.addEventListener('click', () => go(index - 1));

presenterButton.addEventListener('click', () => {
  document.body.classList.toggle('presenter');
  presenterButton.classList.toggle('on', document.body.classList.contains('presenter'));
});

keynoteButton.addEventListener('click', () => {
  const enabled = !keynoteMode();
  setKeynoteMode(enabled);
  keynoteButton.textContent = `Keynote: ${enabled ? 'ON' : 'OFF'}  K`;
  keynoteButton.classList.toggle('on', enabled);
  const iframe = stage.querySelector<HTMLIFrameElement>('iframe.demo');
  if (iframe) iframe.src = iframe.src;
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
    event.preventDefault();
    go(index + 1);
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    go(index - 1);
  } else if (event.key === 'Home') {
    go(0);
  } else if (event.key === 'End') {
    go(slides.length - 1);
  } else if (event.key.toLowerCase() === 'p') {
    presenterButton.click();
  } else if (event.key.toLowerCase() === 'k') {
    keynoteButton.click();
  } else if (event.key.toLowerCase() === 'f') {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  }
});

const initialId = location.hash.replace(/^#\/?/, '');
const initialIndex = slides.findIndex((slide) => slide.id === initialId);
go(initialIndex >= 0 ? initialIndex : 0);
window.setInterval(updateClock, 500);

function applyPrewarm(result: { status: 'unsupported' | 'warm' | 'failed'; detail: string }): void {
  const ms = Number(result.detail.match(/(\d+)ms/)?.[1] ?? 0);
  readiness.textContent = result.status === 'warm'
    ? `model: warm · ${formatMs(ms)}`
    : `model: ${result.status} · ${result.detail}`;
  readiness.style.color = result.status === 'warm' ? 'var(--ok)' : result.status === 'failed' ? 'var(--bad)' : 'var(--muted)';
  warmButton.style.display = result.status === 'warm' ? 'none' : '';
}

warmButton.addEventListener('click', () => {
  warmButton.disabled = true;
  warmButton.textContent = 'Warming…';
  readiness.textContent = 'model: warming — first token can take ~20s on this laptop';
  void prewarm().then((result) => {
    applyPrewarm(result);
    warmButton.textContent = 'Warm model';
    warmButton.disabled = false;
  });
});

void prewarm().then(applyPrewarm);
