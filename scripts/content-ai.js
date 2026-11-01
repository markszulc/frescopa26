export function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveSearchResult(item) {
  const data = item.data || {};
  const meta = data.metadata || {};
  const rawMeta = meta.meta && typeof meta.meta === 'object' ? meta.meta : {};
  return {
    url: meta.canonicalUrl || meta.canonical_url || meta.canonical
      || rawMeta.canonical || rawMeta['og:url'] || meta.url || meta.source || data.source || '',
    title: meta.title || rawMeta.title || data.title || '',
    description: meta.description || rawMeta.description || data.description || '',
    image: meta.image || rawMeta.image || '',
  };
}

export async function fetchSearchAnswer(baseUrl, contentSource, contentSourceType, query, signal) {
  const resp = await fetch(`${baseUrl}/gensearch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contentSource: { name: contentSource, type: contentSourceType },
      query,
    }),
  });
  if (!resp.ok) throw new Error(`Content AI request failed: ${resp.status}`);
  const data = await resp.json();
  if (typeof data.result !== 'string'
    || (data.hits != null && (!Array.isArray(data.hits)
      || data.hits.some((hit) => !hit || typeof hit !== 'object')))) {
    throw new Error('Content AI returned an invalid answer');
  }
  return data;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkifyBareUrls(html) {
  return html.split(/(<a\b[^>]*>.*?<\/a>)/g).map((part) => {
    if (/^<a\b/.test(part)) return part;
    return part.replace(/https?:\/\/[^\s<]+/g, (url) => {
      const trailingMatch = url.match(/[).,;:!?]+$/);
      const trailing = trailingMatch ? trailingMatch[0] : '';
      const cleanUrl = trailing ? url.slice(0, -trailing.length) : url;
      if (!isSafeUrl(cleanUrl)) return url;
      return `<a href="${cleanUrl}" target="_blank" rel="noopener">${cleanUrl}</a>${trailing}`;
    });
  }).join('');
}

function renderMarkdownInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label, url) => (
    isSafeUrl(url) ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : label
  ));
  return linkifyBareUrls(html);
}

export function renderMarkdownSummary(text) {
  const lines = String(text || '').split(/\r?\n/);
  let html = '';
  let listOpen = false;
  lines.forEach((line) => {
    const trimmed = line.replace(/^\s+/, '');
    if (/^[-*]\s+/.test(trimmed)) {
      if (!listOpen) {
        html += '<ul>';
        listOpen = true;
      }
      html += `<li>${renderMarkdownInline(trimmed.replace(/^[-*]\s+/, ''))}</li>`;
    } else {
      if (listOpen) {
        html += '</ul>';
        listOpen = false;
      }
      if (trimmed.length > 0) html += `<p>${renderMarkdownInline(trimmed)}</p>`;
    }
  });
  if (listOpen) html += '</ul>';
  return html;
}

export async function fetchSearchResults(
  baseUrl,
  contentSource,
  contentSourceType,
  query,
  limit,
  cursor,
  signal,
) {
  const resp = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contentSource: { name: contentSource, type: contentSourceType },
      query: { type: 'vector', text: query, options: {} },
      queryOptions: {
        pagination: {
          limit,
          ...(cursor ? { cursor } : {}),
        },
      },
    }),
  });
  if (!resp.ok) throw new Error(`Content AI search failed: ${resp.status}`);
  const data = await resp.json();
  if (!Array.isArray(data.results)
    || data.results.some((item) => !item || typeof item !== 'object')) {
    throw new Error('Content AI search returned invalid results');
  }
  return data;
}
