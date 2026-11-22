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
    kicker: '',
    title: 'Built-In AI in the Browser',
    seconds: 15,
    subtitle: 'Practical capabilities for modern web apps',
    takeaways: ['Piyush Gupta'],
    notes: [
      'Open the deck early. The audience view is intentionally clean — no controls, no timer, no badges.',
      'The first model download needs a user gesture. If the presenter panel says the model is not warm, click Warm model before starting.',
      'Introduce yourself: "I’m Piyush Gupta." Then set the contract: by the end they will know what these APIs can do, what they cannot, and when to choose them.',
    ],
  },
  {
    id: 'cold-open',
    kind: 'demo',
    kicker: '',
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
    kicker: '',
    title: 'Four layers of AI in the browser',
    seconds: 100,
    subtitle: 'Different layers, different jobs — not a ladder.',
    cards: [
      {
        glyph: '◇',
        title: 'Browser features',
        sub: 'Chrome Translate · Edge Copilot · Safari Summarize',
        tag: 'No API',
        tone: 'slate',
      },
      {
        glyph: '⚙',
        title: 'Your model, browser runtime',
        sub: 'WebGPU · Wasm · WebNN',
        tag: 'You bring model',
        tone: 'violet',
      },
      {
        glyph: '⬡',
        title: 'Built-in APIs',
        sub: 'Gemini Nano · Aion Instruct',
        tag: 'Focus today',
        tone: 'cyan',
      },
      {
        glyph: '✦',
        title: 'Agents / tools',
        sub: 'WebMCP · tools · human in the loop',
        tag: 'Emerging',
        tone: 'amber',
      },
    ],
    notes: [
      'This answers the planning question about the wider "AI in Chrome" doc: include it as a map, not as content.',
      'These are not maturity levels. You can use layer 2 and layer 3 in the same product. Layer 1 is product UX with no developer API.',
      'Layer 3 is the focus of this talk because it gives you a browser-managed model with a web API. Layer 4 is a closing teaser.',
      'Do not go deep on WebNN: Chrome is winding it down cross-platform. If asked, say it is being superseded and move on.',
    ],
  },
  {
    id: 'status',
    kind: 'cards',
    kicker: '',
    title: 'What ships today',
    seconds: 110,
    subtitle: 'Desktop only · ~22 GB free · 5 languages',
    cards: [
      { title: 'Chrome 138+', sub: 'Translator · Detector · Summarizer', tag: 'Stable', tone: 'green' },
      { title: 'Chrome 148+', sub: 'Prompt API on the web', tag: 'Stable', tone: 'green' },
      { title: 'Edge 158+', sub: 'Aion Instruct 2.3B', tag: 'Flagged preview', tone: 'amber' },
      { title: 'Firefox', sub: 'Negative on the spec', tag: 'No built-in APIs', tone: 'red' },
      { title: 'Safari', sub: 'No position yet', tag: 'No built-in APIs', tone: 'red' },
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
    kicker: '',
    title: 'Four jobs, not a feature list',
    seconds: 70,
    cards: [
      { glyph: '◎', title: 'Understand', sub: 'Detect + translate', tone: 'cyan' },
      { glyph: '≡', title: 'Condense', sub: 'Summarize', tone: 'violet' },
      { glyph: '{ }', title: 'Extract', sub: 'Schema-constrained output', tone: 'green' },
      { glyph: '✎', title: 'Write', sub: 'Writer · Rewriter · Proofreader', tag: 'Trial', tone: 'amber' },
    ],
    notes: [
      'How I arrived at these four: I mapped the stable/task APIs to user jobs, not API names. Detect+translate = understand input; summarize = condense; Prompt API + schema = extract/structure; Writer/Rewriter/Proofreader = write. The Prompt API can do more, but this framing helps pick the smallest useful capability.',
      'This corrects the abstract: a review section is one instance of "condense", not the thesis of the talk.',
      'Ask the room: which of these four jobs do you have in your own product?',
    ],
  },
  {
    id: 'shape',
    kind: 'code',
    kicker: '',
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
    kicker: '',
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
    kicker: '',
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
    kicker: '',
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
    kicker: '',
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
    kicker: '',
    title: 'When to use which path',
    seconds: 110,
    subtitle: 'Always: availability() check first, then fall back honestly.',
    branches: [
      { q: 'Sensitive data / offline / no per-call cost', a: 'Built-in on-device', tone: 'green' },
      { q: 'Narrow, repeatable job (detect, translate, summarize)', a: 'Built-in task API', tone: 'cyan' },
      { q: 'Needs latest knowledge or mobile reach', a: 'Cloud / hybrid', tone: 'violet' },
    ],
    notes: [
      'Task API means the purpose-built browser APIs: Translator, Language Detector, Summarizer, Writer/Rewriter/Proofreader. They have constrained inputs/outputs and are easier to reason about than a free-form prompt.',
      'World knowledge or mobile reach means: the model needs up-to-date internet knowledge, or your users are mostly on Android/iOS where these APIs are not available. In that case use cloud or a hybrid: try local, fall back deliberately.',
      'This is the enablement slide. Mention polyfills and Firebase AI Logic hybrid fallback.',
      'Do not say "just use built-in AI". Say "use it where its constraints are your constraints".',
    ],
  },
  {
    id: 'poll',
    kind: 'poll',
    kicker: '',
    title: 'Where would you try this first?',
    seconds: 60,
    subtitle: 'A few common starting points — not the only ones.',
    cards: [
      { n: 'A', title: 'Private content', sub: 'Summaries, search, notes', tone: 'cyan' },
      { n: 'B', title: 'Extraction', sub: 'Forms, receipts, emails', tone: 'violet' },
      { n: 'C', title: 'Multilingual UX', sub: 'Detect + translate', tone: 'green' },
      { n: 'D', title: 'Writing assist', sub: 'Rewrite, proofread, draft', tone: 'amber' },
    ],
    notes: [
      'Hands up first. These are conversation starters, not the only valid use cases. If someone shouts “accessibility” or “offline field app”, that’s a great answer.',
      'Read the room: if many people pick D, spend a little more time on the fact that Writer/Rewriter/Proofreader are still trials, so the right answer may be Prompt API or cloud today.',
      'This is the mid-talk interaction beat; the fallback is that people shout a letter.',
    ],
  },
  {
    id: 'projects',
    kind: 'projects',
    kicker: '',
    title: 'Where it shows up in real products',
    seconds: 85,
    subtitle: 'Real-world usage, not just demos.',
    projects: [
      {
        title: 'Google Meet',
        line: 'Live captions translated on-device during calls',
        tag: 'Google product',
        tone: 'cyan',
      },
      {
        title: 'Chrome',
        line: 'Built-in translation and on-device AI features',
        tag: 'Browser UX',
        tone: 'green',
      },
      {
        title: 'Mastodon / Elk plans',
        line: 'Client-side translate/detect to cut server cost',
        tag: 'Real adoption pressure',
        tone: 'violet',
      },
      {
        title: 'Your app',
        line: 'Private summaries, extraction, multilingual input',
        tag: 'Opportunity',
        tone: 'amber',
      },
    ],
    notes: [
      'I looked at the 2025 hackathon gallery for inspiration; the strongest pattern to borrow is graceful degradation (Pet Shelter App): AI fills the form, but the form still works without AI. I did not find a hackathon demo that cleanly fits an audience-in-the-room live interaction better than the existing condense/extract demos.',
      'Google Meet live caption translation is a concrete real-world on-device AI use case (Google has discussed on-device speech/translation in Meet). Chrome’s own translation/features are layer-1 product examples — useful as context, but no developer API.',
      'Mastodon PRs (#35369 translate, #35345 detect) and Elk’s translation discussion show real demand: client-side translation can remove paid server-side translation costs for admins. This is adoption pressure, not shipping universal browser support.',
      'Be careful not to overclaim customer case studies. The previously mentioned Perplexity case study 404’d, so it stays out.',
    ],
  },
  {
    id: 'interop',
    kind: 'cards',
    kicker: '',
    title: 'The web is working it out',
    seconds: 95,
    subtitle: 'Ship progressively: detect capability, add fallback, watch standards.',
    cards: [
      { title: 'Chrome / Edge', sub: 'Shipping or previewing APIs', tag: 'Build now', tone: 'green' },
      { title: 'W3C WebML', sub: 'Community Group incubating specs', tag: 'Standard path', tone: 'cyan' },
      { title: 'Firefox / WebKit', sub: 'Open concerns, no shipped API', tag: 'Watch', tone: 'amber' },
      { title: 'Mastodon', sub: 'Wants 2 engines before shipping', tag: 'Real demand', tone: 'violet' },
    ],
    notes: [
      'Frame this as healthy standards work, not doom. Different engines have different constraints: Mozilla wants DOM-tree translation and raised spec-shape concerns; WebKit raised XSLeak concerns around language-pack downloads. Those are useful critiques.',
      'Mastodon is here because it is a real product signal: their PRs wait for two browser engines, and client-side translation would remove server-side translation costs for admins. It explains why interop matters.',
      'Practical takeaway: build for Chrome/Edge where available, feature-detect, use cloud/polyfill fallback, and avoid promising cross-browser support dates.',
      'If time is short, this is the first slide to trim.',
    ],
  },
  {
    id: 'cloud',
    kind: 'code',
    kicker: '',
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
    kicker: '',
    title: 'The browser is becoming a runtime for AI',
    seconds: 80,
    subtitle: 'Next: WebMCP — apps expose tools to agents, with a human in the loop.',
    takeaways: ['Four jobs', 'One shape', 'Design the unsupported state first'],
    notes: [
      'Point at the repo URL on the final slide once published.',
      'End the content near 25:00 so the 5-minute mobile Q&A fits inside the 30-minute slot.',
      'If behind, cut the interop slide or the injection demo before cutting Q&A.',
      'The deck and demos are public. Take the code, not just the ideas.',
    ],
  },
  {
    id: 'thanks',
    kind: 'title',
    kicker: '',
    title: 'Thank you',
    seconds: 20,
    subtitle: 'Questions?  ·  Piyush Gupta',
    notes: [
      'Pause. Invite questions. If there is no second screen, keep this slide up during Q&A.',
      'Remind them the repo/demos are public once published.',
    ],
  },
];

export const TOTAL_PLANNED = slides.reduce((sum, slide) => sum + slide.seconds, 0);
