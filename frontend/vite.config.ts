import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { readFile, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

// Development serves every widget, drafts included. Builds copy published revisions only.
const content = fileURLToPath(new URL('../build/content', import.meta.url));
const production = fileURLToPath(new URL('../build/production', import.meta.url));
const mime: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.qml': 'text/plain', '.md': 'text/plain',
};

export default defineConfig(({ command }) => ({
  base: './',
  publicDir: command === 'build' ? production : content,
  plugins: [svelte(), {
    name: 'generated-content',
    async generateBundle() {
      for (const name of ['LICENSE', 'NOTICE']) {
        this.emitFile({ type: 'asset', fileName: `${name}.txt`, source: await readFile(new URL(`../${name}`, import.meta.url), 'utf8') });
      }

      for (const font of ['faculty-glyphic', 'jetbrains-mono']) {
        this.emitFile({ type: 'asset', fileName: `licenses/${font}.txt`, source: await readFile(new URL(`./node_modules/@fontsource/${font}/LICENSE`, import.meta.url), 'utf8') });
      }
    },
    configureServer(server) {
      // Rust swaps the directory atomically. Vite's watched public-file list can
      // lose track of the new tree, so development requests resolve it on disk.
      server.middlewares.use(async (request, response, next) => {
        const url = request.url?.split('?')[0] ?? '';
        if (url !== '/catalog.json' && !url.startsWith('/revisions/')) return next();
        try {
          const path = await realpath(resolve(content, `.${decodeURIComponent(url)}`));
          if (!path.startsWith(`${content}${sep}`)) { response.writeHead(403); response.end(); return; }
          const bytes = await readFile(path);
          response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
          response.end(request.method === 'HEAD' ? undefined : bytes);
        } catch { response.writeHead(404); response.end('Content not found. Run make content and reload.'); }
      });
    },
  }],
  build: { outDir: '../dist', emptyOutDir: true, target: 'es2022', license: { fileName: 'THIRD_PARTY_LICENSES.txt' } },
  server: { port: 5175, strictPort: true, fs: { allow: ['..'] } },
  preview: { port: 4173, strictPort: true },
}));
