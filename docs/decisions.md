# Decisions

| Decision | Rationale |
| --- | --- |
| Web page presentation, not PPT | The demos ARE the argument. An iframe-based slide deck can run the real APIs. A data-driven deck (`deck/slides.ts`) can be exported to slides later with a script. |
| TypeScript + Vite, multi-page build | User works in TS. Each demo is a standalone page reachable from the deck and directly shareable. Relative `base: './'` works on GitHub Pages. |
| Monorepo `demos/`, `deck/`, `docs/` | One repo, one deploy, no package boundaries to manage. |
| 25 minutes content + 5 minutes Q&A | The session is 30 minutes including Q&A. Timing is implicit to the audience, so it lives only in speaker material. |
| Clean audience view by default | No top bar, progress, timer, notes, or navigation controls. A conference audience should see slides, not an application chrome. |
| Hidden presenter drawer + optional synced window | Works with two monitors via `presenter.html`; works with a duplicated display by keeping the drawer closed and navigating by keyboard. |
| “Canned output” instead of “keynote mode” | The old label was unclear. The new name says exactly what it does: recorded demo results when the live model is unavailable or slow. |
| Visual slides; prose moved to notes | The feedback was that the deck was too wordy. On-screen content is now cards, numbers, code, and a single headline per slide. |
| Four jobs as the spine | A single “review section” story would let people dismiss the talk by dismissing the use case. Instead: understand / condense / extract / write. Review summarization is one example of condense. |
| Wider “AI in Chrome” as a four-layer map, not content | Answers the docs question honestly while keeping the talk about built-in APIs. DevTools AI = one line; WebMCP = teaser; WebNN omitted or noted as winding down. |
| Chrome first, Edge second, honest on Firefox/WebKit | Matches the user's ask and the actual state of the platforms. No “coming soon” claims. |
| Edge model described as Aion Instruct 2.3B | Supersedes the abstract's Phi-4-mini claim. |
| No audio demo | Audio input requires a GPU; the demo machine is on the CPU path. |
| Code on screen next to live output | Developer conference; showing the API shape is the enablement goal. No live typing. |
| Audience interaction staged by risk | Hands-up baseline always works; paste-anything textarea is the inclusive fallback. The QR placeholder was removed from the audience view. |
| Pre-warm on deck load, with a manual button | Warm first token 408 ms vs cold 19,169 ms on the demo laptop. The first download needs a user gesture, so the button lives in presenter material. |
| Streaming everywhere | The output arrives visibly while you narrate; hides latency and demonstrates the real API. |
| Four `availability()` states are the UI | Byte-level `downloadprogress` did not fire reliably on the test machine. |
| Canned fallback in every demo | Public repo on Pages will be viewed from unsupported browsers and machines without the model. Degrade honestly; label recorded output. |
| Hackathon examples as one visual beat | Real winners widen the audience's imagination beyond “chatbot” without adding a second talk. Uses the Chrome Built-in AI Challenge 2025 gallery. |
| Synthetic review data only | Nothing private or copyright-sensitive in a public repo. |
| `textContent` only for model output | Translation output can become working HTML; never assign it to `innerHTML`. |
| No Perplexity case study | Both candidate URLs 404'd. Unverified evidence stays out. |
