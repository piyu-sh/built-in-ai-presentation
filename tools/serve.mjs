import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const noOpen = args.includes('--no-open') || process.env.NO_OPEN === '1';
const rootArg = args.find((arg) => !arg.startsWith('--'));
const root = resolve(rootArg ?? join(here, '..', 'dist'));
const host = '127.0.0.1';
const startPort = Number(process.env.PORT ?? 8080);
const maxPort = startPort + 20;

if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`Portable deck root not found: ${root}`);
  console.error('Build first with `npm run build`, or pass a folder: node tools/serve.mjs dist');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function openBrowser(url) {
  if (noOpen) return;
  const opts = { stdio: 'ignore', detached: true };
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], opts).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], opts).unref();
    } else {
      spawn('xdg-open', [url], opts).unref();
    }
  } catch {
    // Opening the browser is a convenience; the URL is printed below.
  }
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', `http://${host}`).pathname);
  } catch {
    send(res, 400, 'Bad request');
    return;
  }
  if (pathname.includes('\0')) {
    send(res, 400, 'Bad request');
    return;
  }

  let relative = normalize(pathname).replace(/^[/\\]+/, '');
  if (relative === '' || relative.endsWith(sep)) relative = join(relative, 'index.html');

  const requested = resolve(root, relative);
  if (requested !== root && !requested.startsWith(root + sep)) {
    send(res, 403, 'Forbidden');
    return;
  }

  let target = requested;
  if (!existsSync(target)) {
    const withHtml = `${requested}.html`;
    if (!existsSync(withHtml)) {
      send(res, 404, `Not found: ${pathname}`);
      return;
    }
    target = withHtml;
  }
  if (statSync(target).isDirectory()) target = join(target, 'index.html');

  res.writeHead(200, {
    'Content-Type': types[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') res.end();
  else createReadStream(target).pipe(res);
});

function listen(port) {
  return new Promise((done, fail) => {
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE' && port < maxPort) {
        server.removeAllListeners('listening');
        done(listen(port + 1));
      } else {
        fail(error);
      }
    });
    server.listen(port, host, () => done(port));
  });
}

try {
  const port = await listen(startPort);
  const url = `http://${host}:${port}/`;
  console.log(`Portable deck: ${url}`);
  console.log(`Presenter:     ${url}presenter.html`);
  console.log(`Root:          ${root}`);
  console.log('Press Ctrl+C to stop.');
  openBrowser(url);
} catch (error) {
  console.error(`Could not start portable deck: ${error.message}`);
  process.exit(1);
}
