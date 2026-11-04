import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = new Map([
  ['/tools/experimentation-ui-tests/ui-frame.html', ['ui-frame.html', 'text/html']],
  ['/tools/experimentation-ui-tests/ui-host.html', ['ui-host.html', 'text/html']],
  ['/tools/experimentation-ui-tests/ui-browser.js', ['ui-browser.js', 'text/javascript']],
  ['/tools/experimentation-ui-tests/ui-integrated-host.html', ['ui-integrated-host.html', 'text/html']],
  ['/tools/experimentation-ui-tests/ui-integrated-browser.js', ['ui-integrated-browser.js', 'text/javascript']],
  ['/tools/experimentation-ui-tests/model-source.html', ['model-source.html', 'text/html']],
  ['/tools/plugins/experimentation/index.js', ['../plugins/experimentation/index.js', 'text/javascript']],
  ['/tools/plugins/experimentation/qa-links.js', ['../plugins/experimentation/qa-links.js', 'text/javascript']],
  ['/tools/plugins/experimentation/da-adapter.js', ['../plugins/experimentation/da-adapter.js', 'text/javascript']],
  ['/tools/plugins/experimentation/experiment-model.js', ['../plugins/experimentation/experiment-model.js', 'text/javascript']],
  ['/tools/plugins/experimentation/index.css', ['../plugins/experimentation/index.css', 'text/css']],
]);

export default async function startUiServer() {
  const server = createServer(async (request, response) => {
    const file = files.get(new URL(request.url, 'http://localhost').pathname);
    if (!file) {
      response.writeHead(404);
      response.end('Fixture route not found');
      return;
    }
    try {
      const body = await readFile(fileURLToPath(new URL(file[0], import.meta.url)));
      response.writeHead(200, { 'content-type': file[1], 'cache-control': 'no-store' });
      response.end(body);
    } catch (error) {
      response.writeHead(500);
      response.end(error.message);
    }
  });
  await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });
  return server;
}
