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

const MATCH_SCHEMA = {
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
  required: ['scores', 'highlights'],
  additionalProperties: false,
} as const;

type ModelResult = {
  scores: Array<{ sessionId: string; score: number }>;
  highlights: Match[];
};

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

function buildPrompt(profile: Profile): string {
  const person = {
    role: profile.role,
    summary: profile.summary,
    signals: profile.signals.map((s) => SIGNAL_LABEL[s]),
  };
  const agenda = SESSIONS.map((session) => ({
    id: session.id,
    title: session.title,
    topic: session.topic,
    signals: session.signals.map((s) => SIGNAL_LABEL[s]),
  }));
  return `You are helping this attendee pick sessions. Return ONLY valid JSON matching the schema.
scores: an array of ${SESSIONS.length} objects, one for every sessionId in AGENDA, each with an integer score from 0 to 100. Include every sessionId exactly once; order does not matter. Score every session using only shared signals between PERSON and that session's signals. Do not invent facts.
highlights: exactly 3 objects, and their sessionIds MUST be the 3 sessions with the highest scores. Copy sessionId from AGENDA. why: at most 10 words, plain, naming the strongest shared signals; no marketing words. question: one realistic question this attendee would actually ask in Q&A or over coffee to get practical value from this session. Write from the attendee's point of view ("What should I…", "How would I…", "Where would I…"), grounded in their role and the session topic. 8-16 words. No speaker names, no "fun", no "exciting", no generic "tell us more".

PERSON
${JSON.stringify(person)}

AGENDA
${JSON.stringify(agenda)}`;
}

function tryParse(text: string): ModelResult | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    const value = JSON.parse(candidate) as { scores?: unknown; highlights?: unknown };
    if (!Array.isArray(value.scores)) return null;
    const known = new Set(SESSIONS.map((s) => s.id));
    const scores = value.scores
      .filter((m): m is Record<string, unknown> => typeof m === 'object' && m !== null)
      .filter((m) => typeof m.sessionId === 'string' && known.has(m.sessionId))
      .map((m) => ({
        sessionId: m.sessionId as string,
        score: Math.max(0, Math.min(100, Number(m.score) || 0)),
      }));
    const byId = [...new Map(scores.map((m) => [m.sessionId, m])).values()];
    if (new Set(byId.map((m) => m.sessionId)).size !== SESSIONS.length) return null;

    const highlights = Array.isArray(value.highlights)
      ? value.highlights
          .filter((m): m is Record<string, unknown> => typeof m === 'object' && m !== null)
          .filter((m) => typeof m.sessionId === 'string' && known.has(m.sessionId))
          .map((m) => ({
            sessionId: m.sessionId as string,
            score: 0,
            why: String(m.why ?? '').slice(0, 240),
            question: String(m.question ?? '').slice(0, 240),
          }))
      : [];
    return {
      scores: byId,
      highlights: [...new Map(highlights.map((m) => [m.sessionId, m])).values()],
    };
  } catch {
    return null;
  }
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

function useFallback(label: string, kind: 'warn' | 'bad' = 'warn'): void {
  const matches = localMatches(current);
  renderSchedule(matches);
  rawBody.textContent = JSON.stringify({ source: label, matches }, null, 2);
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
    rawBody.textContent = '—';
    timingChip.textContent = '—';
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

      setStatus('Prompt API: scoring all sessions…', 'ok');

      const prompt = buildPrompt(current);
      const prompted = await timed(async () => {
        const value = await withTimeout(
          Promise.resolve(call(session!, 'prompt', prompt, { responseConstraint: MATCH_SCHEMA })),
          RUN_TIMEOUT,
          'LanguageModel.prompt()',
        );
        return String(value);
      });
      rawBody.textContent = prompted.value;
      const result = tryParse(prompted.value);
      if (!result) throw new Error('model did not return usable scores');
      renderSchedule(buildMatches(current, result));
      timingChip.textContent = `prompt ${formatMs(prompted.ms)}`;
      setStatus('Prompt API: on-device result', 'ok');
    } catch (error) {
      useFallback(`Prompt API: fallback · ${errText(error)}`, 'bad');
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
