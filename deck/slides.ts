export type Tone = 'cyan' | 'violet' | 'green' | 'amber' | 'red' | 'slate';

export type Card = {
  n?: string;
  glyph?: string;
  title: string;
  sub?: string;
  tag?: string;
  tone?: Tone;
};

export type Stat = {
  value: string;
  label: string;
  sub?: string;
  tone?: Tone;
};

export type Branch = {
  q: string;
  a: string;
  tone?: Tone;
};

export type Project = {
  title: string;
  line: string;
  tag: string;
  tone?: Tone;
};

export type Slide = {
  id: string;
  kind: 'title' | 'demo' | 'cards' | 'status' | 'code' | 'metrics' | 'decision' | 'poll' | 'projects' | 'close';
  kicker: string;
  title: string;
  seconds: number;
  subtitle?: string;
  cards?: Card[];
  stats?: Stat[];
  branches?: Branch[];
  projects?: Project[];
  takeaways?: string[];
  code?: string;
  demo?: string;
  demoLabel?: string;
  notes: string[];
};

export const TOTAL_SECONDS = 25 * 60;

export const slides: Slide[] = [
  {
    id: 'title',
    kind: 'title',
    kicker: 'A practical field guide',
    title: 'Built-In AI in the Browser',
    seconds: 15,
    subtitle: 'Chrome first · Edge next · honest about the rest',
    notes: [
      'Open the deck early. The audience view is intentionally empty except for the slide — no controls, no timer, no badges.',
      'The first model download needs a user gesture. If the presenter panel says the model is not warm, click Warm model before starting.',
      'Say the contract: by the end they will know what these APIs can do, what they cannot, and when to choose them.',
    ],
  },
  {
    id: 'cold-open',
    kind: 'demo',
    kicker: 'Cold open',
    title: 'No key. No server. No network request.',
    seconds: 110,
    demo: 'demos/01-hello/index.html',
    demoLabel: 'DETECT → TRANSLATE → SUMMARIZE',
    notes: [
      'Pick a French sample. Ask: "What language is this? What would it take to ship this in your app today?"',
      'Run the three calls. Point at the code panel: same shape every time.',
      'Land the line: the browser is shipping a model as a platform primitive, like Canvas or Web Crypto.',
      'If Canned output is ON, say explicitly: "This is recorded output from this exact browser."',
    ],
  },
  {
    id: 'layers',
    kind: 'cards',
    kicker: 'The map',
    title: 'Four layers of AI in the browser',
    seconds: 100,
    cards: [
      {
        n: '01',
        title: 'Browser features',
        sub: 'Chrome Translate · Copilot · Safari Summarize',
        tone: 'slate',
      },
      {
        n: '02',
        title: 'Infrastructure',
        sub: 'WebGPU · Wasm · WebNN',
        tone: 'violet',
      },
      {
        n: '03',
        title: 'Built-in APIs',
        sub: 'Gemini Nano · Aion Instruct',
        tag: 'You are here',
        tone: 'cyan',
      },
      {
        n: '04',
        title: 'Agents',
        sub: 'WebMCP · tools · human in the loop',
        tone: 'amber',
      },
    ],
    notes: [
      'This answers the planning question about the wider "AI in Chrome" doc: include it as a map, not as content.',
      'Layer 1 has zero API access. Layer 2 means bringing your own model. Layer 3 is the talk. Layer 4 is the teaser at the end.',
      'Do not go deep on WebNN: Chrome is winding it down cross-platform. If asked, say it is being superseded and move on.',
    ],
  },
  {
    id: 'status',
    kind: 'status',
    kicker: 'Reality check',
    title: 'What ships today',
    seconds: 110,
    subtitle: 'Desktop only · ~22 GB free · 5 languages',
    cards: [
      { title: 'Chrome 138+', sub: 'Translator · Detector · Summarizer', tag: 'Stable', tone: 'green' },
      { title: 'Chrome 148+', sub: 'Prompt API on the web', tag: 'Stable', tone: 'green' },
      { title: 'Edge 158+', sub: 'Aion Instruct 2.3B', tag: 'Flagged preview', tone: 'amber' },
      { title: 'Firefox', sub: 'Negative on the spec', tag: 'No APIs', tone: 'red' },
      { title: 'Safari', sub: 'No position yet', tag: 'No APIs', tone: 'red' },
    ],
    notes: [
      'Read the hardware line out loud. Desktop only: no Android, no iOS. ChromeOS only on Chromebook Plus.',
      'Rehearsal fact: the model sat at "downloading" with no error until 22 GB of free space existed; provisioning then took about 7.5 minutes.',
      'Languages today are en, es, ja, de, fr. Audio input needs a GPU, so there is deliberately no audio demo.',
      'Say: "Check availability() and design an honest unsupported state. Do not pretend this is universal."',
      'If challenged on Phi-4: that was in the original abstract; Edge now documents Aion Instruct 2.3B.',
    ],
  },
  {
    id: 'jobs',
    kind: 'cards',
    kicker: 'Mental model',
    title: 'Four jobs, not a feature list',
    seconds: 70,
    cards: [
      { glyph: '◎', title: 'Understand', sub: 'Detect + translate', tone: 'cyan' },
      { glyph: '≡', title: 'Condense', sub: 'Summarize', tone: 'violet' },
      { glyph: '{ }', title: 'Extract', sub: 'Schema-constrained output', tone: 'green' },
      { glyph: '✎', title: 'Write', sub: 'Writer · Rewriter · Proofreader', tag: 'Trial', tone: 'amber' },
    ],
    notes: [
      'This corrects the abstract: a review section is one instance of "condense", not the thesis of the talk.',
      'Ask the room: which of these four jobs do you have in your own product?',
      'The audience should be mapping these jobs onto their backlog during this slide.',
    ],
  },
  {
    id: 'shape',
    kind: 'code',
    kicker: 'One shape',
    title: 'availability() → create() → call()',
    seconds: 70,
    code: `const state = await Summarizer.availability(options);
// 'unavailable' | 'downloadable' | 'downloading' | 'available'

if (state === 'available') {
  const session = await Summarizer.create(options);
  for await (const chunk of session.summarizeStreaming(text)) {
    output.textContent += chunk;   // text, never innerHTML
  }
} else {
  showHonestFallback(state);
}`,
    notes: [
      'Do not skip the fallback branch. That is what makes this shippable on a public site.',
      'Pass the same options to availability() and create(), otherwise you may probe a different configuration.',
      'The first download needs activation: trigger from a click, not on page load.',
      'Byte-level downloadprogress is not reliable; the four availability states are your UI.',
    ],
  },
  {
    id: 'condense',
    kind: 'demo',
    kicker: 'Demo · Condense',
    title: 'You pick the summary shape',
    seconds: 200,
    demo: 'demos/02-summarizer/index.html',
    demoLabel: 'AUDIENCE PICKS THE OUTPUT',
    notes: [
      'Ask for a show of hands: one sentence, three bullets, or paragraph. Click the winning option.',
      'Point at the streaming output before it finishes; narrate what is happening.',
      'Then paste something absurd (a commit message, a recipe) to show it is a general text task.',
      'Call out the timings: create(), first token, total. Warm first token was about 0.4s on this laptop.',
      'If Canned output is ON, say the output is recorded from this browser.',
    ],
  },
  {
    id: 'extract',
    kind: 'demo',
    kicker: 'Demo · Extract',
    title: 'Prose in, typed object out',
    seconds: 180,
    demo: 'demos/03-structured/index.html',
    demoLabel: 'JSON SCHEMA → TYPED RESULT',
    notes: [
      'The email is deliberately messy: an old wrong total appears, plus an unrelated question.',
      'Ask the room which fields to extract. Click the corresponding schema button.',
      'Show the schema in the code panel, then run it. Point out JSON.parse succeeding.',
      'Mention image input is the same idea with expectedInputs image — capability check first.',
      'Edge watermarks Prompt API output except when responseConstraint is used. That is a real integration detail, not a footnote.',
    ],
  },
  {
    id: 'tradeoffs',
    kind: 'metrics',
    kicker: 'Trade-offs',
    title: 'Fast when warm. Not magic when cold.',
    seconds: 90,
    subtitle: 'Measured on this laptop — not a benchmark',
    stats: [
      { value: '3.6s', label: 'Cold create()', tone: 'amber' },
      { value: '19s', label: 'Cold first token', tone: 'red' },
      { value: '0.4s', label: 'Warm first token', tone: 'green' },
      { value: '2.0s', label: 'Warm total', tone: 'cyan' },
      { value: '7.5m', label: 'First provision', tone: 'violet' },
    ],
    notes: [
      'These numbers are from this laptop, not a benchmarketing deck. Say that.',
      'The honest position: on-device wins on privacy, latency-after-warm, and cost; loses on ceiling quality and reach.',
      'Practical rules: pre-warm once per session, stream, cap output length, always have a fallback.',
      'Quality ceiling of a ~2B-class on-device model; no internet knowledge; memory and disk are shared with the OS.',
    ],
  },
  {
    id: 'injection',
    kind: 'demo',
    kicker: 'Trade-offs',
    title: 'Translated text is not sanitized HTML',
    seconds: 70,
    demo: 'demos/04-injection/index.html',
    demoLabel: 'TEXT IN · TEXT OUT',
    notes: [
      'Jake Archibald found that an fr→en translation of <scripte> becomes <script>. Chinese-to-English variants worked too.',
      'Never assign model output to innerHTML. Use textContent, or setHTML with a sanitizer / Trusted Types.',
      'The spec added a note via webmachinelearning/translation-api#60. This is why "text in, text out" matters.',
      'If the translator is unavailable, the demo shows the recorded output from the canned path.',
    ],
  },
  {
    id: 'decision',
    kind: 'decision',
    kicker: 'Decision framework',
    title: 'Reach for built-in AI when the constraints fit',
    seconds: 110,
    subtitle: 'Unsupported? Capability-check → fallback.',
    branches: [
      { q: 'Sensitive data?', a: 'On-device', tone: 'green' },
      { q: 'Offline or no per-call cost?', a: 'On-device', tone: 'green' },
      { q: 'Narrow, repeatable job?', a: 'Task API', tone: 'cyan' },
      { q: 'World knowledge or mobile reach?', a: 'Cloud / hybrid', tone: 'violet' },
    ],
    notes: [
      'This is the enablement slide. They should be able to make a decision with it.',
      'Mention the polyfills exist for both task APIs and the Prompt API; hybrid fallback via Firebase AI Logic.',
      'Do not say "just use built-in AI". Say "use it where its constraints are your constraints".',
    ],
  },
  {
    id: 'poll',
    kind: 'poll',
    kicker: 'Audience check',
    title: 'Where would you use it?',
    seconds: 60,
    cards: [
      { n: 'A', title: 'Private search', sub: 'Summarise user content', tone: 'cyan' },
      { n: 'B', title: 'Extraction', sub: 'Forms and receipts', tone: 'violet' },
      { n: 'C', title: 'Multilingual UX', sub: 'Detect + translate', tone: 'green' },
      { n: 'D', title: 'Not yet', sub: 'I need mobile reach', tone: 'amber' },
    ],
    notes: [
      'Hands up first. The QR panel was only a planning placeholder — do not show or imply a working poll service.',
      'Read the room: if most votes are D, spend a little more time on interop and hybrid.',
      'This is the mid-talk interaction beat; the fallback is that people shout a letter.',
    ],
  },
  {
    id: 'projects',
    kind: 'projects',
    kicker: 'What people shipped',
    title: 'The range is wider than “chatbot”',
    seconds: 85,
    projects: [
      {
        title: 'EduAdapt',
        line: 'Any page rewritten for dyslexia or ADHD',
        tag: 'Accessibility',
        tone: 'cyan',
      },
      {
        title: 'Pet Shelter App',
        line: 'Photo → profile → translated adoption story',
        tag: 'Multimodal',
        tone: 'green',
      },
      {
        title: 'The Turing Werewolf',
        line: 'Local agents debate, accuse and deceive',
        tag: 'Play',
        tone: 'violet',
      },
      {
        title: 'Nutshell',
        line: 'Hands-free browsing with head and mouth movements',
        tag: 'Assistive',
        tone: 'amber',
      },
    ],
    notes: [
      'Source: Google Chrome Built-in AI Challenge 2025 project gallery, googlechromeai2025.devpost.com/project-gallery. These are real winners, not hypotheticals.',
      'EduAdapt is a strong before/after story: privacy-friendly rewriting for students who need sustained support that schools cannot always provide.',
      'Pet Shelter App is the cost/equity story: image + Prompt API + Writer + Proofreader + Translator, with graceful degradation so the form still works without AI.',
      'The Turing Werewolf is the fun one: cloned Prompt API sessions, JSON schemas and structured turn-taking. Its own lesson was that LLMs need structure and constraints.',
      'Nutshell is the accessibility endpoint: on-device AI as an input method, not a chatbot.',
      'Use this slide to widen the room’s imagination before the interop reality check.',
    ],
  },
  {
    id: 'interop',
    kind: 'cards',
    kicker: 'Interop',
    title: 'Start with Chrome. Do not promise “coming soon”.',
    seconds: 95,
    cards: [
      { title: 'Mozilla', sub: 'Negative on Translation API', tag: '#1015', tone: 'red' },
      { title: 'WebKit', sub: 'No position · XSLeak concern', tag: '#339', tone: 'amber' },
      { title: 'Mastodon', sub: 'PRs wait for two engines', tag: '#35369', tone: 'violet' },
      { title: 'W3C', sub: 'Web Machine Learning CG', tag: 'Standards', tone: 'green' },
    ],
    notes: [
      'Be honest: other engines will not catch up soon. Do not imply Safari or Firefox support is imminent.',
      'Mozilla objects to backend assumptions in the spec and wants first-class DOM tree translation; Firefox uses Bergamot today.',
      'WebKit’s concern is that language-pack downloads enable XSLeak attacks.',
      'The Mastodon PRs are a great "why this matters" story: server-side translation costs real money for admins.',
      'If time is short, this is the first slide to trim.',
    ],
  },
  {
    id: 'cloud',
    kind: 'code',
    kicker: 'The honest comparison',
    title: 'On-device is a constraint, not a religion',
    seconds: 35,
    code: `if (await Summarizer.availability(opts) === 'available') {
  return summarizeOnDevice(session, text);
}
return summarizeWithCloudApi(text);   // or a polyfill`,
    notes: [
      'Keep this to 35 seconds. It is the logical conclusion of the decision slide.',
      'Wins: privacy, no per-call cost, offline, low warm latency. Costs: download, disk, RAM, quality ceiling, limited reach.',
    ],
  },
  {
    id: 'close',
    kind: 'close',
    kicker: 'Close',
    title: 'The browser is becoming a runtime for AI',
    seconds: 100,
    subtitle: 'Next: WebMCP — apps expose tools to agents, with a human in the loop.',
    takeaways: ['Four jobs', 'One shape', 'Design the unsupported state first'],
    notes: [
      'Point at the repo URL on the final slide once published.',
      'End the content at 25:00 so the 5-minute mobile Q&A fits inside the 30-minute slot.',
      'If behind, cut the interop slide or the injection demo before cutting Q&A.',
      'The deck and demos are public. Take the code, not just the ideas.',
    ],
  },
];

export const TOTAL_PLANNED = slides.reduce((sum, slide) => sum + slide.seconds, 0);
