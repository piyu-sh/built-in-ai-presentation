import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const dist = join(repo, 'dist');
const out = join(repo, 'portable-deck');

try {
  const info = await stat(dist);
  if (!info.isDirectory()) throw new Error('dist is not a directory');
} catch {
  console.error('No built dist/ found. Run `npm run build` first.');
  process.exit(1);
}

await mkdir(join(out, 'tools'), { recursive: true });

try {
  await rm(join(out, 'dist'), { recursive: true, force: true });
} catch {
  console.warn('Could not clear the old portable dist folder (it may be open); copying over it instead.');
}

await cp(dist, join(out, 'dist'), { recursive: true });
await cp(join(here, 'serve.mjs'), join(out, 'tools', 'serve.mjs'));
await cp(join(repo, 'START.bat'), join(out, 'START.bat'));
await cp(join(repo, 'start.sh'), join(out, 'start.sh'));
await cp(join(repo, 'PORTABLE.md'), join(out, 'PORTABLE.md'));

console.log(`Portable deck created: ${out}`);
console.log('Copy that whole folder to the pendrive, then run START.bat (Windows) or ./start.sh (mac/Linux).');
