# Decisions

| Decision | Rationale |
| --- | --- |
| Web page presentation, not PPT | The demos ARE the argument. An iframe-based slide deck can run the real APIs. A data-driven deck (`deck/slides.ts`) can be exported to slides later with a script. |
| TypeScript + Vite, multi-page build | User works in TS. Each demo is a standalone page reachable from the deck and directly shareable. Relative `base: './'` works on GitHub Pages. |
| Monorepo `demos/`, `deck/`, `docs/` | One repo, one deploy, no package boundaries to manage. |
| 20 minutes content + 5 minutes Q&A | The Q&A slot is part of the 25 minutes, not an afterthought. |
| Four jobs as the spine | A single "review section" story would let people dismiss the talk by dismissing the use case. Instead: understand / condense / extract / write. Review summarization is one example of condense. |
| Wider "AI in Chrome" as a four-layer map, not content | Answers the docs question honestly while keeping the talk about built-in APIs. DevTools AI = one line; WebMCP = teaser; WebNN omitted or noted as winding down. |
| Chrome first, Edge second, honest on Firefox/WebKit | Matches the user's ask and the actual state of the platforms. No "coming soon" claims. |
| Edge model described as Aion Instruct 2.3B | Supersedes the abstract's Phi-4-mini claim. |
| No audio demo | Audio input requires a GPU; the demo machine is on the CPU path. |
| Code on screen next to live output | Developer conference; showing the API shape is the enablement goal. No live typing. |
| Audience interaction staged by risk | Hands-up baseline always works; QR is a labelled placeholder; paste-anything textarea is the inclusive fallback. |
| Pre-warm on deck load | Warm first token 408 ms vs cold 19,169 ms on the demo laptop. |
| Streaming everywhere | The output arrives visibly while you narrate; hides latency and demonstrates the real API. |
| Four `availability()` states are the UI | Byte-level `downloadprogress` did not fire reliably on the test machine. |
| Canned fallback in every demo + keynote mode | Public repo on Pages will be viewed from unsupported browsers and machines without the model. Degrade honestly; label recorded output. |
| Synthetic review data only | Nothing private or copyright-sensitive in a public repo. |
| `textContent` only for model output | Translation output can become working HTML; never assign it to `innerHTML`. |
| No Perplexity case study | Both candidate URLs 404'd. Unverified evidence stays out. |
