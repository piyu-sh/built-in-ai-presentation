# Talk outline — 25 minutes content + 5 minutes Q&A

Session: **Built-In AI in the Browser: Practical Capabilities for Modern Web Apps**

The slot is 30 minutes including Q&A. The deck enforces this: slide seconds in `deck/slides.ts` total **1,500 (25:00)**. The presenter timer only appears in the hidden drawer or the separate presenter window; the audience never sees a clock, progress bar, or navigation chrome. End the content at 25:00, then take mobile Q&A for 5 minutes.

## Before you start

1. Open the deck on the demo laptop over localhost. The audience view is intentionally just the slide.
2. Press `P` and check model readiness in the drawer. If the model is not warm, click **Warm model** there — the first download needs a user gesture.
3. Decide on the display setup:
   - **Two displays:** press `W`, move the presenter window to the speaker screen, then press `P` to close the drawer on the deck.
   - **Duplicated display:** keep the presenter window closed. Navigate by keyboard and open the drawer with `P` only between beats.
4. Visit `demos/00-capabilities/index.html` and click **Run all capability probes** if anything changed on the machine. Copy the JSON.
5. Decide whether **Canned output** (`K`) is needed. If yes, every demo shows recorded output and says so.
6. Clear ≈22 GB on the Chrome profile volume. If the model is stuck at `downloading`, that is why.

## Run of show

| Time | Slide | What happens | Demo |
| --- | --- | --- | --- |
| 0:00–0:15 | `title` | Promise of the talk. No timings or controls on screen. | — |
| 0:15–2:05 | `cold-open` | Three languages → detect → translate → summarize. No key, no server, no network call. | `01-hello` |
| 2:05–3:45 | `layers` | Four layers: browser features, infrastructure, built-in APIs, agents. We are in layer 3. | — |
| 3:45–5:35 | `status` | Chrome 138/148, Edge flagged Aion 2.3B, Firefox negative, WebKit undecided, desktop-only, 22 GB. | — |
| 5:35–6:45 | `jobs` | Four jobs: understand, condense, extract, write. Ask the room which they have. | — |
| 6:45–7:55 | `shape` | `availability() → create() → call()`. Availability states are the UI. | — |
| 7:55–11:15 | `condense` | Audience votes length/format; run Summarizer with streaming; paste something unexpected. | `02-summarizer` |
| 11:15–14:15 | `extract` | Audience picks invoice vs review schema; `responseConstraint` → `JSON.parse`. | `03-structured` |
| 14:15–15:45 | `tradeoffs` | Measured cold/warm numbers; quality ceiling; disk/memory; pre-warm discipline. | — |
| 15:45–16:55 | `injection` | `<scripte>` → `<script>`; output shown as text; mitigations. | `04-injection` |
| 16:55–18:45 | `decision` | Sensitive/offline/narrow → on-device; reach/world knowledge → cloud/hybrid. | — |
| 18:45–19:45 | `poll` | Hands-up vote A–D. No QR is shown; it was only a planning placeholder. | — |
| 19:45–21:10 | `projects` | Real winners from the Chrome Built-in AI Challenge: EduAdapt, Pet Shelter App, Turing Werewolf, Nutshell. | — |
| 21:10–22:45 | `interop` | Firefox / WebKit / Mastodon / W3C. Capability detection; no “coming soon”. | — |
| 22:45–23:20 | `cloud` | On-device as a constraint, not a religion; local-first with deliberate fallback. | — |
| 23:20–25:00 | `close` | Recap four jobs, one shape, one rule; WebMCP teaser; repo URL. | — |
| 25:00–30:00 | — | Mobile Q&A. Collect questions on a phone. | — |

## Hold the line

- The review thread is **one instance of “condense”**, not the thesis. People who do not care about reviews should still get four jobs and a decision framework.
- Slides are visual. Detailed explanation belongs in the notes/presenter window, not on screen. If a slide needs a paragraph, it is wrong.
- No timing text, navigation hints, readiness badges, or speaker controls in the audience view.
- Do not claim Phi-4-mini in Edge. It is **Aion Instruct 2.3B**.
- Do not claim other browsers will catch up soon. Be honest about Firefox/WebKit positions.
- DevTools AI gets one line. WebMCP gets a closing teaser. WebNN is omitted or described as winding down cross-platform in Chrome.
- QR voting is a **placeholder that is no longer shown**. Hands-up is the real baseline; the textarea is the paste-anything fallback.
- Never put model output into `innerHTML`. The demos use `textContent` throughout.

## If you are behind

1. Cut the `injection` demo to a verbal mention (70s saved).
2. Skip the `poll` slide (60s saved).
3. Compress `interop` to two lines (45–60s saved).
4. Keep Q&A. It is part of the 30-minute slot.

## If the model is unavailable at the venue

- Press `K` to enable **Canned output**. All demos switch to recorded output from this browser and label it as such.
- Show `00-capabilities` as evidence of what the machine *can* do rather than pretending.
- Say: “This is recorded output from this exact browser on this laptop; the code you see is the code that produced it.”
