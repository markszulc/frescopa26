import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { startServer } from './server.mjs';

const run = promisify(execFile);
const chrome = process.env.CHROME_BIN || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');

async function checkBrowser(mode, failEngine = false, hostname = '127.0.0.1') {
  const server = await startServer({ failEngine });
  const profile = await mkdtemp(join(tmpdir(), 'frescopa-runtime-'));
  try {
    const args = [
      '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-extensions',
      '--blink-settings=imagesEnabled=false',
      '--window-size=1280,720', '--no-proxy-server',
      `--host-resolver-rules=MAP ${hostname} 127.0.0.1`,
      `--user-data-dir=${profile}`, '--dump-dom', '--virtual-time-budget=10000',
      `http://${hostname}:${server.address().port}/tools/experimentation-demo/browser.html?rum=off&mode=${mode}`,
    ];
    const options = { timeout: 30000, maxBuffer: 2 * 1024 * 1024 };
    let { stdout, stderr } = await run(chrome, args, options);
    // Headless Chrome includes platform-dependent browser chrome in --window-size.
    const viewportHeight = Number(stdout.match(/data-viewport-height="(\d+)"/)?.[1]);
    if (mode === 'geometry' && viewportHeight && viewportHeight !== 720) {
      const calibrated = args.map((arg) => (arg.startsWith('--window-size=')
        ? `--window-size=1280,${1440 - viewportHeight}` : arg));
      ({ stdout, stderr } = await run(chrome, calibrated, options));
    }
    const result = stdout.match(/<pre id="results">([\s\S]*?)<\/pre>/)?.[1];
    assert.ok(result, `Browser did not report a result.\n${stderr}\n${stdout}`);
    assert.match(stdout, /data-result="passed"/, result);
  } finally {
    server.closeAllConnections();
    await new Promise((accept) => { server.close(accept); });
    await rm(profile, { recursive: true, force: true });
  }
}

test('real v2 preserves site content across all four section-variant combinations', () => checkBrowser('variants'));
test('unforced visitor traffic keeps inactive helper-generated drafts on control', () => checkBrowser('inactive'));
test('preview with no experiments responds using the actual v2 config handshake', () => checkBrowser('empty'));
test('a failed engine import is reported without a fake empty config', () => checkBrowser('error', true));
test('DA preview iframe gets the real empty-config handshake', () => checkBrowser('empty', false, 'main--frescopa26--markszulc.preview.da.live'));
test('production without experiments downloads neither engine nor simulation UI', () => checkBrowser('production', true, 'main--frescopa26--markszulc.aem.live'));
test('real site headline is above the fold and Coffee card is visible after scrolling', () => checkBrowser('geometry'));
