import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';
import startUiServer from './ui-server.mjs';

const run = promisify(execFile);
const chrome = process.env.CHROME_BIN || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');

for (const [mode, width, height] of [
  ['fixture', 320, 1000], ['fixture', 400, 1000],
  ['integrated', 320, 1000], ['integrated', 400, 1000],
  ['fixture', 320, 760], ['fixture', 400, 760],
]) {
  test(`${mode} UI workflow and failure states at ${width}x${height}px (not native DA qualification)`, async (t) => {
    const server = await startUiServer();
    const profile = await mkdtemp(join(tmpdir(), 'da-experimentation-ui-'));
    try {
      const { stdout, stderr } = await run(chrome, [
        '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
        '--disable-background-networking', '--disable-extensions', '--no-proxy-server',
        `--user-data-dir=${profile}`, '--window-size=800,1100',
        '--dump-dom', '--virtual-time-budget=10000',
        `http://127.0.0.1:${server.address().port}/tools/experimentation-ui-tests/ui-frame.html?width=${width}&height=${height}&mode=${mode}`,
      ], { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
      const result = stdout.match(/<pre id="results">([\s\S]*?)<\/pre>/)?.[1];
      assert.ok(result, `No browser result.\n${stderr}\n${stdout}`);
      assert.match(stdout, /data-result="passed"/, result);
      assert.match(result, new RegExp(`at ${width}px`), 'Chrome must use the requested panel width');
      t.diagnostic(result.split('\n')[0]);
      const geometry = stdout.match(/data-production-geometry="([^"]+)"/)?.[1];
      if (mode === 'fixture') {
        assert.ok(geometry, 'Actual application-frame geometry evidence is required');
        t.diagnostic(`Production frame geometry: ${Buffer.from(geometry, 'base64').toString('utf8')}`);
      }
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => { server.close(resolve); });
      await rm(profile, { recursive: true, force: true });
    }
  });
}
