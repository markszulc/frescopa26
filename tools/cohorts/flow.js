/*
 * Gallery view "Flow": how the cohorts came about, from cohorts.json (size.js output).
 *
 * - A Sankey: entry source → device → rule (first match wins) → homepage experience. Flows are
 *   coloured by the kind of signal that decides them, the experiences by their group colour (the
 *   same colour as their column in Pages). Hovering a rule or an experience lights up its path;
 *   clicking an experience opens its page in Pages.
 * - Week by week: each experience's share of homepage views per full week, and what to look at
 *   again (a rule that grows or shrinks 2x, a small rule that stands out, low samples, what no
 *   rule catches).
 */
/* eslint-disable max-len */
import { groupColor } from './model.js';

const SIG = {
  link: { label: 'Where they came from', color: '#4b75d6' },
  agent: { label: 'Personal AI agent', color: '#8a5cd6' },
  memory: { label: 'Visit memory', color: '#17a08a' },
  device: { label: 'Device', color: '#e8693c' },
  none: { label: 'No signal', color: '#9a9a9a' },
};
const NS = 'http://www.w3.org/2000/svg';
const W = 1180;
const COLX = [0, 290, 560, 900];
const BAR = 12;
const PAD = 7;
const TOP = 34;

const svg = (tag, attrs = {}, ...kids) => {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => { if (v != null) el.setAttribute(k, v); });
  kids.flat().forEach((k) => { if (k != null) el.append(k); });
  return el;
};
const h = (tag, cls, ...kids) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  kids.flat().forEach((k) => { if (k != null && k !== false) el.append(k); });
  return el;
};
const pct = (x, d) => (x == null ? '–' : `${(x * 100).toFixed(d ?? (x < 0.1 ? 1 : 0))}%`);
const expId = (nodeId) => nodeId.replace(/^x:/, '');

/** Lay out the Sankey: node boxes per column, then each link's band at both ends. */
function layout(data, height) {
  const total = data.meta.views;
  const node = {};
  data.columns.forEach((c, ci) => c.nodes.forEach((n) => {
    node[n.id] = {
      ...n, ci, out: [], in: [],
    };
  }));
  const avail = Math.min(...data.columns.map((c) => height - TOP - (c.nodes.length - 1) * PAD));
  const k = avail / total;
  data.columns.forEach((c) => {
    let y = TOP;
    c.nodes.forEach((n0) => {
      const n = node[n0.id];
      n.x = COLX[n.ci];
      n.y = y;
      n.h = Math.max(2, n.views * k);
      y += n.h + PAD;
    });
  });
  const links = data.links.filter((l) => node[l.s] && node[l.t]).map((l) => ({ ...l, w: Math.max(1, l.views * k) }));
  links.forEach((l) => { node[l.s].out.push(l); node[l.t].in.push(l); });
  Object.values(node).forEach((n) => {
    let { y } = n;
    n.out.sort((a, b) => node[a.t].y - node[b.t].y).forEach((l) => { l.sy = y; y += l.w; });
    y = n.y;
    n.in.sort((a, b) => node[a.s].y - node[b.s].y).forEach((l) => { l.ty = y; y += l.w; });
  });
  return { node, links, total };
}

function band(l, node) {
  const x0 = node[l.s].x + BAR;
  const x1 = node[l.t].x;
  const m = (x0 + x1) / 2;
  const { sy, ty, w } = l; // eslint-disable-line object-curly-newline
  return `M${x0},${sy}C${m},${sy} ${m},${ty} ${x1},${ty}L${x1},${ty + w}C${m},${ty + w} ${m},${sy + w} ${x0},${sy + w}Z`;
}

function sankey(data, rules, onPick) {
  const height = 600;
  const { node, links, total } = layout(data, height);
  const ruleExp = Object.fromEntries((rules.rules || []).map((r) => [r.id, r.experience]));
  ruleExp.none = 'default';
  const root = svg('svg', {
    viewBox: `-4 0 ${W + 8} ${height + 8}`, class: 'sankey', role: 'img', 'aria-label': 'How homepage views become cohorts',
  });
  data.columns.forEach((c, ci) => root.append(svg('text', { x: COLX[ci], y: 14, class: 'head' }, c.head)));
  const flows = svg('g', { class: 'flows' });
  links.forEach((l) => {
    const p = svg('path', {
      d: band(l, node), fill: (SIG[l.signal] || SIG.none).color, 'data-rules': (l.rules || []).join(' '),
    });
    p.append(svg('title', {}, `${node[l.s].label} → ${node[l.t].label}: ${pct(l.views / total, 1)} of views`));
    flows.append(p);
  });
  root.append(flows);
  const nodes = svg('g', { class: 'nodes' });
  Object.values(node).forEach((n) => {
    const isExp = n.id.startsWith('x:');
    const fill = isExp ? groupColor(rules, expId(n.id)) : (n.signal && SIG[n.signal]?.color) || 'var(--ink-2)';
    const lines = [n.label.replace(/^\d+ · /, ''), pct(n.views / total)];
    const g = svg(
      'g',
      { class: `node c${n.ci}${isExp ? ' exp' : ''}`, 'data-id': n.id, tabindex: n.ci >= 2 ? 0 : null },
      svg('rect', {
        x: n.x, y: n.y, width: BAR, height: n.h, fill, rx: 2,
      }),
      svg(
        'text',
        { x: n.x + BAR + 6, y: n.y + n.h / 2, dy: '0.35em' },
        svg('tspan', { class: 'nl' }, n.ci === 2 ? `${n.label.match(/^\d+/)?.[0] || ''} ${lines[0]}`.trim() : lines[0]),
        svg('tspan', { class: 'nv', dx: 6 }, lines[1]),
      ),
    );
    if (n.ci >= 2) {
      const ids = n.ci === 2
        ? [n.id.replace(/^r:/, '')]
        : Object.entries(ruleExp).filter(([, x]) => x === expId(n.id)).map(([r]) => r);
      const on = () => root.classList.add('focus') || flows.querySelectorAll('path').forEach((p) => {
        p.classList.toggle('on', p.dataset.rules.split(' ').some((r) => ids.includes(r)));
      });
      const off = () => root.classList.remove('focus');
      g.addEventListener('mouseenter', on);
      g.addEventListener('mouseleave', off);
      g.addEventListener('focus', on);
      g.addEventListener('blur', off);
      if (isExp) {
        g.classList.add('link');
        g.append(svg('title', {}, `Show the page for ${n.label}`));
        g.addEventListener('click', () => onPick(expId(n.id)));
        g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') onPick(expId(n.id)); });
      }
    }
    nodes.append(g);
  });
  root.append(nodes);
  return root;
}

function spark(values, color, max) {
  const w = 120;
  const ht = 28;
  const n = values.length;
  if (n < 2) return svg('svg', { width: w, height: ht });
  const x = (i) => (i / (n - 1)) * (w - 6) + 3;
  const y = (v) => ht - 3 - (v / max) * (ht - 6);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return svg(
    'svg',
    {
      width: w, height: ht, class: 'spark', 'aria-hidden': 'true',
    },
    svg('path', {
      d, stroke: color, fill: 'none', 'stroke-width': 2,
    }),
    svg('circle', {
      cx: x(n - 1), cy: y(values[n - 1]), r: 3, fill: color,
    }),
  );
}

/** Weekly share per experience, from the rules' full weeks over all views of that week. */
function weekly(data, rules) {
  const full = data.meta.fullWeeks || (data.today.weeks || []).length;
  const all = (data.today.weeks || []).slice(0, full);
  const ruleExp = Object.fromEntries((rules.rules || []).map((r) => [r.id, r.experience]));
  return (data.experiences || []).map((x) => {
    const rs = (data.rules || []).filter((r) => (x.id === 'default' ? !ruleExp[r.id] || r.id === 'none' : ruleExp[r.id] === x.id));
    const views = all.map((_, i) => rs.reduce((a, r) => a + ((r.weeks || [])[i] || 0), 0));
    const shares = views.map((v, i) => (all[i] ? v / all[i] : 0));
    const first = shares[0];
    const last = shares[shares.length - 1];
    return {
      ...x, shares, change: first ? last / first : null, rules: rs,
    };
  });
}

function lookAgain(data, rows) {
  const out = [];
  (data.rules || []).forEach((r) => {
    if (r.standsOut) out.push(`"${r.label}" is small (${pct(r.share, 1)}) but stands out: more engaged or growing fast. Worth its own look.`);
    if (r.growth != null && r.growth >= 2) out.push(`"${r.label}" doubled over the period (${r.growth.toFixed(1)}x): check its experience still fits a bigger group.`);
    if (r.growth != null && r.growth <= 0.5) out.push(`"${r.label}" halved over the period (${r.growth.toFixed(1)}x): is the campaign behind it over?`);
  });
  const low = (data.rules || []).filter((r) => r.lowSample).map((r) => r.label);
  if (low.length) out.push(`Too few sampled views to judge: ${low.join(', ')}.`);
  const none = rows.find((x) => x.id === 'default');
  if (none && none.share > 0.25) out.push(`${pct(none.share)} of views match no rule and get the original page. The Holdout view lists where they come from.`);
  const modelled = (data.rules || []).filter((r) => r.modelled).map((r) => r.label);
  if (modelled.length) out.push(`Estimated, not measured (visit memory is not in Optel): ${modelled.join(', ')}.`);
  return out;
}

export default function renderFlow(host, { data, rules, onPick }) {
  if (!data?.columns) {
    host.append(h('p', 'note', 'No cohorts.json published at /cohorts/cohorts.json: run size.js and publish it to see how the cohorts came about.'));
    return;
  }
  const m = data.meta;
  const legend = h('ul', 'legend', Object.values(SIG).map((s) => {
    const sw = h('span', 'sw');
    sw.style.background = s.color;
    return h('li', '', sw, s.label);
  }));
  host.append(
    h(
      'div',
      'flow-head',
      h('h2', '', 'How the cohorts came about'),
      h('p', 'sub', `${m.domain}${m.path} · ${String(m.start).slice(0, 10)} to ${String(m.end).slice(0, 10)} · ${m.bundles.toLocaleString()} sampled views (about ${m.views.toLocaleString()} views). Hover a rule or an experience to follow it; click an experience to see its page.`),
      legend,
    ),
    h('div', 'sankey-wrap', sankey(data, rules, onPick)),
  );

  const rows = weekly(data, rules);
  const max = Math.max(...rows.flatMap((r) => r.shares), 0.01);
  const full = m.fullWeeks || rows[0]?.shares.length || 0;
  const table = h('table', 'weeks');
  table.append(h('thead', '', h('tr', '', h('th', '', 'Experience'), h('th', '', `Share by week (${full} full weeks)`), h('th', 'num', 'Now'), h('th', 'num', 'Change'))));
  const body = h('tbody');
  rows.forEach((r) => {
    const color = groupColor(rules, r.id);
    const d = h('span', 'dot');
    d.style.setProperty('--c', color);
    let ch = '–';
    if (r.change != null) ch = r.change >= 1 ? `+${pct(r.change - 1, 0)}` : `−${pct(1 - r.change, 0)}`;
    const tr = h(
      'tr',
      '',
      h('td', '', d, ` ${r.label}`),
      h('td', '', spark(r.shares, color, max)),
      h('td', 'num', pct(r.shares[r.shares.length - 1])),
      h('td', `num${r.change != null && (r.change >= 1.5 || r.change <= 0.67) ? ' strong' : ''}`, ch),
    );
    body.append(tr);
  });
  table.append(body);
  const notes = lookAgain(data, rows);
  host.append(h(
    'div',
    'flow-foot',
    h('section', '', h('h3', '', 'Week by week'), table),
    h('section', '', h('h3', '', 'Look at again'), notes.length ? h('ul', 'again', notes.map((t) => h('li', '', t))) : h('p', 'sub', 'Nothing stands out this period.')),
  ));
}
