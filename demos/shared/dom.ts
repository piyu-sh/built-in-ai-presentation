/** Tiny DOM helpers. Model output is ALWAYS inserted as text, never as HTML. */

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'htmlFor') (node as HTMLLabelElement).htmlFor = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node: Element): void {
  node.replaceChildren();
}

export function button(label: string, onClick: () => void, cls = ''): HTMLButtonElement {
  const b = h('button', { class: `btn ${cls}`.trim(), type: 'button', text: label });
  b.addEventListener('click', onClick);
  return b;
}

/** Short, explicit busy state for action buttons. Never hides fallback output. */
export async function withBusy<T>(
  node: HTMLButtonElement,
  busyLabel: string,
  task: () => Promise<T>,
): Promise<T> {
  const original = node.textContent ?? '';
  node.disabled = true;
  node.textContent = busyLabel;
  node.setAttribute('aria-busy', 'true');
  try {
    return await task();
  } finally {
    node.disabled = false;
    node.textContent = original;
    node.removeAttribute('aria-busy');
  }
}

export function pre(label: string): { root: HTMLElement; set: (text: string) => void } {
  const body = h('pre', { class: 'mono output', text: '—' });
  const root = h('section', { class: 'panel' }, h('h3', { text: label }), body);
  return { root, set: (text: string) => { body.textContent = text; } };
}

const CODE_KW = new Set(['const', 'let', 'var', 'await', 'async', 'function', 'return', 'if', 'else', 'for', 'of', 'new', 'throw', 'try', 'catch', 'import', 'from', 'export', 'type', 'true', 'false', 'null']);

function highlightCode(code: string): DocumentFragment {
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

export function codeBlock(code: string): { root: HTMLElement; set: (next: string) => void } {
  const body = h('pre', { class: 'mono code' });
  body.append(highlightCode(code));
  const root = h('section', { class: 'panel code-panel' }, h('h3', { text: 'The code' }), body);
  return {
    root,
    set: (next: string) => {
      body.replaceChildren(highlightCode(next));
    },
  };
}

export function chip(label: string, value: string): { root: HTMLElement; set: (v: string) => void } {
  const v = h('span', { class: 'chip-value', text: value });
  const root = h('span', { class: 'chip' }, h('span', { class: 'chip-label', text: label }), v);
  return { root, set: (next: string) => { v.textContent = next; } };
}

export function badge(text: string, kind: 'ok' | 'warn' | 'bad' | 'idle' = 'idle'): HTMLElement {
  return h('span', { class: `badge badge-${kind}`, text });
}

export function section(title: string, ...children: Array<Node | string>): HTMLElement {
  return h('section', { class: 'panel' }, h('h3', { text: title }), ...children);
}
