/* eslint-env node */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

const run = promisify(execFile);
const chrome = process.env.CHROME_BIN || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
const files = new Map([
  ['/tools/plugins/experimentation/da-adapter.js', new URL('../plugins/experimentation/da-adapter.js', import.meta.url)],
  ['/tools/plugins/experimentation/experiment-model.js', new URL('../plugins/experimentation/experiment-model.js', import.meta.url)],
  ['/tools/experimentation-ui-tests/adapter-model-browser.js', new URL('./adapter-model-browser.js', import.meta.url)],
  ['/tools/experimentation-ui-tests/model-source.html', new URL('./model-source.html', import.meta.url)],
]);

test('DA source model and fail-closed persistence contracts in a real DOM', async (t) => {
  const server = createServer(async (req, res) => {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(`<!doctype html><html><body><pre id="results">Starting</pre><script type="module">
        import('/tools/experimentation-ui-tests/adapter-model-browser.js').catch((error) => {
          document.documentElement.dataset.result = 'failed';
          document.getElementById('results').textContent = error.stack;
        });
      </script></body></html>`);
      return;
    }
    const file = files.get(req.url);
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    try {
      res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/html');
      res.end(await readFile(file));
    } catch (error) {
      res.writeHead(500).end(error.message);
    }
  });
  const profile = await mkdtemp(join(tmpdir(), 'da-adapter-checks-'));
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const { stdout, stderr } = await run(chrome, [
      '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-extensions', '--no-proxy-server',
      `--user-data-dir=${profile}`, '--dump-dom', '--virtual-time-budget=10000',
      `http://127.0.0.1:${server.address().port}/`,
    ], { timeout: 30000, maxBuffer: 1024 * 1024 });
    const result = stdout.match(/<pre id="results">([\s\S]*?)<\/pre>/)?.[1];
    assert.ok(result, `Browser did not report a result.\n${stderr}`);
    assert.match(stdout, /data-result="passed"/, result);
    t.diagnostic(result);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => { server.close(resolve); });
    await rm(profile, { recursive: true, force: true });
  }
});
