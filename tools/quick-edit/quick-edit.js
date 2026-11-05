const importMap = {
  imports: {
    'da-lit': 'https://da.live/deps/lit/dist/index.js',
    'da-y-wrapper': 'https://da.live/deps/da-y-wrapper/dist/index.js',
  },
};

let bootstrap;

export function addImportmap() {
  const imports = { ...importMap.imports };
  document.querySelectorAll('script[type="importmap"]').forEach((script) => {
    try {
      Object.keys(JSON.parse(script.textContent).imports || {}).forEach((key) => {
        delete imports[key];
      });
    } catch {
      // Leave malformed existing maps for the browser to report.
    }
  });
  if (!Object.keys(imports).length) return;
  const importmapEl = document.createElement('script');
  importmapEl.type = 'importmap';
  importmapEl.textContent = JSON.stringify({ imports });
  document.head.appendChild(importmapEl);
}

async function loadModule(origin, payload) {
  const [{ loadPage }, { default: loadQuickEdit }] = await Promise.all([
    // eslint-disable-next-line import/no-cycle
    import('../../scripts/scripts.js'),
    import(`${origin}/nx/public/plugins/quick-edit/quick-edit.js`),
  ]);
  await loadQuickEdit(payload, loadPage);
}

function generateSidekickPayload() {
  let { hostname } = window.location;
  if (hostname === 'localhost') {
    hostname = document.querySelector('meta[property="hlx:proxyUrl"]').content;
  }
  const parts = hostname.split('.')[0].split('--');
  const [, repo, owner] = parts;

  return {
    detail: {
      config: {
        mountpoint: `https://content.da.live/${owner}/${repo}/`,
      },
      location: {
        pathname: window.location.pathname,
      },
    },
  };
}

export default function init(payload) {
  if (bootstrap) return bootstrap;
  const { search } = window.location;
  const ref = new URLSearchParams(search).get('quick-edit');
  let origin;
  if (ref === 'on' || !ref) origin = 'https://da.live';
  if (ref === 'local') origin = 'http://localhost:6456';
  if (!origin) origin = `https://${ref}--da-nx--adobe.aem.live`;
  addImportmap();
  bootstrap = loadModule(origin, payload || generateSidekickPayload()).catch((error) => {
    bootstrap = undefined;
    throw error;
  });
  return bootstrap;
}
