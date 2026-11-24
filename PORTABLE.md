# Portable deck (Node launcher)

This folder runs the built deck from a pendrive without internet access or a cloud server. It uses a tiny local web server on `127.0.0.1` so the browser gets a normal secure origin and the iframes/module assets load correctly.

## What you need

- Node.js 18+ installed on the presentation machine.
- A supported desktop Chrome / Edge with built-in AI APIs enabled for the real demos.
- The browser models already downloaded, or internet access on first run for the browser to download them. The model is **not** included in this folder.

## Contents

```text
START.bat        Windows launcher
start.sh         macOS / Linux launcher
tools/serve.mjs  zero-dependency local static server
dist/            built deck + demos
```

## Run

Windows:

```text
double-click START.bat
```

macOS / Linux:

```bash
./start.sh
```

The launcher opens:

```text
http://127.0.0.1:8080/
```

If port 8080 is busy, it tries the next few ports and prints the actual URL. Press `Ctrl+C` in the terminal to stop it.

The presenter window is at:

```text
http://127.0.0.1:8080/presenter.html
```

## Rebuild the portable folder

From the repo root:

```bash
npm run portable
```

This builds `dist/` and recreates `portable-deck/`. Copy the **whole** `portable-deck/` folder to the pendrive; do not copy only `dist/`.

## Notes

- The deck source (`deck/`, `demos/`, TypeScript, Vite config) is not needed on the pendrive.
- Use `K` for labelled canned output if the model is unavailable or too slow.
- `file://` / double-clicking `dist/index.html` is not supported; modules and demo iframes need an HTTP origin.
