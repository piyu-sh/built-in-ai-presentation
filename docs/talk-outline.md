# Talk outline — 20 minutes content + 5 minutes Q&A

Session: **Built-In AI in the Browser: Practical Capabilities for Modern Web Apps**

The deck enforces this timing: slide seconds in `deck/slides.ts` total 1,200. The presenter clock (`P`) shows elapsed and counts over 20:00 in red when content runs long. End at 20:00; Q&A occupies 20:00–25:00 with a mobile phone for submitted questions.

## Before you start

1. Open the deck on the demo laptop over localhost.
2. Wait for `model: warm` in the top bar (pre-warm runs on load).
3. Open `demos/00-capabilities/index.html` and click **Run all capability probes** if anything changed on the machine. Copy the JSON.
4. Decide whether keynote mode (`K`) is needed. If yes, every demo uses recorded output and says so.
5. Clear ≈22 GB on the Chrome profile volume. If the model is stuck at `downloading`, that is why.

## Run of show

| Time | Slide | What happens | Demo |
| --- | --- | --- | --- |
| 0:00–0:20 | `title` | Promise of the talk: what it can do, what it cannot, when to choose it. | — |
| 0:20–2:00 | `cold-open` | Three languages → detect → translate → summarize. No key, no server, no network call. | `01-hello` |
| 2:00–3:30 | `layers` | Four layers of "AI in the browser". We are in layer 3; layers 1/2/4 explain direction. | — |
| 3:30–5:00 | `status` | Honest status: Chrome 138/148, Edge flag-gated Aion 2.3B, Firefox negative, WebKit undecided, 22 GB / desktop-only. | — |
| 5:00–6:00 | `jobs` | Four jobs: understand, condense, extract, write. Ask the room which they have. | — |
| 6:00–7:00 | `shape` | `availability() → create() → call()`. Availability states are the UI. | — |
| 7:00–10:00 | `condense` | Audience votes length/format; run Summarizer with streaming on a synthetic review thread; paste something unexpected. | `02-summarizer` |
| 10:00–12:30 | `extract` | Audience picks invoice vs review schema; `responseConstraint` → `JSON.parse`. | `03-structured` |
| 12:30–13:30 | `tradeoffs` | Measured cold/warm numbers; quality ceiling; disk/memory; pre-warm discipline. | — |
| 13:30–14:30 | `injection` | `<scripte>` → `<script>`; output shown as text; mitigations. | `04-injection` |
| 14:30–16:00 | `decision` | Decision framework: sensitive/offline/narrow → on-device; reach/world knowledge → cloud/hybrid. | — |
| 16:00–17:00 | `poll` | Hands-up vote; QR is explicitly a placeholder. | — |
| 17:00–18:30 | `interop` | Firefox/W3C/WebKit/Mastodon; capability detection; no "coming soon". | — |
| 18:30–19:00 | `cloud` | On-device as a constraint, not a religion; local-first with deliberate fallback. | — |
| 19:00–20:00 | `close` | Recap four jobs, one shape, one rule; WebMCP teaser; repo URL. | — |
| 20:00–25:00 | — | Mobile Q&A. Collect questions on a phone. | — |

## Hold the line

- The review thread is **one instance of "condense"**, not the thesis. People who do not care about reviews should still get four jobs and a decision framework.
- Do not claim Phi-4-mini in Edge. It is **Aion Instruct 2.3B**.
- Do not claim other browsers will catch up soon. Be honest about Firefox/WebKit positions.
- DevTools AI gets one line. WebMCP gets a closing teaser. WebNN is omitted or described as winding down cross-platform in Chrome.
- QR voting is a **placeholder**. Say so. Hands-up is the real baseline; the textarea is the paste-anything fallback.
- Never put model output into `innerHTML`. The demos use `textContent` throughout.

## If you are behind

1. Cut the `injection` demo to a verbal mention (30s saved).
2. Skip the `poll` slide (60s saved).
3. Compress `interop` to two lines (60s saved).
4. Keep Q&A. It is part of the 25-minute slot.

## If the model is unavailable at the venue

- Press `K` to enable keynote mode. All demos switch to canned output from this browser and label it as such.
- Show `00-capabilities` as evidence of what the machine *can* do rather than pretending.
- Say: "This is recorded output from this exact browser on this laptop; the code you see is the code that produced it."
