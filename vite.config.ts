import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        deck: resolve(root, 'index.html'),
        presenter: resolve(root, 'presenter.html'),
        capabilities: resolve(root, 'demos/00-capabilities/index.html'),
        hello: resolve(root, 'demos/01-hello/index.html'),
        summarizer: resolve(root, 'demos/02-summarizer/index.html'),
        structured: resolve(root, 'demos/03-structured/index.html'),
        injection: resolve(root, 'demos/04-injection/index.html'),
      },
    },
  },
});
