/* eslint-disable no-await-in-loop -- Pagination offsets depend on the previous response. */
export default async function fetchSheet(path, fetcher = fetch, label = 'Sheet') {
  const rows = [];
  let total;
  do {
    const offset = rows.length;
    const url = offset ? `${path}?offset=${offset}` : path;
    const response = await fetcher(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      throw new Error(`${label} ${path} could not be loaded (HTTP ${response.status}).`);
    }
    const payload = await response.json();
    const sheet = Array.isArray(payload?.data) ? payload : payload?.data;
    if (!sheet || !Array.isArray(sheet.data)
      || !Number.isInteger(sheet.total) || sheet.total < 0 || sheet.offset !== offset
      || (total !== undefined && sheet.total !== total)
      || sheet.data.length > sheet.total - offset
      || (!sheet.data.length && offset < sheet.total)) {
      throw new Error(`${label} has invalid data or pagination; use a single sheet or a tab named data.`);
    }
    total = sheet.total;
    rows.push(...sheet.data);
  } while (rows.length < total);
  return rows;
}
