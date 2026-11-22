# Built-In AI in the Browser — talk deck

A 30-minute session: **25 minutes of content + 5 minutes of Q&A**. Built as a web page so the demos are the argument. The deck runs real browser built-in AI APIs in iframes and degrades honestly when they are unavailable.

The **audience view is clean**: no top bar, progress bar, timer, notes, or navigation controls. Speaker material lives in a hidden drawer and an optional synced presenter window.

## What's in the deck

- **Live demos**: capabilities probe, cold-open detect/translate/summarize, Summarizer, Prompt API + JSON Schema extraction, translation-injection safety, and audience use-case → plan.
- **Decision framework**: a branching flowchart for when to use built-in AI (task fit → on-device constraints → availability → API shape/fallback).
- **Real-world case studies**: verified Chrome published case studies (Yahoo Taiwan Ecommerce, redBus & Miravia, Policybazaar & JioHotstar, CyberAgent, Bright Sites & Terra).
- **Presenter tools**: hidden drawer (`P`), synced presenter window (`W`), canned-output toggle (`K`), theme toggle in presenter settings, and per-slide reference links.

## Prerequisites (for live built-in AI demos)

- **Supported browser**: recent desktop Chrome / Edge with built-in AI APIs available. Behavior varies by channel/version.
- **Hardware/resources**: desktop only for most demos; model download/provisioning may require substantial free disk (observed ~22 GB needed on rehearsal machine) and can take minutes first time.
- **User gesture + download**: model/session creation often requires a user gesture; `availability()` may return `downloadable`/`downloading`/`unavailable`. Demos include Download buttons and canned fallback.
- **Flags/settings**: depending on browser/channel, you may need flags/components enabled. Check `chrome://flags`, `chrome://on-device-internals`, and official docs. Do **not** assume APIs are enabled by default for every user.
- **Privacy/fallback**: treat unsupported states as normal product states; GitHub Pages/static deploy uses explicit fallback/canned output.

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
| `P` | Toggle the hidden presenter drawer on this display |
| `W` | Open the synced presenter window |
| `K` | Toggle **Canned output**: recorded demo results when the model is unavailable or slow |
| `F` | Fullscreen |
| `Esc` | Close the presenter drawer |

### What “Canned output” means

It is the old “keynote mode”, renamed because the old label was unclear. When ON, every demo shows recorded output captured from this same browser and says so on screen. Use it if the model is missing, still downloading, or too slow on venue Wi-Fi. It is a **fallback, not the default**.

## Presenting with one display vs two

- **Two displays / extended desktop:** press `W` and move `presenter.html` to the speaker screen. It shows notes, next slide, timer, model readiness, and navigation, and stays in sync with the audience deck.
- **Duplicated display (projector mirrors the laptop):** do **not** open the presenter window — it would appear on the projector too. Keep the deck clean, navigate with the keyboard, and open the drawer with `P` only between beats when you need a quick note.
- **No usable speaker screen at all:** bring the speaker notes on a phone or paper using [`docs/talk-outline.md`](docs/talk-outline.md). The audience view never exposes them.

## Before the talk

1. Open the deck ~5 minutes early. Press `P` and check model readiness in the drawer. Chrome requires a user gesture for the first model download, so click **Warm model** there if needed.
2. Visit `demos/00-capabilities/index.html` → **Run all capability probes** → **Copy JSON**. This records what the machine can actually do.
3. In Chrome, check `chrome://on-device-internals`. Performance Class and the model state are the two things that matter.
4. Keep ≈22 GB free on the Chrome profile volume. A model stuck at `downloading` with no error almost always means low disk space; provisioning took ~7.5 minutes on the demo laptop.
5. In Edge, enable the flag at `edge://flags` → Prompt API (Edge 158+). The model is Aion Instruct 2.3B.

Full run of show: [`docs/talk-outline.md`](docs/talk-outline.md).

## Layout

```
index.html                 audience deck entry
presenter.html             synced presenter window
deck/slides.ts             visual slide content, timings, speaker notes, links
deck/main.ts               clean renderer, navigation, hidden drawer, theme sync
deck/sync.ts               BroadcastChannel + localStorage sync, commands
deck/style.css             audience deck + drawer styles (dark/light)
presenter/                 presenter window UI, controls, references, theme toggle
demos/shared/              API wrappers, timing helpers, synthetic data, styles
demos/00-capabilities/     probe every API + image modality, copy JSON
demos/01-hello/            cold open: detect → translate → summarize
demos/02-summarizer/       audience picks length/format; streaming summary
demos/03-structured/       Prompt API + JSON Schema → typed object
demos/04-injection/        translation output is not sanitized HTML
demos/05-use-case/         audience use case → plan (Prompt API + fallback)
docs/                      research notes, outline, decisions
```

## Important implementation rules

- Always `await X.availability(options)` before `create(options)` — with the **same options**.
- Treat `unavailable`, `downloadable`, `downloading`, `available` as first-class UI states.
- Do not depend on byte-level download progress; the browser owns that download.
- Trigger model downloads from a user gesture; pre-warm once per browser session.
- Put API output into the DOM with `textContent`, never `innerHTML`.
- Every demo checks `keynoteMode()` and falls back to clearly-labelled canned output.
- No timing, navigation, or speaker text is rendered in the audience view.

## Real-world evidence

The deck’s real-world slide uses verified Chrome-published case studies linked from [Built-in AI docs](https://developer.chrome.com/docs/ai/built-in#case-studies): [Yahoo Taiwan Ecommerce](https://developer.chrome.com/blog/built-in-ai-ambient-intelligence), [redBus & Miravia](https://developer.chrome.com/blog/summarizer-redbus-miravia), [Policybazaar & JioHotstar](https://developer.chrome.com/blog/pb-jiohotstar-translation-ai), [CyberAgent](https://developer.chrome.com/blog/prompt-api-blog-cyberagent), and [Bright Sites & Terra](https://developer.chrome.com/blog/summarizer-terra-brightsites). Keep claims tied to those sources.

## Deploy to GitHub Pages

This repo includes `.github/workflows/deploy.yml` and triggers on pushes to `master`/`main` (or manual dispatch).

1. **Push to GitHub** (make sure `.github/workflows/deploy.yml` is on GitHub).
2. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `master`/`main`, or run manually from **Actions → Deploy deck to GitHub Pages → Run workflow**.
4. The site will be published at `https://<user>.github.io/<repo>/` (this build uses `base: './'`, so project subpaths work).

If you don’t see the workflow in Actions, confirm `.github/workflows/deploy.yml` exists on GitHub and that Actions are enabled for the repo.

## Sources and caveats

See [`docs/research-notes.md`](docs/research-notes.md) for verified claims, primary sources, rehearsal measurements, and the list of things not to cite.
