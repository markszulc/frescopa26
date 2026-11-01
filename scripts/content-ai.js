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
