import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import createFixtures, { fixtureRoot, deliveredExport } from './fixtures.mjs';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const types = {
  '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};

// eslint-disable-next-line import/prefer-default-export
export async function startServer({ port = 0, failEngine = false } = {}) {
  let fixtures;
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    res.setHeader('Cache-Control', 'no-store');
    if (!fixtures) {
      res.writeHead(503).end('Preparing offline fixtures.');
      return;
    }
    if (pathname === '/tools/experimentation-demo/proof.json') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(fixtures.proof));
      return;
    }
    if (failEngine && pathname.startsWith('/plugins/experimentation/')) {
      res.writeHead(503).end('Deliberate loader failure for the regression test.');
      return;
    }
    if (pathname === '/tools/experimentation-demo/browser.html') {
      res.setHeader('Content-Type', 'text/html');
      res.end(`<!doctype html><html><head><title>Runtime checks</title></head><body><script type="module">
        import('/tools/experimentation-demo/browser.js').catch((error) => {
          document.documentElement.dataset.result = 'failed';
          const result = document.createElement('pre');
          result.id = 'results';
          result.textContent = error.stack;
          document.body.replaceChildren(result);
        });
      </script></body></html>`);
      return;
    }
    const name = pathname.startsWith(`${fixtureRoot}/`) ? pathname.slice(fixtureRoot.length + 1) : '';
    const content = fixtures.pages.get(name.replace(/\.plain\.html$/, ''));
    if (content) {
      res.setHeader('Content-Type', 'text/html');
      if (pathname.endsWith('.plain.html')) {
        res.end(content);
        return;
      }
      if (name === 'original' || name.endsWith('-challenger')) {
        res.end(deliveredExport(content, fixtures.head));
        return;
      }
      // The pinned engine fetches a full export and selects its first main > div.
      res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/styles/styles.css">
        <script type="module" src="/tools/experimentation-demo/preview.js"></script>
        </head><body><main>${content}</main></body></html>`);
      return;
    }
    const path = resolve(root, `.${pathname}`);
    if (!path.startsWith(`${root}${sep}`) || !/^\/(scripts|styles|blocks|plugins\/experimentation|tools\/experimentation-demo)\//.test(pathname)) {
      res.writeHead(404).end();
      return;
    }
    try {
      const body = await readFile(path);
      res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
      res.end(body);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') res.writeHead(404).end();
      else {
        console.error('Local fixture request failed:', error);
        res.writeHead(500).end('Local fixture request failed.');
      }
    }
  });
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', accept);
  });
  try {
    fixtures = await createFixtures(`http://127.0.0.1:${server.address().port}`);
  } catch (error) {
    await new Promise((accept) => { server.close(accept); });
    throw error;
  }
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startServer({ port: Number(process.env.PORT || 3001) });
  console.log(`Local runtime fixture: http://127.0.0.1:${server.address().port}${fixtureRoot}/control?rum=off`);
}
