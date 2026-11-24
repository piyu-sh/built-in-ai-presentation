/**
 * Wrappers around Chrome/Edge built-in AI APIs.
 *
 * Design rules learned from rehearsal on a `Performance Class: Medium` laptop:
 *  - Never depend on byte-level `downloadprogress`; it is browser-owned and unreliable.
 *  - Treat the four `availability()` states as the UI.
 *  - Always stream; cold first-token was ~19s, warm was ~0.4s on the test machine.
 *  - Pre-warm once per browser session.
 *  - Never put model output into innerHTML.
 */

export type Availability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available'
  | 'unknown'
  | 'error';

export const API_NAMES = [
  'LanguageModel',
  'Translator',
  'LanguageDetector',
  'Summarizer',
  'Writer',
  'Rewriter',
  'Proofreader',
] as const;

export type ApiName = (typeof API_NAMES)[number];

type Ctor = {
  availability?: (options?: Record<string, unknown>) => Promise<string>;
  create?: (options?: Record<string, unknown>) => Promise<unknown>;
};

const KEYNOTE_KEY = 'builtin-ai:keynote';

export function globals(): Record<string, unknown> {
  return globalThis as unknown as Record<string, unknown>;
}

export function getCtor(name: string): Ctor | undefined {
  const value = globals()[name];
  if (value === undefined || value === null) return undefined;
  return value as Ctor;
}

export function apiExists(name: string): boolean {
  return getCtor(name) !== undefined;
}

export function errText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}

export async function availability(
  name: string,
  options: Record<string, unknown> = {},
  timeout = 15_000,
): Promise<Availability> {
  const ctor = getCtor(name);
  if (!ctor || typeof ctor.availability !== 'function') return 'unavailable';
  try {
    const value = await withTimeout(ctor.availability(options), timeout, `${name}.availability()`);
    if (
      value === 'unavailable' ||
      value === 'downloadable' ||
      value === 'downloading' ||
      value === 'available'
    ) {
      return value;
    }
    return 'unknown';
  } catch {
    return 'error';
  }
}

export async function createSession(
  name: string,
  options: Record<string, unknown> = {},
  timeout = 60_000,
): Promise<Record<string, (...args: unknown[]) => unknown>> {
  const ctor = getCtor(name);
  if (!ctor || typeof ctor.create !== 'function') {
    throw new Error(`${name} is not available in this browser`);
  }
  const session = await withTimeout(ctor.create(options), timeout, `${name}.create()`);
  return session as Record<string, (...args: unknown[]) => unknown>;
}

export type BuiltinSession = Record<string, (...args: unknown[]) => unknown>;

const SESSION_CACHE = new Map<string, BuiltinSession>();

function sessionKey(name: string, options: Record<string, unknown>): string {
  return `${name}:${JSON.stringify(options)}`;
}

/**
 * Keep created sessions per API + options. Chrome intentionally reports every
 * Translator language pair as `downloadable` until a site creates it, so a
 * cached, already-created session is the honest source of truth after a
 * successful download.
 */
export function getCachedSession(name: string, options: Record<string, unknown>): BuiltinSession | undefined {
  return SESSION_CACHE.get(sessionKey(name, options));
}

export function cacheSession(name: string, options: Record<string, unknown>, session: BuiltinSession): void {
  SESSION_CACHE.set(sessionKey(name, options), session);
}

export async function createAndCacheSession(
  name: string,
  options: Record<string, unknown> = {},
  timeout = 180_000,
): Promise<BuiltinSession> {
  const cached = getCachedSession(name, options);
  if (cached) return cached;
  const session = await createSession(name, options, timeout);
  cacheSession(name, options, session);
  return session;
}

export type Timed<T> = { value: T; ms: number };

export async function timed<T>(fn: () => Promise<T>): Promise<Timed<T>> {
  const start = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - start) };
}

export type StreamResult = {
  text: string;
  firstTokenMs: number;
  totalMs: number;
};

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value;
}

export async function stream(
  iterator: unknown,
  onChunk?: (text: string) => void,
): Promise<StreamResult> {
  if (!isAsyncIterable(iterator)) {
    const text = typeof iterator === 'string' ? iterator : String(iterator ?? '');
    onChunk?.(text);
    return { text, firstTokenMs: 0, totalMs: 0 };
  }
  const start = performance.now();
  let firstTokenMs = 0;
  let text = '';
  for await (const chunk of iterator) {
    if (!firstTokenMs) firstTokenMs = Math.round(performance.now() - start);
    const piece = typeof chunk === 'string' ? chunk : String(chunk ?? '');
    text += piece;
    onChunk?.(piece);
  }
  return { text, firstTokenMs, totalMs: Math.round(performance.now() - start) };
}

export function call(session: Record<string, (...args: unknown[]) => unknown>, method: string, ...args: unknown[]): unknown {
  const fn = session[method];
  if (typeof fn !== 'function') throw new Error(`Session has no ${method}()`);
  return fn.apply(session, args);
}

/** Fire one tiny throwaway prompt so the model is resident before the talk starts. */
export async function prewarm(): Promise<{ status: 'unsupported' | 'warm' | 'failed'; detail: string }> {
  if (!apiExists('LanguageModel')) {
    return { status: 'unsupported', detail: 'LanguageModel is not defined in this browser' };
  }
  const start = performance.now();
  try {
    const session = await createSession('LanguageModel', {
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
    }, 90_000);
    const result = await withTimeout(
      Promise.resolve(call(session, 'prompt', 'Reply with exactly: OK')),
      90_000,
      'warmup prompt',
    );
    const destroy = session['destroy'];
    if (typeof destroy === 'function') destroy.call(session);
    void result;
    return {
      status: 'warm',
      detail: `resident in ${Math.round(performance.now() - start)}ms`,
    };
  } catch (error) {
    return { status: 'failed', detail: errText(error) };
  }
}

export function keynoteMode(): boolean {
  try {
    return new URLSearchParams(location.search).has('canned') || localStorage.getItem(KEYNOTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function keynoteForcedOff(): boolean {
  try {
    return new URLSearchParams(location.search).get('canned') === '0';
  } catch {
    return false;
  }
}

export function setKeynoteMode(enabled: boolean): void {
  try {
    localStorage.setItem(KEYNOTE_KEY, enabled ? '1' : '0');
  } catch {
    // storage can be blocked; ignore
  }
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function renderUnsupported(root: HTMLElement, title: string, detail: string): void {
  root.replaceChildren();
  const box = document.createElement('div');
  box.className = 'unsupported';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const body = document.createElement('p');
  body.textContent = detail;
  const hint = document.createElement('p');
  hint.className = 'muted';
  hint.textContent =
    'Built-in AI needs a supported desktop browser (Chrome 138+ / Edge 158+ with the Prompt API flag), a secure context, and enough free disk space. Turn on keynote mode in the deck for recorded output.';
  box.append(heading, body, hint);
  root.append(box);
}
