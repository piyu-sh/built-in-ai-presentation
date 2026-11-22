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

export function pre(label: string): { root: HTMLElement; set: (text: string) => void } {
  const body = h('pre', { class: 'mono output', text: '—' });
  const root = h('section', { class: 'panel' }, h('h3', { text: label }), body);
  return { root, set: (text: string) => { body.textContent = text; } };
}

export function codeBlock(code: string): { root: HTMLElement; set: (next: string) => void } {
  const body = h('pre', { class: 'mono code', text: code });
  const root = h('section', { class: 'panel code-panel' }, h('h3', { text: 'The code' }), body);
  return { root, set: (next: string) => { body.textContent = next; } };
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
