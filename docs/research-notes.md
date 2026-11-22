# Research notes

Verified against primary sources in November 2026. Web search was unavailable (HTTP 402), so every claim below came from reading the spec, browser docs, standards-position repos, or vendor demos directly.

## Primary sources

- Chrome built-in AI overview: `https://developer.chrome.com/docs/ai/built-in`
- Chrome AI docs index: `https://developer.chrome.com/docs/ai`
- Prompt API spec (W3C WebML): `https://webmachinelearning.github.io/prompt-api/`
- Edge built-in AI playgrounds: `https://microsoftedge.github.io/Demos/built-in-ai/playgrounds/prompt-api/`
- Edge model on Hugging Face: `microsoft/Aion-1.0-Instruct-2.3B`
- Mozilla position on Web Translation API: `mozilla/standards-positions#1015` (June 2025; updated Dec 2025)
- WebKit position on Translation API: `WebKit/standards-positions#339` (open since Apr 2024)
- Translation security note: `webmachinelearning/translation-api#60`
- Mastodon adoption PRs: `mastodon/mastodon#35369`, `mastodon/mastodon#35345`
- W3C Web Machine Learning Community Group / WebML WG
- Google Chrome Built-in AI Challenge 2025 project gallery: `https://googlechromeai2025.devpost.com/project-gallery`

## Chrome

| Item | Status |
| --- | --- |
| Translator, Language Detector, Summarizer | Stable since Chrome 138 |
| Prompt API on the web | Stable in Chrome 148 (Extensions since 138) |
| Writer, Rewriter, Proofreader | Developer / origin trial only |
| Types | `@types/dom-chromium-ai` exists on npm |
| Fallbacks | Task API polyfill, Prompt API polyfill, Firebase AI Logic for cloud fallback |

**Hardware (critical for demos):** desktop only — Windows 10/11, macOS 13+, Linux, ChromeOS on Chromebook Plus. No Android, no iOS. ≈22 GB free on the profile volume; the model is removed below ≈10 GB. GPU strictly greater than 4 GB VRAM, or CPU path with 16 GB RAM and 4+ cores. Audio input requires a GPU. First download needs an unmetered connection. Languages: en, es, ja, de, fr.

**Common shape:** `availability(options)` → `create({monitor})` → call. States: `unavailable`, `downloadable`, `downloading`, `available`. User activation is required when the model is not yet downloaded. Debug at `chrome://on-device-internals` (Broker State tab). Pass the *same* options to `availability()` and `create()`.

**Prompt API:** `initialPrompts` (system prompt at index 0), `expectedInputs` / `expectedOutputs` with `type: text|image|audio` and `languages`, `responseConstraint` (JSON Schema or RegExp), `omitResponseConstraintInput`, `append()`, `clone()`, `destroy()`, `AbortSignal`, `contextUsage` / `contextWindow` / `contextoverflow`, `QuotaExceededError`.

Renames to respect in code written today: `inputQuota` → `contextWindow`, `measureInputUsage()` → `measureContextUsage()`, `onquotaoverflow` → `oncontextoverflow`. Raw `temperature` / `topK` / `LanguageModel.params()` are deprecated in favour of `samplingMode` presets: `most-predictable`, `predictable`, `slightly-predictable`, `balanced` (default), `slightly-creative`, `creative`, `most-creative`. The spec also has tool use (`tools`, `LanguageModelToolCall` / `ToolSuccess` / `ToolError`, open-loop) and `thinkingEffort` (`none` default, `low`, `medium`, `high`).

**Iframes:** Permissions Policy via `allow="language-model"` and `allow="translator language-detector"`. Not available in Web Workers.

## Edge

- Prompt API is a **developer preview**, flag-gated at `edge://flags` → Prompt API, Edge 158+ (Linux x64 needs 159+ and Vulkan). Check `edge://on-device-internals` → Device performance class ≥ Medium.
- The model is **Aion Instruct, 2.3B parameters** — NOT Phi-4-mini. The original session abstract's "Phi Mini-4" claim is superseded.
- Edge also documents writing assistance APIs, Decisions API, Proofreader, Language Detector, Translator.
- Hardware: Windows 10/11, macOS 13.3+, x64 Linux + Vulkan; 20 GB free; 3 GB VRAM; unmetered network. Model deleted below 5 GB free.
- Edge applies an invisible AI-generated-content watermark to Prompt API output (158+), **not applied when `responseConstraint` is used**. Disable via Settings → Copilot and AI → On-device AI, or enterprise policies `GenAILocalFoundationalModelSettings` / `ComponentUpdatesEnabled`.

## Firefox / Safari / standards

- Mozilla is **negative** on the Web Translation API spec: it assumes a translation backend and exposes model availability, download progress and quotas; Mozilla wants first-class DOM tree translation. Firefox uses local Bergamot NMT. Dec 2025: could become positive if the spec splits into basic and extension parts.
- WebKit has **no position** on the Translation API (issue open since Apr 2024). Concern: language-pack downloads enable XSLeak; a server-side approach is "essentially a fetch() wrapper". No Safari shipping plan announced.
- Jake Archibald's Jan 2026 finding (in the Mozilla thread): fr→en translation of `<scripte>console.log("hello")</scripte>` produces a working `<script>` tag; zh→en variants did too; en→fr HTML produced `<détails>`. Conclusion: HTML handling is coincidental. **Never pipe translation output into `innerHTML`.** Mitigations: `textContent`, Sanitizer API, Trusted Types, `setHTML`.
- Mastodon PRs #35369 (translation) and #35345 (language detection) are waiting for **two browser engines** to support the spec — a concrete business case (replaces paid server-side translation).
- Translation and Summarizer were adopted by the W3C WebML WG; Prompt API is implemented experimentally in both Chrome and Edge.

## Rehearsal measurements on the actual laptop

- Chrome `chrome://on-device-internals`: **Performance Class: Medium** (CPU path), capabilities Image/Audio.
- `LanguageModel.availability()` went `downloadable` → stuck `downloading` with no error because free disk space was insufficient. After freeing space, provisioning via `create()` took **452,858 ms (~7.5 min)**.
- `downloadprogress`: monitor callback fires, but byte progress events did not. Do not depend on byte progress.
- Cold: `create()` 3,637 ms; first token 19,169 ms; total 20,800 ms for 141 chars.
- Warm: `create()` 3 ms; first token 408 ms; total 2,020 ms for 161 chars.
- Edge: Performance Class High, manifest loaded, but `LanguageModel` undefined until the flag is enabled.

## Hackathon examples (useful for inspiration)

From the Google Chrome Built-in AI Challenge 2025 gallery (`googlechromeai2025.devpost.com/project-gallery`):

- **EduAdapt** (Honorable Mention): Chrome extension that reshapes webpages for ADHD/dyslexia with on-device Gemini Nano. Strong “privacy-friendly + accessibility” angle; its team learned latency is the product problem, so they streamed and cached.
- **Pet Shelter App** (Best Multimodal AI Application - Web Application): Prompt API reads pet photos, Writer generates descriptions, Proofreader cleans them, Translator localizes. Explicit graceful-degradation story: if AI is missing, the form still works.
- **The Turing Werewolf** (Honorable Mention): cloned Prompt API sessions for distinct personas, JSON schemas, structured turn-taking; its own lesson was that LLMs need structure and constraints.
- **Nutshell** (Most Helpful - Chrome Extension): hands-free browsing with head/mouth movements. Good reminder that on-device AI can be an assistive input method, not just text generation.

Use these as range-finders for what people built; do not over-claim adoption or performance numbers beyond what the project pages say.

## Do not cite

- The Perplexity case study: `developer.chrome.com/blog/perplexity-case-study` and `/docs/ai/case-studies` both 404. Unverified — do not use it as evidence.
- Do not claim Safari/Firefox support is "coming soon". It is not supported by the sources above.
