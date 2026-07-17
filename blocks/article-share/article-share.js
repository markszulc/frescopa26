/**
 * Article share row.
 *
 * Authoring model (single row, 2 cells):
 *   - cell 1: label (e.g. "Share")
 *   - cell 2: a list/paragraph of share links.
 *
 * Renders a compact "Share" label followed by the share links.
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const labelText = cells[0]?.textContent.trim() || 'Share';
  const linksCell = cells[1] || cells[0];

  const wrap = document.createElement('div');
  wrap.className = 'article-share-inner';

  const label = document.createElement('span');
  label.className = 'article-share-label';
  label.textContent = labelText;
  wrap.append(label);

  // Icons keyed by the share destination (matched from the link label).
  const icons = {
    x: '<path d="M4 4l16 16M20 4L4 20" stroke-linecap="round"></path>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6" stroke-linecap="round"></path>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-linecap="round"></path>',
  };
  const iconFor = (name) => {
    const l = name.toLowerCase();
    if (/\bx\b|twitter/.test(l)) return icons.x;
    if (/mail|email/.test(l)) return icons.email;
    if (/copy|link/.test(l)) return icons.copy;
    return '';
  };

  const links = document.createElement('div');
  links.className = 'article-share-links';

  // Labels come either as anchors or as a comma-separated text list.
  const anchors = [...linksCell.querySelectorAll('a')];
  const labels = anchors.length
    ? anchors.map((a) => (a.getAttribute('aria-label') || a.textContent).trim())
    : linksCell.textContent.split(',').map((s) => s.trim()).filter(Boolean);

  labels.forEach((name, i) => {
    const a = anchors[i] || document.createElement('a');
    if (!anchors[i]) a.href = '#';
    a.className = 'article-share-link';
    a.setAttribute('aria-label', name);
    const icon = iconFor(name);
    a.textContent = '';
    if (icon) {
      a.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${icon}</svg>`;
    } else {
      a.textContent = name;
    }
    links.append(a);
  });
  wrap.append(links);

  block.textContent = '';
  block.append(wrap);
}
