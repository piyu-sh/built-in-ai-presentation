import {
  availability, call, createAndCacheSession, errText, formatMs,
  getCachedSession, keynoteMode, timed, warmSession, withTimeout,
} from '../shared/ai';
import { badge, button, h, withBusy } from '../shared/dom';

type Signal = 'applied-ai' | 'leadership' | 'devprod' | 'zero-to-one' | 'scale' | 'web';

type Profile = {
  name: string;
  initials: string;
  role: string;
  location: string;
  summary: string;
  source: string;
  signals: Signal[];
};

type Session = {
  id: string;
  time: string;
  title: string;
  stage: string;
  topic: string;
  signals: Signal[];
};

type Match = { sessionId: string; score: number; why: string; question: string };

const SIGNAL_LABEL: Record<Signal, string> = {
  'applied-ai': 'Applied AI / GenAI',
  leadership: 'Engineering leadership',
  devprod: 'Developer productivity',
  'zero-to-one': '0→1 products',
  scale: 'Scaling teams',
  web: 'Web standards',
};

const SIGNAL_WEIGHT: Record<Signal, number> = {
  'applied-ai': 8,
  leadership: 8,
  devprod: 7,
  'zero-to-one': 4,
  scale: 5,
  web: 3,
};

const QUESTION: Record<Signal, string> = {
  'applied-ai': 'What on-device idea would you prototype if privacy were the headline?',
  leadership: 'When do you back the bold bet before the metrics are perfect?',
  devprod: 'What tiny tooling change saved your team the most time?',
  'zero-to-one': 'What did you cut to get the first version into users’ hands?',
  scale: 'What broke first when the idea had to scale?',
  web: 'If this had to run in a browser tab tomorrow, what would you drop?',
};

const PROFILES: Profile[] = [
  {
    name: 'Piyush Gupta',
    initials: 'PG',
    role: 'Senior Engineering Manager · Expedia Group',
    location: 'Delhi, India',
    summary: '~13.5 years building 0→1 products, scaling teams, applied AI/GenAI, and engineering productivity.',
    source: 'Sample public profile · no live LinkedIn access',
    signals: ['applied-ai', 'leadership', 'devprod', 'zero-to-one', 'scale', 'web'],
  },
  {
    name: 'Aanya Rao',
    initials: 'AR',
    role: 'Product Designer · Northstar Labs',
    location: 'Bengaluru, India',
    summary: 'Designs calm interfaces for smart tools and prototypes browser-native UX quickly.',
    source: 'Fictional sample profile',
    signals: ['web', 'zero-to-one', 'devprod', 'leadership'],
  },
  {
    name: 'Marcus Feld',
    initials: 'MF',
    role: 'Principal SRE · Cloudline',
    location: 'Berlin, Germany',
    summary: 'Keeps large platforms reliable, automates the boring parts, and writes incident playbooks.',
    source: 'Fictional sample profile',
    signals: ['scale', 'devprod', 'leadership'],
  },
  {
    name: 'Sofia Marques',
    initials: 'SM',
    role: 'Applied ML Lead · Lumen Works',
    location: 'Lisbon, Portugal',
    summary: 'Ships small models into real workflows and turns research demos into useful product features.',
    source: 'Fictional sample profile',
    signals: ['applied-ai', 'zero-to-one', 'web'],
  },
  {
    name: 'Dev Raman',
    initials: 'DR',
    role: 'Engineering Manager · Payload',
    location: 'Singapore',
    summary: 'Grows engineering teams, simplifies delivery, and measures impact instead of activity.',
    source: 'Fictional sample profile',
    signals: ['leadership', 'scale', 'devprod', 'zero-to-one'],
  },
  {
    name: 'Lina Okafor',
    initials: 'LO',
    role: 'Data Journalist · Signal Desk',
    location: 'Nairobi, Kenya',
    summary: 'Builds small data tools for stories, explains models to humans, and publishes fast.',
    source: 'Fictional sample profile',
    signals: ['applied-ai', 'web', 'zero-to-one'],
  },
];

const SESSIONS: Session[] = [
  { id: 'tiny-models', time: '10:30–11:00', title: 'Tiny Models, Big Workflows', stage: 'Stage A', topic: 'Applied AI', signals: ['applied-ai', 'devprod', 'web'] },
  { id: 'oncall', time: '10:30–11:00', title: 'The 3 a.m. On-Call Playbook', stage: 'Stage B', topic: 'Reliability', signals: ['scale', 'devprod', 'leadership'] },
  { id: 'sketch-to-ship', time: '11:10–11:40', title: 'From Sketch to Ship in One Afternoon', stage: 'Main Stage', topic: 'Product', signals: ['zero-to-one', 'leadership', 'web'] },
  { id: 'agents-stop', time: '11:10–11:40', title: 'Agents That Know When to Stop', stage: 'Stage C', topic: 'AI Systems', signals: ['applied-ai', 'scale', 'zero-to-one'] },
  { id: 'calm-ui', time: '12:00–12:30', title: 'Designing Calm Interfaces for Smart Tools', stage: 'Stage B', topic: 'Design & UX', signals: ['web', 'zero-to-one', 'leadership'] },
  { id: 'browser-runtime', time: '12:00–12:30', title: 'The Browser as a Runtime', stage: 'Main Stage', topic: 'Web Platform', signals: ['web', 'scale', 'devprod'] },
  { id: 'team-topology', time: '13:30–14:00', title: 'Team Topology for AI Products', stage: 'Stage A', topic: 'Leadership', signals: ['leadership', 'scale', 'zero-to-one'] },
  { id: 'local-first', time: '13:30–14:00', title: 'Local-First Data Without the Headache', stage: 'Stage C', topic: 'Engineering', signals: ['web', 'devprod', 'applied-ai'] },
];

const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          score: { type: 'number' },
        },
        required: ['sessionId', 'score'],
        additionalProperties: false,
      },
    },
  },
  required: ['scores'],
  additionalProperties: false,
} as const;

const HIGHLIGHT_SCHEMA = {
  type: 'object',
  properties: {
    highlights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          why: { type: 'string' },
          question: { type: 'string' },
        },
        required: ['sessionId', 'why', 'question'],
        additionalProperties: false,
      },
    },
  },
  required: ['highlights'],
  additionalProperties: false,
} as const;

type Score = { sessionId: string; score: number };
type ModelResult = { scores: Score[]; highlights: Match[] };

/** Identical to the shared prewarm options so the warmed/cached session is reused. */
function promptOptions(): Record<string, unknown> {
  return { expectedOutputs: [{ type: 'text', languages: ['en'] }] };
}

const RUN_TIMEOUT = 30_000;
const DOWNLOAD_TIMEOUT = 180_000;

const app = document.querySelector<HTMLDivElement>('#app')!;

const shuffleButton = button('Shuffle profile', () => shuffle(), 'ghost');
const runButton = button('Match with on-device AI', () => void run(), 'primary');
const downloadButton = button('Download model', () => void downloadModel(), 'ghost');
const stateBadge = badge('Prompt API: —', 'idle');
const timingChip = h('span', { class: 'match-timing', text: '—' });
const profileHost = h('div');
const resultsHost = h('div', { class: 'match-results' });
const rawDetails = h('details', { class: 'match-raw' },
  h('summary', { text: 'model JSON' }),
  h('pre', { class: 'mono', text: '—' }),
);
const rawBody = rawDetails.querySelector('pre')!;

let profileIndex = 0;
let current = PROFILES[profileIndex]!;
let warmPromise: Promise<void> | null = null;

function overlap(profile: Profile, session: Session): Signal[] {
  return session.signals.filter((signal) => profile.signals.includes(signal));
}

/** Deterministic, clearly-labelled fallback used when the model is not ready. */
function localMatches(profile: Profile): Match[] {
  return SESSIONS
    .map((session) => {
      const shared = overlap(profile, session);
      const score = Math.min(96, 62 + shared.reduce((sum, s) => sum + SIGNAL_WEIGHT[s], 0));
      const labels = shared.map((s) => SIGNAL_LABEL[s]);
      const top = [...shared].sort((a, b) => SIGNAL_WEIGHT[b] - SIGNAL_WEIGHT[a])[0] ?? 'applied-ai';
      return {
        sessionId: session.id,
        score,
        why: labels.length ? `Local signal overlap: ${labels.join(' + ')}.` : 'A stretch session outside your usual lane.',
        question: QUESTION[top],
      };
    })
    .sort((a, b) => b.score - a.score);
}

function normalizeModelOutput(value: unknown): string {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2) ?? ''; } catch { return String(value); }
}

function buildScoresPrompt(profile: Profile, sessions: Session[]): string {
  const person = {
    role: profile.role,
    signals: profile.signals.map((s) => SIGNAL_LABEL[s]),
  };
  const agenda = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    topic: session.topic,
    signals: session.signals.map((s) => SIGNAL_LABEL[s]),
  }));
  return `Score these sessions for this attendee. Return ONLY JSON matching the schema.
scores: one object for EACH sessionId in AGENDA, with an integer score from 0 to 100. Include every sessionId exactly once; order does not matter. Use only shared signals between PERSON and that session. Do not invent facts.

PERSON
${JSON.stringify(person)}

AGENDA
${JSON.stringify(agenda)}`;
}

function buildHighlightsPrompt(profile: Profile, targets: Score[]): string {
  const person = {
    role: profile.role,
    signals: profile.signals.map((s) => SIGNAL_LABEL[s]),
  };
  const sessions = targets.map((target) => {
    const session = SESSIONS.find((s) => s.id === target.sessionId)!;
    return {
      id: session.id,
      title: session.title,
      topic: session.topic,
      score: target.score,
      signals: session.signals.map((s) => SIGNAL_LABEL[s]),
    };
  });
  return `Write short highlights for the top ${targets.length} sessions. Return ONLY JSON matching the schema.
highlights: exactly ${targets.length} objects. Their sessionIds MUST be exactly the ids in TOP SESSIONS. Copy sessionId from TOP SESSIONS. why: at most 10 words, plain, naming the strongest shared signals; no marketing words. question: one realistic question this attendee would actually ask in Q&A or over coffee to get practical value from this session. Write from the attendee's point of view ("What should I…", "How would I…", "Where would I…"), grounded in their role and the session topic. 8-16 words. No speaker names, no "fun", no "exciting", no generic "tell us more".

PERSON
${JSON.stringify(person)}

TOP SESSIONS
${JSON.stringify(sessions)}`;
}

function parsePayload(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    const parsed: unknown = JSON.parse(candidate);
    if (!parsed || typeof parsed !== 'object') return null;
    const root = parsed as Record<string, unknown>;
    const wrapper = root.result ?? root.output;
    if (wrapper && typeof wrapper === 'object') return wrapper as Record<string, unknown>;
    return root;
  } catch {
    return null;
  }
}

function parseScores(text: string, expectedIds: string[]): Score[] | null {
  const payload = parsePayload(text);
  if (!payload) return null;
  const expected = new Set(expectedIds);
  const raw = payload.scores ?? payload.matches;
  const scores: Score[] = [];
  const clamp = (value: unknown) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  if (Array.isArray(raw)) {
    for (const [index, item] of raw.entries()) {
      if (typeof item === 'number') {
        const sessionId = expectedIds[index];
        if (sessionId) scores.push({ sessionId, score: clamp(item) });
        continue;
      }
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const sessionId = row.sessionId ?? row.id;
      if (typeof sessionId === 'string' && expected.has(sessionId)) {
        scores.push({ sessionId, score: clamp(row.score ?? row.value) });
      }
    }
  } else if (raw && typeof raw === 'object') {
    for (const [sessionId, score] of Object.entries(raw as Record<string, unknown>)) {
      if (expected.has(sessionId)) scores.push({ sessionId, score: clamp(score) });
    }
  }
  const unique = [...new Map(scores.map((m) => [m.sessionId, m])).values()];
  return unique.length === expected.size ? unique : null;
}

function parseHighlights(text: string): Match[] | null {
  const payload = parsePayload(text);
  if (!payload) return null;
  const raw = Array.isArray(payload.highlights) ? payload.highlights : payload.matches;
  if (!Array.isArray(raw)) return null;
  const known = new Set(SESSIONS.map((s) => s.id));
  const highlights = raw
    .filter((m): m is Record<string, unknown> => Boolean(m) && typeof m === 'object')
    .map((m) => {
      const sessionId = m.sessionId ?? m.id;
      return typeof sessionId === 'string' && known.has(sessionId)
        ? {
            sessionId,
            score: 0,
            why: String(m.why ?? '').slice(0, 240),
            question: String(m.question ?? '').slice(0, 240),
          }
        : null;
    })
    .filter((m): m is Match => m !== null);
  return highlights.length ? [...new Map(highlights.map((m) => [m.sessionId, m])).values()] : null;
}

/** Model scores are authoritative; only the model's top 3 keep its why/question. */
function buildMatches(profile: Profile, result: ModelResult): Match[] {
  const scoreById = new Map(result.scores.map((m) => [m.sessionId, m.score]));
  const topIds = new Set(
    [...result.scores].sort((a, b) => b.score - a.score).slice(0, 3).map((m) => m.sessionId),
  );
  const highlights = new Map(result.highlights
    .filter((m) => topIds.has(m.sessionId))
    .map((m) => [m.sessionId, m]));
  return SESSIONS.map((session) => {
    const top = topIds.has(session.id);
    const highlight = top ? highlights.get(session.id) : undefined;
    const shared = overlap(profile, session).map((s) => SIGNAL_LABEL[s]);
    return {
      sessionId: session.id,
      score: scoreById.get(session.id) ?? 0,
      why: highlight?.why || (shared.length ? shared.join(' + ') : 'Outside your usual lane'),
      question: top ? highlight?.question || '' : '',
    };
  });
}

function renderProfile(): void {
  profileHost.replaceChildren(
    h('section', { class: 'panel match-profile' },
      h('div', { class: 'match-profile-head' },
        h('div', { class: 'match-avatar', text: current.initials }),
        h('div', {},
          h('div', { class: 'match-name', text: current.name }),
          h('div', { class: 'match-role', text: current.role }),
        ),
      ),
      h('p', { class: 'match-summary', text: current.summary }),
      h('div', { class: 'match-signals' }, ...current.signals.map((s) =>
        h('span', { class: 'match-signal', text: SIGNAL_LABEL[s] }))),
      h('p', { class: 'match-source', text: current.source }),
    ),
  );
}

function renderSchedule(matches: Match[]): void {
  const byId = new Map(matches.map((match) => [match.sessionId, match]));
  const topIds = new Set(
    [...matches].sort((a, b) => b.score - a.score).slice(0, 3).map((match) => match.sessionId),
  );
  resultsHost.replaceChildren(...SESSIONS.map((session) => {
    const match = byId.get(session.id);
    const top = Boolean(match && topIds.has(session.id));
    const scoreChildren: Array<Node | string> = [match ? String(match.score) : '—'];
    if (top) scoreChildren.push(h('span', { class: 'match-top', text: 'TOP' }));
    return h('article', { class: `match-row${match ? ' is-match' : ''}${top ? ' is-top' : ''}` },
      h('div', { class: 'match-slot' },
        h('span', { text: session.time }),
        h('small', { text: session.stage }),
      ),
      h('div', { class: 'match-session' },
        h('div', { class: 'match-title', text: session.title }),
        h('div', { class: 'match-meta', text: session.topic }),
      ),
      h('div', { class: 'match-score' }, ...scoreChildren),
      h('div', {},
        h('div', { class: 'match-why', text: match ? match.why : '—' }),
        h('div', { class: 'match-ask', text: top && match?.question ? match.question : '—' }),
      ),
    );
  }));
}

function setStatus(text: string, kind: 'ok' | 'warn' | 'bad' | 'idle'): void {
  stateBadge.textContent = text;
  stateBadge.className = `badge badge-${kind}`;
}

function useFallback(label: string, kind: 'warn' | 'bad' = 'warn', modelOutput?: string): void {
  const matches = localMatches(current);
  renderSchedule(matches);
  rawBody.textContent = JSON.stringify({
    source: label,
    matches,
    ...(modelOutput ? { modelOutput } : {}),
  }, null, 2);
  rawDetails.classList.toggle('has-error', Boolean(modelOutput));
  rawDetails.open = Boolean(modelOutput);
  setStatus(label, kind);
  timingChip.textContent = 'local fallback';
}

async function run(): Promise<void> {
  if (keynoteMode()) {
    useFallback('Prompt API: keynote · canned output');
    return;
  }

  const options = promptOptions();
  await withBusy(runButton, 'Matching…', async () => {
    rawDetails.classList.remove('has-error');
    rawDetails.open = false;
    rawBody.textContent = '—';
    timingChip.textContent = '—';
    const rawOutputs: string[] = [];
    const showRaw = (label: string, output: string): void => {
      rawOutputs.push(`--- ${label} ---\n${output}`);
      rawBody.textContent = rawOutputs.join('\n\n');
    };
    try {
      let session = getCachedSession('LanguageModel', options);
      if (!session) {
        const state = await availability('LanguageModel', options, 5_000);
        if (state !== 'available') {
          useFallback(`Prompt API: ${state} · local fallback`);
          return;
        }
        session = await createAndCacheSession('LanguageModel', options, RUN_TIMEOUT);
      }
      setStatus('Prompt API: warming…', 'warn');
      await warmDemo();
      setStatus('Prompt API: ready', 'ok');

      const scores: Score[] = [];
      const batches = [SESSIONS.slice(0, 4), SESSIONS.slice(4)];
      let totalMs = 0;
      for (const [index, batch] of batches.entries()) {
        setStatus(`Prompt API: scoring ${index + 1}/${batches.length}…`, 'ok');
        const prompt = buildScoresPrompt(current, batch);
        const scored = await timed(async () => {
          const value = await withTimeout(
            Promise.resolve(call(session!, 'prompt', prompt, { responseConstraint: SCORE_SCHEMA })),
            RUN_TIMEOUT,
            `LanguageModel.prompt(scores ${index + 1})`,
          );
          return normalizeModelOutput(value);
        });
        totalMs += scored.ms;
        showRaw(`scores ${index + 1}`, scored.value);
        const parsed = parseScores(scored.value, batch.map((s) => s.id));
        if (!parsed) throw new Error(`model did not return usable scores for batch ${index + 1}`);
        scores.push(...parsed);
        timingChip.textContent = `scores ${formatMs(totalMs)}`;
      }

      const base = SESSIONS.map((session) => ({
        sessionId: session.id,
        score: scores.find((m) => m.sessionId === session.id)?.score ?? 0,
        why: '',
        question: '',
      }));
      renderSchedule(buildMatches(current, { scores, highlights: [] }));

      const targets = [...base].sort((a, b) => b.score - a.score).slice(0, 3);
      setStatus('Prompt API: writing top 3…', 'ok');
      const highlightPrompt = buildHighlightsPrompt(current, targets);
      let highlights: Match[] = [];
      let highlightsFromModel = false;

      // Constrained output is not equally stable across builds. Try plain JSON
      // first, then the schema; scores already came from the Prompt API either way.
      const attempts = [
        { label: 'highlights plain', options: {} },
        { label: 'highlights structured', options: { responseConstraint: HIGHLIGHT_SCHEMA } },
      ];
      for (const attempt of attempts) {
        try {
          const prompted = await timed(async () => {
            const value = await withTimeout(
              Promise.resolve(call(session!, 'prompt', highlightPrompt, attempt.options)),
              20_000,
              `LanguageModel.prompt(${attempt.label})`,
            );
            return normalizeModelOutput(value);
          });
          totalMs += prompted.ms;
          showRaw(attempt.label, prompted.value);
          const parsed = parseHighlights(prompted.value);
          if (parsed?.length) {
            highlights = parsed;
            highlightsFromModel = true;
            break;
          }
        } catch (error) {
          showRaw(`${attempt.label} failed`, errText(error));
        }
      }

      if (!highlightsFromModel) {
        const local = new Map(localMatches(current).map((m) => [m.sessionId, m]));
        highlights = targets.map((target) => {
          const fallback = local.get(target.sessionId)!;
          return {
            sessionId: target.sessionId,
            score: target.score,
            why: fallback.why,
            question: fallback.question,
          };
        });
      }

      renderSchedule(buildMatches(current, { scores, highlights }));
      timingChip.textContent = `prompt ${formatMs(totalMs)}`;
      setStatus(
        highlightsFromModel ? 'Prompt API: on-device result' : 'Prompt API: scores on-device · local highlights',
        highlightsFromModel ? 'ok' : 'warn',
      );
    } catch (error) {
      useFallback(`Prompt API: fallback · ${errText(error)}`, 'bad', rawOutputs.join('\n\n') || '—');
    }
  });
}

async function downloadModel(): Promise<void> {
  await withBusy(downloadButton, 'Downloading…', async () => {
    try {
      const options = promptOptions();
      if (getCachedSession('LanguageModel', options)) {
        setStatus('Prompt API: ready (cached)', 'ok');
        return;
      }
      setStatus('Prompt API: checking…', 'warn');
      const state = await availability('LanguageModel', options);
      if (state === 'unavailable') {
        setStatus('Prompt API: unavailable', 'warn');
        return;
      }
      await createAndCacheSession('LanguageModel', options, DOWNLOAD_TIMEOUT);
      setStatus('Prompt API: ready (cached)', 'ok');
    } catch (error) {
      setStatus(`Prompt API: ${errText(error)}`, 'bad');
    }
  });
}

function resetResults(): void {
  renderSchedule([]);
  rawBody.textContent = 'No match has been generated yet.';
  rawDetails.classList.remove('has-error');
  rawDetails.open = false;
  timingChip.textContent = '';
  setStatus('Prompt API: — (not matched yet)', 'idle');
}

function shuffle(): void {
  const choices = PROFILES.map((_, i) => i).filter((i) => i !== profileIndex);
  profileIndex = choices[Math.floor(Math.random() * choices.length)]!;
  current = PROFILES[profileIndex]!;
  renderProfile();
  resetResults();
}

async function doWarm(): Promise<void> {
  const options = promptOptions();
  const result = await warmSession('LanguageModel', options);
  if (result.status !== 'ready') return;
  const session = getCachedSession('LanguageModel', options);
  if (!session) return;
  // create() alone can leave inference cold; a tiny prompt makes the model resident.
  await withTimeout(
    Promise.resolve(call(session, 'prompt', 'Reply with exactly: OK')),
    25_000,
    'warmup prompt',
  );
}

async function warmDemo(): Promise<void> {
  warmPromise ??= doWarm().catch(() => {});
  await warmPromise;
}
(window as any).__warmDemo = () => warmDemo();

app.append(
  h('div', { class: 'wrap match-app' },
    h('header', { class: 'top match-header' },
      h('h1', { text: 'Profile → schedule matchmaker' }),
      h('span', { class: 'sub', text: 'Prompt API · sample profile · fictional schedule' }),
      h('div', { class: 'match-actions' }, shuffleButton, runButton, downloadButton),
    ),
    h('div', { class: 'match-status' }, stateBadge, timingChip),
    h('div', { class: 'match-grid' }, profileHost, resultsHost),
    rawDetails,
  ),
);

renderProfile();
resetResults();
