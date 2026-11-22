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

export type SlideLink = {
  label: string;
  url: string;
};

export type CodeStep = { lines: number[]; note: string };

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
  codeSteps?: CodeStep[];
  demo?: string;
  demoLabel?: string;
  links?: SlideLink[];
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
    links: [
      { label: 'Chrome built-in AI docs', url: 'https://developer.chrome.com/docs/ai/built-in' },
      { label: 'WebML Community Group', url: 'https://webmachinelearning.github.io/' },
    ],
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
    links: [
      { label: 'Chrome built-in AI status', url: 'https://developer.chrome.com/docs/ai/built-in-apis' },
      { label: 'Edge Prompt API docs', url: 'https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api' },
    ],
    notes: [
      'Read the hardware line out loud. Desktop only: no Android, no iOS. ChromeOS only on Chromebook Plus.',
      'Rehearsal fact: the model sat at "downloading" with no error until 22 GB of free space existed; provisioning then took about 7.5 minutes.',
      'Languages today are en, es, ja, de, fr. Audio input needs a GPU, so there is deliberately no audio demo.',
      'Prereqs/setup to mention if asked: supported desktop Chrome/Edge version; enough disk/RAM; model may need user gesture + download/provisioning. Flags/origin trials may be needed for some APIs depending on channel/version - check chrome://flags / chrome://on-device-internals and the official docs. Don’t claim “default on everywhere”.',
      'Say: "Check availability() and design an honest unsupported state. Do not pretend this is universal."',
    ],
  },
  {
    id: 'jobs',
    kind: 'cards',
    kicker: '',
    title: 'The built-in APIs at a glance',
    seconds: 80,
    subtitle: 'What each one does, when to use it, and how it helps.',
    cards: [
      { glyph: '◎', title: 'Language Detector', sub: 'Detects language of text · use before translate or multilingual input · helps route/label content', tone: 'cyan' },
      { glyph: '⇄', title: 'Translator', sub: 'Translates text between languages · use for local UI/content translation · helps privacy and offline UX', tone: 'green' },
      { glyph: '≡', title: 'Summarizer', sub: 'Condenses long text into key points · use for reviews, notes, articles · helps users scan faster', tone: 'violet' },
      { glyph: '{}', title: 'Prompt API', sub: 'General prompting + structured output · use for extraction/classification/custom tasks · helps turn prose into typed data', tag: 'Most flexible', tone: 'amber' },
      { glyph: '✎', title: 'Writer / Rewriter / Proofreader', sub: 'Draft, reshape, and polish text · use for writing assist · helps users edit without leaving page', tag: 'Origin trial', tone: 'slate' },
    ],
    links: [
      { label: 'Built-in AI APIs overview', url: 'https://developer.chrome.com/docs/ai/built-in-apis' },
      { label: 'Prompt API', url: 'https://developer.chrome.com/docs/ai/prompt-api' },
    ],
    notes: [
      'Be transparent: “four jobs” was my earlier framing for the talk narrative. The APIs themselves are the real source of truth; this slide covers them directly.',
      'Language Detector/Translator: narrow, great for multilingual UX. Summarizer: narrow task-specific model, good for condensing. Prompt API: most flexible; use responseConstraint for structured extraction. Writer/Rewriter/Proofreader: writing-assist APIs, currently origin trial / check availability.',
      'Rule of thumb: prefer the narrowest API that fits the job. Use Prompt API when the task is custom or needs schema-constrained output.',
    ],
  },
  {
    id: 'shape',
    kind: 'code',
    kicker: '',
    title: 'One shape across APIs',
    seconds: 70,
    code: `// 1) Check support for the exact options you'll use
const state = await Summarizer.availability(options);
// 'unavailable' | 'downloadable' | 'downloading' | 'available'

// 2) Create a session after a user gesture
if (state === 'available') {
  const session = await Summarizer.create(options);

  // 3) Call the task — stream when possible
  for await (const chunk of session.summarizeStreaming(text)) {
    output.textContent += chunk; // text, never innerHTML
  }
} else {
  showHonestFallback(state); // cloud, server, or reduced UX
}`,
    codeSteps: [
      { lines: [1, 2, 3], note: 'Probe the exact config you will use. Same options for availability() and create().' },
      { lines: [5, 6, 7, 8], note: 'Create after a user gesture. The browser owns model download/provisioning.' },
      { lines: [10, 11, 12, 13], note: 'Call the task. Stream when possible. Render text, never HTML.' },
      { lines: [14, 15, 16], note: 'No support? Be honest. Fallback, reduced UX, or cloud/hybrid.' },
    ],
    links: [
      { label: 'Summarizer API', url: 'https://developer.chrome.com/docs/ai/summarizer-api' },
      { label: 'Built-in AI best practices', url: 'https://developer.chrome.com/docs/ai/built-in' },
    ],
    notes: [
      'The shape is the same idea across APIs: check availability for your options, create a session on user gesture, call the task, handle unsupported states.',
      'Do not skip the fallback branch. That is what makes this shippable on a public site.',
      'Pass the same options to availability() and create(), otherwise you may probe a different configuration.',
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
    title: 'How to decide when to use built-in AI',
    seconds: 120,
    subtitle: 'A quick top-to-bottom decision flow.',
    branches: [
      { q: '1 · Is the task a good fit?', a: 'Narrow tasks: detect, translate, summarize, write, extract, classify. Avoid if you need latest knowledge, huge context, or highest-quality reasoning.', tone: 'cyan' },
      { q: '2 · Do constraints favor on-device?', a: 'Yes for private/sensitive data, offline, low latency, no per-call cost. No/partly means cloud or hybrid.', tone: 'green' },
      { q: '3 · Is the API available for users?', a: 'Use availability() with the same options as create(). Handle unavailable/downloadable/downloading/available honestly.', tone: 'violet' },
      { q: '4 · Which API shape fits?', a: 'Task API for narrow jobs. Prompt API for custom/structured output with responseConstraint. Add fallback when needed.', tone: 'amber' },
    ],
    links: [
      { label: 'Built-in AI APIs', url: 'https://developer.chrome.com/docs/ai/built-in-apis' },
      { label: 'Prompt API', url: 'https://developer.chrome.com/docs/ai/prompt-api' },
    ],
    notes: [
      'Separate the two questions. Running on-device vs cloud is a deployment/privacy/reach decision. Task API vs Prompt API is an API-shape decision.',
      'Task APIs are purpose-built: Translator, Language Detector, Summarizer, Writer/Rewriter/Proofreader. Prompt API is the flexible path; with responseConstraint it is great for structured extraction.',
      'You can combine them: on-device Prompt API for private extraction, cloud fallback when unavailable. Firebase AI Logic / hybrid is the practical path when reach matters.',
    ],
  },
  {
    id: 'cloud',
    kind: 'code',
    kicker: '',
    title: 'On-device is a constraint, not a religion',
    seconds: 45,
    code: `// Pick the runtime based on capability, not ideology
if (await Summarizer.availability(opts) === 'available') {
  return summarizeOnDevice(session, text);
}
// Fallback: cloud, server, or hybrid (e.g. Firebase AI Logic)
return summarizeWithCloudApi(text);`,
    codeSteps: [
      { lines: [1, 2, 3, 4], note: 'Prefer on-device when available: private, offline, low latency, no per-call cost.' },
      { lines: [5, 6], note: 'No support? Fall back honestly - cloud, server, or hybrid. Capability, not ideology.' },
    ],
    links: [
      { label: 'Firebase AI Logic hybrid', url: 'https://firebase.google.com/docs/ai-logic/hybrid-on-device-inference' },
    ],
    notes: [
      'This follows the decision slide: first decide where it should run, then make fallback explicit. Keep it short.',
      'Wins: privacy, no per-call cost, offline, low warm latency. Costs: download, disk, RAM, quality ceiling, limited reach.',
    ],
  },
  {
    id: 'audience-input',
    kind: 'demo',
    kicker: '',
    title: 'What would you build with it?',
    seconds: 120,
    subtitle: 'Tell me a use case. We’ll turn it into an on-device API plan live.',
    demo: 'demos/05-use-case/index.html',
    demoLabel: 'AUDIENCE USE CASE → PLAN',
    links: [
      { label: 'Built-in AI APIs', url: 'https://developer.chrome.com/docs/ai/built-in-apis' },
    ],
    notes: [
      'Start by asking the audience for real use cases. Type their words in first; the constraint selector is secondary.',
      'The demo uses Prompt API to draft an implementation plan (API, why, UX/fallback, first step). Treat it as a brainstorming aid and correct it live if needed.',
      'If Prompt API is unavailable, the demo still produces a deterministic local plan. Say that out loud — that’s the same progressive-enhancement pattern you want in products.',
      'GitHub Pages is static: no built-in live audience input collection. For real-time audience submissions you’d need a tiny backend/form service; for this talk, ask verbally and type selected answers.',
    ],
  },
  {
    id: 'projects',
    kind: 'projects',
    kicker: '',
    title: 'Where it shows up in real products',
    seconds: 85,
    subtitle: 'Real signals, not just demos.',
    projects: [
      {
        title: 'Chrome translation',
        line: 'Browser translation is a real, familiar on-device/user-facing translation experience',
        tag: 'Product signal',
        tone: 'green',
      },
      {
        title: 'Chrome Live Caption',
        line: 'Captions/speech features in Chrome settings show on-device ML in product UX',
        tag: 'Product signal',
        tone: 'cyan',
      },
      {
        title: 'Mastodon PRs',
        line: 'Client-side translate/detect experiments to reduce server cost',
        tag: 'Adoption signal',
        tone: 'violet',
      },
      {
        title: 'What you can ship',
        line: 'Private summaries, forms, support triage, multilingual input',
        tag: 'Opportunity',
        tone: 'amber',
      },
    ],
    links: [
      { label: 'Chrome Live Caption', url: 'https://support.google.com/chrome/answer/10538231' },
      { label: 'Use Chrome translation', url: 'https://support.google.com/chrome/answer/173424' },
      { label: 'Mastodon translate PR #35369', url: 'https://github.com/mastodon/mastodon/pull/35369' },
      { label: 'Mastodon detect PR #35345', url: 'https://github.com/mastodon/mastodon/pull/35345' },
    ],
    notes: [
      'Be precise: Chrome translation and Live Caption are real browser/product signals that users recognize; do NOT claim they are implemented with the same JS Prompt/Summarizer/Translator APIs you are teaching. They show demand for on-device/private/fast language assistance.',
      'For developer-facing “real world” usage of built-in AI APIs specifically, Mastodon PRs #35369/#35345 are adoption signals/experiments, not shipped universal support. Be careful with claims.',
      'If asked for hard production case studies using these exact web APIs, say: “I haven’t verified a strong public case study link I’m comfortable claiming on stage; I’ll use product signals + the open PRs as adoption evidence.”',
      'Ask audience: “which of these maps to your product?” then bridge to their own use case on the next slide.',
    ],
  },
  {
    id: 'interop',
    kind: 'cards',
    kicker: '',
    title: 'Standards & interop are moving',
    seconds: 95,
    subtitle: 'Ship progressively: detect capability, add fallback, watch standards.',
    cards: [
      { title: 'Chrome / Edge', sub: 'Shipping or previewing APIs', tag: 'Build now', tone: 'green' },
      { title: 'W3C WebML CG', sub: 'Incubating specs in the open', tag: 'Standard path', tone: 'cyan' },
      { title: 'Mozilla / Firefox', sub: 'Wants web-shaped, privacy-safe design', tag: 'Feedback', tone: 'amber' },
      { title: 'WebKit / Safari', sub: 'No position yet; privacy concerns raised', tag: 'Watch', tone: 'slate' },
    ],
    links: [
      { label: 'W3C WebML WG/CG', url: 'https://webmachinelearning.github.io/' },
      { label: 'Mozilla standards position', url: 'https://github.com/mozilla/standards-positions/issues/1015' },
      { label: 'WebKit standards position', url: 'https://github.com/WebKit/standards-positions/issues/339' },
    ],
    notes: [
      'Frame this as healthy standards work, not doom. Different engines have different constraints: Mozilla raised spec-shape/DOM translation concerns; WebKit raised XSLeak/privacy concerns around language-pack behavior. Those are useful critiques.',
      'Mastodon belongs in real-world adoption pressure, not as a web standards body — it is a product signal that wants client-side translation and cross-engine support.',
      'Practical takeaway: build for Chrome/Edge where available, feature-detect, use cloud/polyfill fallback, and avoid promising cross-browser support dates.',
      'If time is short, this is the first slide to trim.',
    ],
  },
  {
    id: 'close',
    kind: 'close',
    kicker: '',
    title: 'What could your app do if AI was just there?',
    seconds: 80,
    subtitle: 'Private by default. Offline when needed. No API key for the smallest useful job.',
    takeaways: ['Pick the smallest useful API', 'Design for unsupported states', 'Ship progressively'],
    links: [
      { label: 'Chrome built-in AI docs', url: 'https://developer.chrome.com/docs/ai/built-in' },
      { label: 'WebMCP', url: 'https://webmachinelearning.github.io/webmcp/' },
    ],
    notes: [
      'End on a vision, not a recap slogan. The browser can make small AI tasks cheap, private, and close to the user — if we design the fallback honestly.',
      'Next: WebMCP — apps expose tools to agents, with a human in the loop. Mention it as the emerging direction, not a promise.',
      'Point at the repo URL on the final slide once published. End the content near 25:00 so the 5-minute mobile Q&A fits inside the 30-minute slot.',
    ],
  },
  {
    id: 'thanks',
    kind: 'title',
    kicker: '',
    title: 'Thank you',
    seconds: 20,
    subtitle: 'Questions?',
    takeaways: ['Piyush Gupta'],
    notes: [
      'Pause. Invite questions. If there is no second screen, keep this slide up during Q&A.',
      'Remind them the repo/demos are public once published.',
    ],
  },
];

export const TOTAL_PLANNED = slides.reduce((sum, slide) => sum + slide.seconds, 0);
