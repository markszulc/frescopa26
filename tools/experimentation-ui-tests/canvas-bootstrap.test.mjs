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
const plugin = '/tools/plugins/experimentation/';
const files = new Map(['index.js', 'index.css', 'da-adapter.js', 'experiment-model.js', 'qa-links.js']
  .map((name) => [`${plugin}${name}`, new URL(`../plugins/experimentation/${name}`, import.meta.url)]));

// Protocol fixture only. Production bootstrap and adapter are loaded unchanged.
const sdkFixture = `
export default new Promise((resolve) => {
  window.addEventListener('message', (event) => {
    if (!event.data?.ready || !event.ports.length) return;
    event.ports[0].postMessage({ action: 'setTitle', details: document.title });
    const actions = { daFetch: async (url, options) => {
      if (options.method !== 'GET') throw new Error('Fixture refuses native writes');
      window.parent.postMessage({ type: 'fixture-read', url, method: options.method }, location.origin);
      return fetch('/fixture-source.html');
    } };
    resolve({ ...event.data, actions });
  });
  window.parent.postMessage({ type: 'fixture-sdk-ready' }, location.origin);
});`;

function hostHtml(view) {
  return `<!doctype html><html><body>
    <p>MessageChannel host fixture only. No native connection or mutation.</p>
    <iframe id="rail" title="Production rail bootstrap" src="${plugin}index.html"></iframe>
    <pre id="results">Starting</pre>
    <script>
      const frame = document.querySelector('#rail');
      const reads = [];
      let titled = false;
      const context = {
        org: 'markszulc', repo: 'frescopa26', site: 'frescopa26',
        path: '/beverages/coffee', view: '${view}',
        ref: 'plugin-ref', branch: 'main'
      };
      function ensure(value, message) { if (!value) throw new Error(message); }
      function until(check) {
        return new Promise((resolve, reject) => {
          let attempts = 0;
          const timer = setInterval(() => {
            try {
              const doc = frame.contentDocument;
              const error = doc?.querySelector('[role="alert"]');
              if (error) throw new Error(error.textContent);
              if (check(doc)) { clearInterval(timer); resolve(doc); }
              else if (++attempts > 100) throw new Error('Production bootstrap did not settle');
            } catch (error) { clearInterval(timer); reject(error); }
          }, 20);
        });
      }
      async function verify() {
        const doc = await until(doc => doc?.querySelectorAll('.variant-actions a').length === 2);
        ensure(titled, 'Transferred MessagePort was not used');
        const links = [...doc.querySelectorAll('.variant-actions a')];
        ensure(links[0].href === 'https://da.live/${view}#/markszulc/frescopa26/beverages/coffee', 'Control editor route changed');
        ensure(links[1].href === 'https://da.live/${view}#/markszulc/frescopa26/beverages/coffee-challenger', 'Challenger row route changed');
        ensure(links.every(link => link.target === '_blank' && link.rel.includes('noopener')), 'Native navigation lost rail state');
        ensure(reads.length === 1 && reads[0].url === 'https://admin.da.live/source/markszulc/frescopa26/beverages/coffee.html', 'Wrong source identity');
        doc.querySelector('[data-action="configure"]').click();
        doc.querySelector('#experiment-form').requestSubmit();
        doc.querySelector('[data-action="confirm"]').click();
        await until(doc => doc.querySelector('#metadata-text'));
        const nativeLink = doc.querySelector('dialog a');
        ensure(nativeLink.href === 'https://da.live/${view}#/markszulc/frescopa26/beverages/coffee', 'Metadata handoff route changed');
        ensure(!doc.body.textContent.includes('Verified native saved state'), 'Preparation claims a save');
        ensure(reads.every(read => read.method === 'GET'), 'Bootstrap attempted a write');
        document.querySelector('#results').textContent = 'Production ${view} bootstrap passed: transferred host context, source GET, control/challenger/native-metadata routes, no native writes.';
        document.body.dataset.result = 'passed';
      }
      window.addEventListener('message', (event) => {
        if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
        if (event.data?.type === 'fixture-read') { reads.push(event.data); return; }
        if (event.data?.type !== 'fixture-sdk-ready') return;
        const channel = new MessageChannel();
        channel.port1.onmessage = ({ data }) => {
          if (data.action === 'setTitle') titled = true;
          else throw new Error('Unexpected native host action');
        };
        frame.contentWindow.postMessage({ unrelated: true }, location.origin);
        frame.contentWindow.postMessage({ ready: true, context, project: context }, location.origin, [channel.port2]);
        verify().catch(error => {
          document.body.dataset.result = 'failed';
          document.querySelector('#results').textContent = error.stack;
        });
      });
    </script></body></html>`;
}

for (const view of ['canvas', 'edit']) {
  test(`production bootstrap accepts ${view} host-shaped MessageChannel context`, async (t) => {
    const source = (await readFile(new URL('./model-source.html', import.meta.url), 'utf8'))
      .replaceAll('/drafts/challenger', '/beverages/coffee-challenger');
    const server = createServer(async (request, response) => {
      const path = new URL(request.url, 'http://localhost').pathname;
      response.setHeader('content-type', path.endsWith('.js') ? 'text/javascript' : 'text/html');
      if (path === '/') { response.end(hostHtml(view)); return; }
      if (path === '/fixture-sdk.js') { response.end(sdkFixture); return; }
      if (path === '/fixture-source.html') { response.end(source); return; }
      try {
        if (path === `${plugin}index.html`) {
          const html = await readFile(new URL('../plugins/experimentation/index.html', import.meta.url), 'utf8');
          response.end(html.replace('<head>', '<head><script type="importmap">{"imports":{"https://da.live/nx/utils/sdk.js":"/fixture-sdk.js"}}</script>')
            .replace(/<link[^>]*href="https:[^>]*>/g, ''));
          return;
        }
        const file = files.get(path);
        if (!file) { response.writeHead(404).end(); return; }
        if (path.endsWith('.css')) response.setHeader('content-type', 'text/css');
        response.end(await readFile(file));
      } catch (error) {
        response.writeHead(500).end(error.message);
      }
    });
    const profile = await mkdtemp(join(tmpdir(), 'da-canvas-bootstrap-'));
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
      ], { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
      const result = stdout.match(/<pre id="results">([\s\S]*?)<\/pre>/)?.[1];
      assert.ok(result, `Browser did not report a bootstrap result.\n${stderr}`);
      assert.match(stdout, /data-result="passed"/, result);
      t.diagnostic(result);
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => { server.close(resolve); });
      await rm(profile, { recursive: true, force: true });
    }
  });
}
