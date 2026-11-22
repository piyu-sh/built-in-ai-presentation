export type Column = { head: string; rows: string[][] };

export type Slide = {
  id: string;
  kind: 'title' | 'demo' | 'layers' | 'status' | 'jobs' | 'code' | 'metrics' | 'flow' | 'standards' | 'poll' | 'close';
  kicker: string;
  title: string;
  seconds: number;
  body?: string[];
  code?: string;
  demo?: string;
  demoNote?: string;
  columns?: Column[];
  notes: string[];
};

export const TOTAL_SECONDS = 20 * 60;

export const slides: Slide[] = [
  {
    id: 'title',
    kind: 'title',
    kicker: 'Conference talk · 25 minutes including Q&A',
    title: 'Built-In AI in the Browser',
    seconds: 20,
    body: [
      'Practical capabilities for modern web apps',
      'Chrome first · Edge next · honest about the rest',
    ],
    notes: [
      'Open the deck a few minutes early. If the badge says "Warm model", click it — the browser requires a user gesture for the first download.',
      'Say the contract up front: by minute 20 you will know what these APIs can do, what they cannot, and when to choose them.',
      'Do not apologise for the demo setup yet — the cold open makes the point better.',
    ],
  },
  {
    id: 'cold-open',
    kind: 'demo',
    kicker: '0:20 · Cold open',
    title: 'No key. No server. No network request.',
    seconds: 100,
    demo: 'demos/01-hello/index.html',
    demoNote: 'Three languages → detect → translate → summarize. Run it live; if the model is not resident, switch to the canned output and say so.',
    notes: [
      'Pick a French sample. Ask: "What language is this? What would it take to ship this in your app today?"',
      'Then run the three calls. Point at the code panel: same shape every time.',
      'Land the line: the browser is shipping a model as a platform primitive, like Canvas or Web Crypto.',
      'If keynote mode is on, say explicitly: "This is recorded output from this exact browser."',
    ],
  },
  {
    id: 'layers',
    kind: 'layers',
    kicker: '2:00 · The wider story, as a spine',
    title: 'Four layers of "AI in the browser"',
    seconds: 90,
    columns: [
      {
        head: 'Layer',
        rows: [
          ['1 · Browser features', 'Chrome Translate, History Search, DevTools AI; Edge Copilot; Safari Summarize. Zero API access.'],
          ['2 · Browser infrastructure', 'WebGPU, WebNN, Wasm. Bring your own model; you own the runtime.'],
          ['3 · Built-in AI APIs  ← us', 'The browser ships the model. Task APIs + Prompt API. This is the talk.'],
          ['4 · Agents / WebMCP', 'Your app registers tools; an agent calls them. Human in the loop.'],
        ],
      },
    ],
    body: [
      'Today we are firmly in layer 3 — but layers 1, 2 and 4 explain where this is going.',
      'DevTools AI and Modern Web Guidance: one line, not a section. WebMCP: closing teaser only.',
    ],
    notes: [
      'This slide answers the "should I include the wider AI in Chrome doc?" question from planning: yes as a map, no as content.',
      'Do not go deep on WebNN: Chrome is winding it down cross-platform. If someone asks, say it is being superseded and move on.',
      'The useful takeaway: these layers solve different problems and have different owners.',
    ],
  },
  {
    id: 'status',
    kind: 'status',
    kicker: '3:30 · Honest status',
    title: 'What actually ships in November 2026',
    seconds: 90,
    columns: [
      {
        head: 'Browser / API',
        rows: [
          ['Chrome 138+', 'Translator, Language Detector, Summarizer — stable.'],
          ['Chrome 148+', 'Prompt API stable on the web. Sampling-mode presets; JSON Schema / RegExp constraints.'],
          ['Chrome trial only', 'Writer, Rewriter, Proofreader — developer / origin trial. Show code, do not promise.'],
          ['Edge 158+', 'Prompt API is a flag-gated preview. Model is Aion Instruct 2.3B — not Phi-4-mini.'],
          ['Firefox', 'Negative position on the Translation API spec. No built-in AI APIs.'],
          ['Safari / WebKit', 'No position yet on Translation API. No shipping plan announced.'],
        ],
      },
    ],
    body: [
      'Desktop only: no Android, no iOS. ChromeOS only on Chromebook Plus.',
      '≈22 GB free disk (>4 GB VRAM, or 16 GB RAM + 4 cores). Unmetered network for first download.',
      'Languages today: en, es, ja, de, fr. Audio input needs a GPU — so no audio demo here.',
    ],
    notes: [
      'This is the slide that earns trust. Read the hardware numbers out loud.',
      'Rehearsal fact: the model sat at "downloading" with no error until 22 GB of free space existed; provisioning then took about 7.5 minutes.',
      'Say: "Check availability() and design an honest unsupported state. Do not pretend this is universal."',
      'If challenged on Phi-4: that was in the original abstract; Edge now documents Aion Instruct 2.3B.',
    ],
  },
  {
    id: 'jobs',
    kind: 'jobs',
    kicker: '5:00 · A mental model, not a feature list',
    title: 'Four jobs you can actually ship',
    seconds: 60,
    columns: [
      {
        head: 'Job',
        rows: [
          ['Understand', 'Language Detector + Translator. Input in any supported language; one output language.'],
          ['Condense', 'Summarizer. A narrow task model, not a chatbot in disguise.'],
          ['Extract', 'Prompt API + responseConstraint. Text or image → typed object.'],
          ['Write', 'Writer / Rewriter / Proofreader. Trial only — code today, product tomorrow.'],
        ],
      },
    ],
    body: [
      'The review thread you are about to see is ONE instance of "condense" — not the thesis of the talk.',
      'Ask: which of these jobs do you have in your own product?',
    ],
    notes: [
      'This corrects the abstract: a review section is an example, not the whole story.',
      'The audience should be mapping these four jobs onto their own backlog during this slide.',
    ],
  },
  {
    id: 'shape',
    kind: 'code',
    kicker: '6:00 · One shape to remember',
    title: 'availability() → create() → call()',
    seconds: 60,
    code: `const state = await Summarizer.availability(options);
// 'unavailable' | 'downloadable' | 'downloading' | 'available'

if (state === 'available') {
  const session = await Summarizer.create(options);   // monitor download if needed
  for await (const chunk of session.summarizeStreaming(text)) {
    output.textContent += chunk;                      // text, never innerHTML
  }
} else {
  showHonestFallback(state);
}`,
    body: [
      'Same shape for all task APIs. Prompt API adds initialPrompts, expectedInputs / expectedOutputs and responseConstraint.',
      'The four availability states ARE your UI. Byte-level downloadprogress is not reliable — the browser owns the download.',
    ],
    notes: [
      'Do not skip the fallback branch. That is what makes this shippable on a public site.',
      'Pass the same options to availability() and create(), otherwise you may probe a different configuration.',
      'Need activation for the first download: trigger from a click, not on page load.',
    ],
  },
  {
    id: 'condense',
    kind: 'demo',
    kicker: '7:00 · Demo · Condense',
    title: 'You pick the summary shape',
    seconds: 180,
    demo: 'demos/02-summarizer/index.html',
    demoNote: 'Hands up → presenter clicks. QR is a placeholder. The textarea is the paste-anything fallback. Streaming is the point.',
    notes: [
      'Ask for a show of hands: one sentence, three bullets, or paragraph. Click the winning option.',
      'Point at the streaming output before it finishes; narrate what is happening.',
      'Then paste something absurd (a commit message, a recipe) to show it is a general text task.',
      'Call out the timings: create(), first token, total. Warm first token was ~0.4s on this laptop.',
      'If the model is not available, switch to keynote mode and say the output is canned from this browser.',
    ],
  },
  {
    id: 'extract',
    kind: 'demo',
    kicker: '10:00 · Demo · Extract',
    title: 'Prose in, typed object out',
    seconds: 150,
    demo: 'demos/03-structured/index.html',
    demoNote: 'Audience picks invoice vs review schema. JSON Schema goes into responseConstraint. Output rendered as key/value pairs.',
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
    kicker: '12:30 · Trade-offs, with numbers',
    title: 'Fast when warm. Not magic when cold.',
    seconds: 60,
    columns: [
      {
        head: 'Measured on the demo laptop',
        rows: [
          ['Cold create()', '3,637 ms'],
          ['Cold first token', '19,169 ms'],
          ['Warm first token', '408 ms'],
          ['Warm total (~160 chars)', '2,020 ms'],
          ['First provision', '~7.5 minutes, ~22 GB'],
        ],
      },
    ],
    body: [
      'Pre-warm once per session. Stream. Cap output length. Always have a fallback.',
      'Quality ceiling of a ~2B-class on-device model; no internet knowledge; memory and disk are shared with the OS.',
    ],
    notes: [
      'These numbers are from THIS laptop, not a benchmarketing deck. Say that.',
      'The honest position: on-device wins on privacy, latency-after-warm, and cost; loses on ceiling quality and reach.',
    ],
  },
  {
    id: 'injection',
    kind: 'demo',
    kicker: '13:30 · Trade-offs, continued',
    title: 'Translated text is not sanitized HTML',
    seconds: 60,
    demo: 'demos/04-injection/index.html',
    demoNote: 'A mistyped tag becomes a working script tag after translation. Output is shown as text only.',
    notes: [
      'Jake Archibald found that a fr→en translation of <scripte> becomes <script>. Chinese-to-English variants worked too.',
      'Never assign model output to innerHTML. Use textContent, or setHTML with a sanitizer / Trusted Types.',
      'The spec added a note via webmachinelearning/translation-api#60. This is why "text in, text out" matters.',
      'If the translator is unavailable, the demo shows the recorded output from the canned path.',
    ],
  },
  {
    id: 'decision',
    kind: 'flow',
    kicker: '14:30 · Decision framework',
    title: 'When should you reach for built-in AI?',
    seconds: 90,
    body: [
      'Sensitive data that must not leave the device?         → on-device',
      'Need it to work offline or with no per-call cost?      → on-device',
      'Narrow, repeatable job with a quality ceiling you can accept? → task API',
      'Need world knowledge, big-model reasoning, or reach on Android/iOS? → cloud or hybrid',
      'Unsupported browser or missing model? → polyfill or Firebase AI Logic fallback; degrade honestly.',
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
    kicker: '16:00 · Audience check',
    title: 'Where would you use it?',
    seconds: 60,
    body: [
      'A · Search / summarise private user content',
      'B · Form filling and extraction',
      'C · Multilingual UX',
      'D · Not yet — I need mobile and broad reach',
    ],
    notes: [
      'Hands up first. The QR panel is a placeholder for a real poll service; do not imply it works.',
      'Read the room: if most votes are D, spend a little more time on interop and hybrid.',
      'This is the mid-talk interaction beat; the fallback is that people shout a letter.',
    ],
  },
  {
    id: 'interop',
    kind: 'standards',
    kicker: '17:00 · Interop and the standards fight',
    title: 'Start with Chrome. Do not promise "coming soon".',
    seconds: 90,
    columns: [
      {
        head: 'Who',
        rows: [
          ['Mozilla', 'Negative on Translation API (standards-positions#1015). Objects to backend assumptions and wants DOM-tree translation; Bergamot powers Firefox translation today.'],
          ['WebKit', 'No position (standards-positions#339, open since 2024). Concern: language-pack downloads enable XSLeak.'],
          ['Mastodon', 'PRs #35369 / #35345 are waiting for two browser engines — a real example of the chicken-and-egg problem.'],
          ['W3C', 'Web Machine Learning Community Group; Translation + Summarizer adopted by the WebML WG.'],
        ],
      },
    ],
    body: [
      'Ship with capability detection and a fallback. Interop is a business decision, not just a browser checkbox.',
    ],
    notes: [
      'Be honest: other engines will not catch up soon. Do not imply Safari or Firefox support is imminent.',
      'The Mastodon PRs are a great "why this matters" story: server-side translation costs real money for admins.',
      'If time is short, this is the first slide to trim.',
    ],
  },
  {
    id: 'cloud',
    kind: 'code',
    kicker: '18:30 · The honest comparison',
    title: 'On-device is a constraint, not a religion',
    seconds: 30,
    code: `// Good default: try local, fall back deliberately
if (await Summarizer.availability(opts) === 'available') {
  return summarizeOnDevice(session, text);
}
return summarizeWithCloudApi(text);   // or a polyfill`,
    body: [
      'Wins: privacy, no per-call cost, offline, low warm latency.',
      'Costs: model download, disk and RAM, quality ceiling, limited platform reach.',
    ],
    notes: [
      'Keep this to 30 seconds. It is the logical conclusion of the decision slide.',
    ],
  },
  {
    id: 'close',
    kind: 'close',
    kicker: '19:00 · Close',
    title: 'The browser is becoming a runtime for AI',
    seconds: 60,
    body: [
      'Four jobs: understand · condense · extract · write.',
      'One shape: availability() → create() → call().',
      'One rule: design the unsupported state first.',
      'Next teaser: WebMCP — register tools with the browser; agents call them with a human in the loop.',
      'The deck and demos are public. Take the code, not just the ideas.',
    ],
    notes: [
      'Point at the QR / repo URL on the final slide (the repo URL can be added once published).',
      'End exactly at 20:00 so the 5-minute mobile Q&A fits inside the 25-minute slot.',
      'If Q&A is inside the 25 and you are behind, cut the interop slide or the injection demo before cutting Q&A.',
    ],
  },
];

export const TOTAL_PLANNED = slides.reduce((sum, slide) => sum + slide.seconds, 0);
