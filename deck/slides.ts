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
  url?: string;
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
    title: 'Guess what this cost me.',
    seconds: 110,
    subtitle: 'Detect. Translate. Summarize. What would the API bill be?',
    demo: 'demos/01-hello/index.html',
    demoLabel: 'MYSTERY · DETECT → TRANSLATE → SUMMARIZE',
    notes: [
      'Frame it as a mystery before touching the demo: "If I built these three tiny features with a hosted API — language detection, translation, summarization — what tokens would it burn? What would the server integration cost? What did it cost me?"',
      'Take one guess from the room. Do not give a number; let them anchor. Then pick a French sample and ask what language it is.',
      'Run the three calls. Point at the code panel: same shape every time.',
      'Reveal the title from the old version: "No key. No server. No network request." Zero per-call cost; the only one-off cost was the model already on the device.',
      'Land the line: the browser is shipping a model as a platform primitive, like Canvas or Web Crypto.',
      'If Canned output is ON, say explicitly: "This is recorded output from this exact browser." Not a live model run.',
      'Chrome reports every language pair as downloadable until this page creates a translator. After Download models, Run reuses the cached session instead of re-checking availability.',
      'The iframe allow= list requests built-in AI permissions from the host page; a normal iframe cannot use these APIs silently.',
      'First-time model provisioning is a separate, one-off download. Per-call inference sends no prompt text to a server; supported languages today are en, es, ja, de, fr.',
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
    code: `// Same 4-step shape: availability → create → task call → fallback
// Swap API + task method: Summarizer · Translator · Prompt API · Writer
const API = Summarizer; // or Translator / LanguageModel / Writer
const state = await API.availability(options);
// 'unavailable' | 'downloadable' | 'downloading' | 'available'

if (state === 'available') {
  const session = await API.create(options); // user gesture

  for await (const chunk of session.summarizeStreaming(text)) { // or translateStreaming / promptStreaming
    output.textContent += chunk; // text, never innerHTML
  }
} else {
  showHonestFallback(state); // cloud, server, or reduced UX
}`,
    codeSteps: [
      { lines: [1, 2, 3, 4, 5], note: 'Same lifecycle everywhere. Swap the constructor and task method; keep the shape.' },
      { lines: [7, 8], note: 'Create after a user gesture. The browser owns model download/provisioning.' },
      { lines: [10, 11, 12], note: 'Call the task. Stream when possible. Render text, never HTML.' },
      { lines: [13, 14, 15], note: 'No support? Be honest. Fallback, reduced UX, or cloud/hybrid.' },
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
    demoLabel: 'PICK THE OUTPUT SHAPE',
    notes: [
      'Pick one shape yourself: one sentence, three bullets, or paragraph. Audience interaction lives on the final demo.',
      'Point at the streaming output before it finishes; narrate what is happening.',
      'Then paste something absurd (a commit message, a recipe) to show it is a general text task.',
      'Call out the timings: create(), first token, total. Warm first token was ~408ms vs ~19,169ms cold on the rehearsal laptop.',
      'Streaming hides latency: the UI shows tokens as they arrive instead of waiting for the full answer.',
      'This is the same shape as redBus/Miravia review summaries: narrow task, local output, optimistic UX with fallback.',
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
      'responseConstraint keeps the model inside the JSON schema; it also suppresses Edge’s invisible Prompt API watermark. This is an integration detail, not a footnote.',
      'initialPrompts[0] is the system prompt; later messages are user content. Image input uses expectedInputs with an image type — capability-check first.',
      'The raw output panel is there to debug parsing. In production, validate against the schema and never render model text as HTML.',
    ],
  },
  {
    id: 'tradeoffs',
    kind: 'metrics',
    kicker: '',
    title: 'Fast when warm. Not magic when cold.',
    seconds: 90,
    subtitle: 'Rehearsal laptop · Performance Class: Medium · ~22 GB free · not a benchmark',
    stats: [
      { value: '3.6s', label: 'Cold create()', sub: 'session setup', tone: 'amber' },
      { value: '19s', label: 'Cold first token', sub: '141-char prompt', tone: 'red' },
      { value: '0.4s', label: 'Warm first token', sub: 'same session', tone: 'green' },
      { value: '2.0s', label: 'Warm total', sub: '161 chars out', tone: 'cyan' },
      { value: '7.5m', label: 'First provision', sub: 'after freeing ~22 GB', tone: 'violet' },
    ],
    notes: [
      'Say the frame out loud: one rehearsal laptop, Performance Class Medium, ~22 GB free disk after cleanup. These are observations, not a cross-device benchmark.',
      'Cold create() 3,637ms, first token 19,169ms, total 20,800ms for 141 chars. Warm: create ~3ms, first token 408ms, total 2,020ms for 161 chars.',
      'First provision took 452,858ms (~7.5 min) after freeing ~22 GB. Treat it as browser provisioning, not a download-speed test: fetch, unpacking, verification and disk writes are included, and the browser does not expose a reliable transferred-byte number.',
      'Byte-level downloadprogress did not fire in our runs, so the four availability() states are the only honest UI signal.',
      'On-device wins on privacy, latency-after-warm and per-call cost; loses on quality ceiling, fresh knowledge and reach. ~2B-class model, no internet, disk/RAM shared with the OS.',
      'Practical rules: pre-warm once per session, stream, cap output length, always have a fallback. Do not promise these numbers to users.',
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
      'Chrome hides per-pair download status until a site creates a translator, so the demo caches the created session and reports “ready (cached)” instead of “downloadable”.',
    ],
  },
  {
    id: 'decision',
    kind: 'decision',
    kicker: '',
    title: 'How to decide when to use built-in AI',
    seconds: 120,
    subtitle: 'Start with the task, then branch by constraints and availability.',
    branches: [
      { q: 'Is it a narrow, on-device-friendly task?', a: 'Detect, translate, summarize, rewrite, extract, classify. If you need latest knowledge, huge context, or strongest reasoning: use cloud/server.', tone: 'cyan' },
      { q: 'Do privacy / offline / latency / cost matter?', a: 'Yes → built-in AI is a strong fit. No/partly → consider hybrid or cloud.', tone: 'green' },
      { q: 'Can the browser run it now?', a: 'Check availability() with same options as create(). Handle unavailable/downloadable/downloading/available.', tone: 'violet' },
      { q: 'Use cloud / hybrid fallback', a: 'Keep the feature working with server AI or recorded/canned UX when built-in AI is unavailable.', tone: 'red' },
      { q: 'Pick the API shape', a: 'Task API for narrow jobs. Prompt API for custom/structured output with responseConstraint. Always ship fallback.', tone: 'amber' },
    ],
    links: [
      { label: 'Built-in AI APIs', url: 'https://developer.chrome.com/docs/ai/built-in-apis' },
      { label: 'Prompt API', url: 'https://developer.chrome.com/docs/ai/prompt-api' },
      { label: 'Firebase AI Logic hybrid', url: 'https://firebase.google.com/docs/ai-logic/hybrid-on-device-inference' },
    ],
    notes: [
      'Walk top-to-bottom: task fit → constraints → availability → API shape. The Mermaid diagram is lazy-loaded; if it fails, a native HTML flow appears.',
      'On-device is a constraint, not a religion. Prefer local when it fits; otherwise fall back honestly to cloud/server/hybrid. Firebase AI Logic hybrid is the concrete reference.',
      'Red branch is normal, not failure: Miravia and Bright Sites use cloud while the model downloads. Hybrid is a shipping pattern.',
      'If they need latest knowledge, huge context or strongest reasoning, go cloud/server. Do not force a narrow on-device model into those jobs.',
      'Availability must use the same options as create(): unavailable / downloadable / downloading / available. Do not promise other browsers are coming soon.',
      'Task APIs are purpose-built; Prompt API is flexible, and responseConstraint is great for structured extraction. Always ship a fallback.',
      'Wins: privacy, no per-call cost, offline, good warm latency. Costs: download, disk, RAM, quality ceiling, limited reach. If on-device is unavailable, the user should still get a useful answer.',
    ],
  },
  {
    id: 'matchmaker',
    kind: 'demo',
    kicker: '',
    title: 'A conference schedule that understands your interests',
    seconds: 120,
    subtitle: 'Prompt API: sample profile + fictional schedule. Click Match to score every session on-device.',
    demo: 'demos/05-use-case/index.html',
    demoLabel: 'PROMPT API · STRUCTURED MATCHMAKER',
    links: [
      { label: 'Built-in AI APIs', url: 'https://developer.chrome.com/docs/ai/built-in-apis' },
    ],
    notes: [
      'This is a real on-device evaluation, not a static mock. The Prompt API scores every session in two small score-only calls, then asks for three highlighted reasons/questions; if that text call is unstable, the model scores stay and only the highlights fall back locally. No precomputed local scores.',
      'On landing, the full schedule is visible with empty score/reason/question cells. Click Match to fill all scores from the model; only the top 3 get reasons and attendee questions, while other rows just show shared-signal labels. Shuffle clears the cells; it does not auto-run.',
      'Start with my public LinkedIn facts, then Shuffle for fictional profiles. The prompt asks for questions from the attendee point of view — what should I do with this session? — so the audience gains something.',
      'The agenda is fictional and has no speaker names. Layout is inspired by a conference schedule, not an official clone. Nothing reads LinkedIn live; the product version would need consent.',
      'Warm-up creates the session and runs a tiny prompt so inference is resident. If the model is unavailable, downloading, or in keynote mode, the schedule fills with a clearly labelled local fallback. Keep this short.',
    ],
  },
  {
    id: 'projects',
    kind: 'projects',
    kicker: '',
    title: 'Where it shows up in real products',
    seconds: 85,
    subtitle: 'Verified case studies from Chrome’s built-in AI docs.',
    projects: [
      {
        title: 'Yahoo Taiwan Ecommerce',
        line: 'Used on-device AI for listing automation/discovery; reported listing time cut from 20 min to 2 min.',
        tag: 'Case study',
        tone: 'green',
        url: 'https://developer.chrome.com/blog/built-in-ai-ambient-intelligence',
      },
      {
        title: 'redBus & Miravia',
        line: 'Used Summarizer API to create helpful user review summaries on the client side.',
        tag: 'Case study',
        tone: 'cyan',
        url: 'https://developer.chrome.com/blog/summarizer-redbus-miravia',
      },
      {
        title: 'Policybazaar & JioHotstar',
        line: 'Used Translator + Language Detector APIs for multilingual experiences.',
        tag: 'Case study',
        tone: 'violet',
        url: 'https://developer.chrome.com/blog/pb-jiohotstar-translation-ai',
      },
      {
        title: 'CyberAgent / Bright Sites / Terra',
        line: 'Writing assistance and article summaries with Prompt/Summarizer APIs.',
        tag: 'Case study',
        tone: 'amber',
        url: 'https://developer.chrome.com/blog/prompt-api-blog-cyberagent',
      },
    ],
    links: [
      { label: 'Chrome built-in AI case studies', url: 'https://developer.chrome.com/docs/ai/built-in#case-studies' },
      { label: 'Yahoo Taiwan Ecommerce', url: 'https://developer.chrome.com/blog/built-in-ai-ambient-intelligence' },
      { label: 'redBus & Miravia summarizer', url: 'https://developer.chrome.com/blog/summarizer-redbus-miravia' },
      { label: 'Policybazaar & JioHotstar', url: 'https://developer.chrome.com/blog/pb-jiohotstar-translation-ai' },
      { label: 'CyberAgent Prompt API', url: 'https://developer.chrome.com/blog/prompt-api-blog-cyberagent' },
      { label: 'Bright Sites & Terra summaries', url: 'https://developer.chrome.com/blog/summarizer-terra-brightsites' },
    ],
    notes: [
      'All claims here come from case studies linked in Chrome’s built-in AI docs. Present them as published evidence, not universal availability.',
      'Yahoo Taiwan Ecommerce: one product photo → category, title, details, hashtags and price. Listing time 20 min → 2 min; ~3% CTR vs 1.3–1.8%; >1M interactions / 100k users. Uses a Web Component + SharedWorker because Prompt API is top-level-document only.',
      'redBus: 30M customers across 10k cities; ≤30-word positive/negative route-review summaries. Server cost was prohibitive at that volume.',
      'Miravia: summaries regenerate when rating filters change; +12.4% product-page and +3.3% sitewide conversion. It serves a server summary while the local model downloads.',
      'Policybazaar: 97M users; Finova detects Indic input then translates to English, ~2s for 1000 chars, with a typing indicator. JioHotstar: dynamic subtitle translation when original tracks are missing; checks language packs, caches translators per pair, falls back to source text.',
      'CyberAgent/Ameba Blog: extension for titles, headings, next paragraphs and copy edits; tested with select bloggers. Invalid JSON/Markdown and context limits motivated responseConstraint.',
      'Bright Sites/Flow: 150+ titles, prefs in IndexedDB, explicit consent before multi-GB download, Underground offline value. Terra: 50M+ visitors, pt→en summarize→translate back, journalists edit the result.',
      'Caution: published examples using innerHTML are NOT our rule — use textContent. topK/temperature are superseded by samplingMode. No Perplexity case study; hackathon examples are range-finders only.',
    ],
  },
  {
    id: 'status',
    kind: 'cards',
    kicker: '',
    title: 'Can I ship this today?',
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
    id: 'interop',
    kind: 'cards',
    kicker: '',
    title: 'Where this is headed',
    seconds: 70,
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
      'Frame as healthy standards work, not doom. Translation and Summarizer are in W3C WebML work; Prompt API is experimental in Chrome/Edge.',
      'Mozilla is negative on the current Translation API spec: it assumes a backend and exposes availability/download/quotas. They want first-class DOM translation. Their Dec 2025 position leaves room if the spec splits.',
      'WebKit has had no position since Apr 2024. They raised XSLeak concerns and called the API essentially a fetch() wrapper. These are useful critiques, not hostility.',
      'Mastodon PRs #35369/#35345 are adoption pressure: they wait for two engines to drop paid server translation. Not a standards body, not shipped universal support.',
      'Practical takeaway: build for Chrome/Edge where available, feature-detect, use cloud/fallback, and avoid promising cross-browser dates. Keep this brief; it is the first slide to cut if time slips.',
    ],
  },
  {
    id: 'close',
    kind: 'close',
    kicker: '',
    title: 'What could your app do if AI was just there?',
    seconds: 60,
    subtitle: 'Private by default. Offline when needed. No API key for the smallest useful job.',
    takeaways: [
      'Small tasks, close to the user',
      'Local when it fits. Honest when it doesn’t.',
      'The browser is an AI runtime now',
    ],
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
