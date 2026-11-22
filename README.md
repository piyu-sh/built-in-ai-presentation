# Built-In AI in the Browser — talk deck

A 25-minute conference talk built as a web page. 20 minutes of content, 5 minutes of mobile Q&A. The deck runs real browser built-in AI APIs in iframes and degrades honestly when they are unavailable.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. **localhost is a secure context**, which these APIs require.

```bash
npm run build     # typecheck + production build to dist/
npm run preview   # serve dist/
```

## Keyboard

| Key | Action |
| --- | --- |
| `←` `→`, `Space`, `PageUp` / `PageDown` | Navigate slides |
| `Home` / `End` | First / last slide |
| `P` | Presenter view (speaker notes, next slide, planned time) |
| `K` | Keynote mode — canned output in every demo, labelled as recorded |
| `F` | Fullscreen |

## Before the talk

1. Open the deck ~5 minutes early. Chrome requires a user gesture for the first model download, so click **Warm model** in the top bar if the badge asks for it; `model: warm` confirms it finished.
2. Visit `demos/00-capabilities/index.html` → **Run all capability probes** → **Copy JSON**. This records what the machine can actually do.
3. In Chrome, check `chrome://on-device-internals`. Performance Class and the model state are the two things that matter.
4. Keep ≈22 GB free on the Chrome profile volume. A model stuck at `downloading` with no error almost always means low disk space; provisioning took ~7.5 minutes on the demo laptop.
5. In Edge, enable the flag at `edge://flags` → Prompt API (Edge 158+). The model is Aion Instruct 2.3B.

Full run of show: [`docs/talk-outline.md`](docs/talk-outline.md).

## Layout

```
index.html                 deck entry
deck/slides.ts             slide content, timings, speaker notes
deck/main.ts               renderer, navigation, presenter view, pre-warm
demos/shared/              API wrappers, timing helpers, synthetic data, styles
demos/00-capabilities/     probe every API + image modality, copy JSON
demos/01-hello/            cold open: detect → translate → summarize
demos/02-summarizer/       audience picks length/format; streaming summary
demos/03-structured/       Prompt API + JSON Schema → typed object
demos/04-injection/        translation output is not sanitized HTML
docs/                      research notes, outline, decisions
```

## Important implementation rules

- Always `await X.availability(options)` before `create(options)` — with the **same options**.
- Treat `unavailable`, `downloadable`, `downloading`, `available` as first-class UI states.
- Do not depend on byte-level download progress; the browser owns that download.
- Trigger model downloads from a user gesture; pre-warm once per browser session.
- Put API output into the DOM with `textContent`, never `innerHTML`.
- Every demo checks `keynoteMode()` and falls back to clearly-labelled canned output.

## Deploy to GitHub Pages

The included workflow (`.github/workflows/deploy.yml`) builds on push to `main` and deploys with `actions/deploy-pages`. After the first deploy: **Settings → Pages → Source: GitHub Actions**.

Because `base` is `'./'`, the built deck works from a project subpath such as `https://<user>.github.io/built-in-ai/`.

## Sources and caveats

See [`docs/research-notes.md`](docs/research-notes.md) for verified claims, primary sources, rehearsal measurements, and the list of things not to cite.
