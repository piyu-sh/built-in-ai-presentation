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
let flowRenderSeq = 0;
let mermaidFlowHost: HTMLElement | null = null;

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

function decisionDiagram(light: boolean): string {
  const c = light
    ? { surface: '#ffffff', text: '#152238', cyan: '#0284c7', violet: '#7c3aed', green: '#059669', amber: '#b45309', red: '#dc2626', softRed: '#fff1f1', softAmber: '#fff8e8', softGreen: '#ecfdf5', softViolet: '#f5f0ff', softCyan: '#eef8ff' }
    : { surface: '#101a2e', text: '#eef4ff', cyan: '#67e8f9', violet: '#c4b5fd', green: '#6ee7b7', amber: '#fcd34d', red: '#fca5a5', softRed: '#32161d', softAmber: '#2d2410', softGreen: '#0f2b25', softViolet: '#211c39', softCyan: '#102342' };
  return `flowchart TD
  A(["START<br/><b>Narrow on-device task?</b><br/><small>Detect · translate · summarize · extract</small>"])
  B["<b>Privacy / offline / latency<br/>/ cost matter?</b><br/><small>Strong on-device signals</small>"]
  C["<b>Cloud / server AI</b><br/>Latest knowledge · big context"]
  D{"<b>Can the browser run it?</b><br/><small>availability() with create() options</small>"}
  E["<b>Pick the API shape</b><br/>Task API · Prompt API<br/><b>SHIP with fallback</b>"]
  F["<b>Fallback UX</b><br/>Cloud / hybrid / recorded"]

  A -->|Yes| B
  A -->|No / not ideal| C
  B -->|Yes| D
  B -->|No / partly| C
  D -->|Available / downloadable| E
  D -->|Unavailable| F
  C -.->|Keep feature usable| F

  classDef start fill:${c.softCyan},stroke:${c.cyan},color:${c.text},stroke-width:1.5px;
  classDef decision fill:${c.softViolet},stroke:${c.violet},color:${c.text},stroke-width:1.5px;
  classDef cloud fill:${c.softRed},stroke:${c.red},color:${c.text},stroke-width:1.5px;
  classDef ship fill:${c.softGreen},stroke:${c.green},color:${c.text},stroke-width:1.5px;
  classDef fallback fill:${c.softAmber},stroke:${c.amber},color:${c.text},stroke-width:1.5px;
  class A start;
  class B decision;
  class C cloud;
  class D decision;
  class E ship;
  class F fallback;`;
}

async function renderMermaidFlow(container: HTMLElement, slide: Slide): Promise<void> {
  const seq = ++flowRenderSeq;
  mermaidFlowHost = container;
  const light = document.documentElement.dataset.theme === 'light';
  try {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: {
        background: light ? '#f4f7fc' : '#050912',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: light ? '13px' : '13px',
        primaryColor: light ? '#ffffff' : '#101a2e',
        primaryTextColor: light ? '#152238' : '#eef4ff',
        primaryBorderColor: light ? '#0284c7' : '#67e8f9',
        secondaryColor: light ? '#eef8ff' : '#102342',
        tertiaryColor: light ? '#f5f0ff' : '#211c39',
        lineColor: light ? '#536a89' : '#93b4e0',
        textColor: light ? '#152238' : '#eef4ff',
        edgeLabelBackground: light ? '#ffffff' : '#0d1526',
        clusterBkg: light ? '#eef3fa' : '#0e1729',
        clusterBorder: light ? '#cfdaea' : '#24324e',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: true,
        nodeSpacing: 20,
        rankSpacing: 26,
        padding: 8,
      },
    });
    const { svg, bindFunctions } = await mermaid.render(`decision-flow-${seq}`, decisionDiagram(light));
    if (seq !== flowRenderSeq || !container.isConnected) return;
    container.innerHTML = svg;
    bindFunctions?.(container);
    container.classList.add('ready');
  } catch (error) {
    if (seq !== flowRenderSeq) return;
    console.error('Mermaid flowchart failed; using native fallback.', error);
    container.classList.remove('ready');
    container.replaceChildren(renderNativeFlow(slide));
  }
}

function renderNativeFlow(slide: Slide): HTMLElement {
  const b = slide.branches ?? [];
  const node = (i: number, label: string, cls = ''): HTMLElement => {
    const br = b[i] ?? { q: '', a: '', tone: 'slate' as const };
    const tone = br.tone ?? 'slate';
    const el = h('article', { class: `df-node tone-${tone} ${cls}`.trim() });
    if (label) el.append(h('div', { class: 'df-label', text: label }));
    el.append(h('div', { class: 'df-q', text: br.q.replace(/^\d+\s*·\s*/, '') }));
    el.append(h('div', { class: 'df-a', text: br.a }));
    return el;
  };
  const arrow = (text: string, cls = '') => h('div', { class: `df-arrow ${cls}`.trim() }, h('span', { class: 'df-arrow-line' }), h('span', { class: 'df-arrow-text', text }), h('span', { class: 'df-arrow-head', text: '▼' }));

  const wrap = h('div', { class: 'decision-flowchart' });
  wrap.append(node(0, 'START', 'df-start'));
  const split1 = h('div', { class: 'df-split' });
  split1.append(
    h('div', { class: 'df-col' }, arrow('Yes', 'df-yes'), node(1, '')),
    h('div', { class: 'df-col' }, arrow('No / not ideal', 'df-no'), node(3, 'FALLBACK', 'df-fallback')),
  );
  wrap.append(split1);
  const mid = h('div', { class: 'df-mid' });
  mid.append(
    h('div', { class: 'df-col' }, arrow('Yes', 'df-yes'), node(2, '')),
    h('div', { class: 'df-col df-col-fallback' }, h('div', { class: 'df-merge-note', text: 'Keep feature usable' })),
  );
  wrap.append(mid);
  const split2 = h('div', { class: 'df-split df-split-bottom' });
  split2.append(
    h('div', { class: 'df-col' }, arrow('Available / downloadable', 'df-yes'), node(4, 'SHIP', 'df-ship')),
    h('div', { class: 'df-col' }, arrow('Unavailable', 'df-no'), h('div', { class: 'df-fallback-ref tone-red' }, h('div', { class: 'df-q', text: 'Use fallback path' }), h('div', { class: 'df-a', text: 'Cloud/hybrid/server or explicit canned/degraded UX.' }))),
  );
  wrap.append(split2);
  return wrap;
}

function renderBranches(slide: Slide): HTMLElement {
  const wrap = h('div', { class: 'mermaid-flow', text: 'Rendering flowchart…' });
  void renderMermaidFlow(wrap, slide);
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

function renderTitleVisual(): HTMLElement {
  const ns = 'http://www.w3.org/2000/svg';
  const s = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  const t = (tag: string, attrs: Record<string, string>, text: string) => {
    const el = s(tag, attrs);
    el.textContent = text;
    return el;
  };

  const svg = s('svg', { viewBox: '0 0 560 360', class: 'title-art', role: 'img', 'aria-label': 'Browser with on-device AI capabilities' });
  const defs = s('defs', {});
  const glow = s('linearGradient', { id: 'tg', x1: '0', y1: '0', x2: '1', y2: '1' });
  glow.append(s('stop', { offset: '0%', 'stop-color': '#67e8f9', 'stop-opacity': '.9' }), s('stop', { offset: '100%', 'stop-color': '#a78bfa', 'stop-opacity': '.9' }));
  const bg = s('linearGradient', { id: 'tbg', x1: '0', y1: '0', x2: '0', y2: '1' });
  bg.append(s('stop', { offset: '0%', 'stop-color': '#18253f', 'stop-opacity': '.95' }), s('stop', { offset: '100%', 'stop-color': '#0d1628', 'stop-opacity': '.95' }));
  defs.append(glow, bg);
  svg.append(defs);

  // browser window
  svg.append(s('rect', { x: '40', y: '36', width: '320', height: '220', rx: '18', fill: 'url(#tbg)', stroke: 'rgba(148,178,224,.28)', 'stroke-width': '1.5' }));
  svg.append(s('rect', { x: '40', y: '36', width: '320', height: '34', rx: '18', fill: 'rgba(255,255,255,.04)' }));
  svg.append(s('rect', { x: '40', y: '54', width: '320', height: '16', fill: 'rgba(255,255,255,.04)' }));
  ['#ff8a8a', '#fcd34d', '#6ee7b7'].forEach((c, i) => svg.append(s('circle', { cx: String(62 + i * 18), cy: '53', r: '5', fill: c, 'fill-opacity': '.85' })));
  svg.append(s('rect', { x: '128', y: '45', width: '150', height: '16', rx: '8', fill: 'rgba(148,178,224,.12)', stroke: 'rgba(148,178,224,.16)' }));
  svg.append(t('text', { x: '203', y: '57', 'text-anchor': 'middle', fill: '#9fb0cf', 'font-size': '9', 'font-family': 'ui-monospace,monospace' }, 'localhost / on-device'));

  // on-device chip inside browser
  svg.append(s('rect', { x: '80', y: '105', width: '240', height: '118', rx: '16', fill: 'rgba(103,232,249,.05)', stroke: 'url(#tg)', 'stroke-width': '1.5' }));
  svg.append(s('rect', { x: '152', y: '122', width: '96', height: '28', rx: '14', fill: 'rgba(103,232,249,.14)', stroke: 'rgba(103,232,249,.45)' }));
  svg.append(t('text', { x: '200', y: '140', 'text-anchor': 'middle', fill: '#67e8f9', 'font-size': '11', 'font-weight': '700', 'font-family': 'ui-monospace,monospace' }, 'Gemini Nano'));
  svg.append(t('text', { x: '200', y: '168', 'text-anchor': 'middle', fill: '#dbe7ff', 'font-size': '10', 'font-family': 'Inter,system-ui,sans-serif' }, 'Runs locally in the browser'));
  svg.append(t('text', { x: '200', y: '186', 'text-anchor': 'middle', fill: '#9fb0cf', 'font-size': '9', 'font-family': 'Inter,system-ui,sans-serif' }, 'private · low latency · offline'));
  // shield
  svg.append(s('path', { d: 'M200 196 l14 5 v10c0 9-6 14-14 18-8-4-14-9-14-18v-10z', fill: 'rgba(110,231,183,.12)', stroke: 'rgba(110,231,183,.65)', 'stroke-width': '1.2' }));
  svg.append(s('path', { d: 'M195 211 l4 4 7-8', fill: 'none', stroke: '#6ee7b7', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

  // capability nodes
  const caps: Array<[string, string, number, number, string]> = [
    ['Detect', 'Lang', 430, 56, '#67e8f9'],
    ['Translate', 'API', 430, 118, '#a78bfa'],
    ['Summarize', 'API', 430, 180, '#6ee7b7'],
    ['Prompt', 'API', 430, 242, '#fcd34d'],
  ];
  caps.forEach(([label, sub, x, y, c]) => {
    svg.append(s('line', { x1: '360', y1: String(146 + (y - 149) * 0.25), x2: String(x - 8), y2: String(y + 18), stroke: c, 'stroke-opacity': '.28', 'stroke-width': '1.5' }));
    svg.append(s('rect', { x: String(x), y: String(y), width: '100', height: '40', rx: '12', fill: 'rgba(17,27,48,.72)', stroke: c, 'stroke-opacity': '.45', 'stroke-width': '1.2' }));
    svg.append(t('text', { x: String(x + 50), y: String(y + 17), 'text-anchor': 'middle', fill: '#eef3ff', 'font-size': '11', 'font-weight': '650', 'font-family': 'Inter,system-ui,sans-serif' }, label));
    svg.append(t('text', { x: String(x + 50), y: String(y + 30), 'text-anchor': 'middle', fill: c, 'font-size': '8.5', 'font-family': 'ui-monospace,monospace' }, sub));
  });

  // no cloud badge
  svg.append(s('rect', { x: '68', y: '286', width: '126', height: '30', rx: '15', fill: 'rgba(110,231,183,.08)', stroke: 'rgba(110,231,183,.35)' }));
  svg.append(t('text', { x: '131', y: '305', 'text-anchor': 'middle', fill: '#6ee7b7', 'font-size': '10', 'font-weight': '600', 'font-family': 'Inter,system-ui,sans-serif' }, 'No API key'));
  svg.append(s('rect', { x: '204', y: '286', width: '126', height: '30', rx: '15', fill: 'rgba(103,232,249,.08)', stroke: 'rgba(103,232,249,.35)' }));
  svg.append(t('text', { x: '267', y: '305', 'text-anchor': 'middle', fill: '#67e8f9', 'font-size': '10', 'font-weight': '600', 'font-family': 'Inter,system-ui,sans-serif' }, 'No server round-trip'));

  const wrap = h('div', { class: 'title-visual' });
  wrap.append(svg);
  return wrap;
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
    if (slide.id === 'title') {
      node.append(renderTitleVisual());
    }
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
  if (slides[index]?.kind === 'decision' && mermaidFlowHost?.isConnected) {
    void renderMermaidFlow(mermaidFlowHost, slides[index]!);
  }
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
