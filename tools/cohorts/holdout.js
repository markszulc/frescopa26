/*
 * Gallery view "Holdout": is each cohort beating the visitors who were held back on the original
 * homepage, week by week?
 *
 * Reads /cohorts/review.json (review.js output, with `weeks` per rule: cumulative bundles and goal
 * hits per arm). Until an experiment has run, it shows MOCK data built from cohorts.json (the real
 * shares and goal rates, an invented effect per rule) so the view can be designed. The mock is
 * labelled on screen and never mixed with real numbers.
 */
/* eslint-disable max-len, no-bitwise */
import { groupColor } from './model.js';

const NS = 'http://www.w3.org/2000/svg';
const LOW = 30;
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
const pct = (x, d = 1) => (x == null || Number.isNaN(x) ? '–' : `${(x * 100).toFixed(d)}%`);
const signed = (x) => (x == null || Number.isNaN(x) ? '–' : `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(0)}%`);

/* ---------- statistics (as optel-client compareProportions) ---------- */

function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

export function compare(hitA, nA, hitB, nB) {
  const rateA = nA ? hitA / nA : 0;
  const rateB = nB ? hitB / nB : 0;
  const pool = (hitA + hitB) / ((nA + nB) || 1);
  const se = Math.sqrt(pool * (1 - pool) * (1 / (nA || 1) + 1 / (nB || 1)));
  const z = se ? (rateB - rateA) / se : 0;
  const p = 2 * (1 - 0.5 * (1 + erf(Math.abs(z) / Math.SQRT2)));
  return {
    rateA, rateB, lift: rateA ? rateB / rateA - 1 : null, p, significant: p < 0.05,
  };
}

function verdictOf(id, cmp, enough, scmp) {
  if (!enough) return { key: 'wait', text: 'Not enough data yet' };
  if (id === 'none') return cmp.significant ? { key: 'bad', text: 'A/A failed: check the split' } : { key: 'ok', text: 'A/A ok' };
  if (cmp.significant) return cmp.lift > 0 ? { key: 'good', text: 'Keep: beats the holdout' } : { key: 'bad', text: 'Fix or drop: worse than the holdout' };
  if (scmp?.significant && scmp.lift > 0) return { key: 'maybe', text: 'Promising: supporting step up' };
  return { key: 'flat', text: 'No clear difference yet' };
}

/* ---------- mock ---------- */

/** A stable number in [0, 1) per string. */
function seeded(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i += 1) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return () => {
    x = Math.imul(x ^ (x >>> 15), 2246822507);
    x = Math.imul(x ^ (x >>> 13), 3266489909);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };
}

const binomial = (n, p, rnd) => {
  // normal approximation is fine for a mock
  const m = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  const u = Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
  return Math.max(0, Math.min(n, Math.round(m + sd * u)));
};

/**
 * Mock review.json: 8 weeks of an experiment holding back 20% of homepage views, sized from the
 * real weekly bundles of each rule, goal rates from today's, and an invented true effect per rule.
 */
export function mockReview(cj, rules, { weeks = 8, holdout = 0.2 } = {}) {
  // the weeks up to the end of the cohorts.json period, as if the experiment had run then
  const start = new Date(cj.meta.end);
  start.setUTCDate(start.getUTCDate() - weeks * 7 + 1);
  const perWeek = cj.meta.bundles / (cj.meta.weeks || 1);
  const ruleDef = Object.fromEntries((rules.rules || []).map((r) => [r.id, r]));
  // invented effects, biggest rules first, so the example shows every outcome
  const EFFECTS = [0.16, -0.24, 0.02, 0.3, 0.08, 0.22, 0.05];
  const bySize = [...(cj.rules || [])].sort((x, y) => (y.share || 0) - (x.share || 0)).map((x) => x.id);
  const list = [...(cj.rules || []).filter((r) => r.id !== 'none'), {
    id: 'none', label: 'No rule matched (A/A check)', experience: 'default', share: (cj.rules || []).find((r) => r.id === 'none')?.share ?? 0.2,
  }];
  const out = list.map((r) => {
    const rnd = seeded(r.id);
    const def = ruleDef[r.id] || {};
    const base = Math.min(0.6, Math.max(0.05, r.today?.goalRate ?? cj.today?.navigated ?? 0.25));
    const effect = r.id === 'none' ? 0 : EFFECTS[bySize.indexOf(r.id) % EFFECTS.length] + (rnd() - 0.5) * 0.04;
    const sbase = r.today?.supportRate ?? base / 3;
    let c = { n: 0, hit: 0, sup: 0 };
    let t = { n: 0, hit: 0, sup: 0 };
    const series = [];
    for (let w = 0; w < weeks; w += 1) {
      // 10x the sampled views of the cohorts.json period: an experiment at a higher sampling rate
      const n = Math.round(perWeek * (r.share || 0) * (0.85 + rnd() * 0.3) * 10);
      const nc = Math.round(n * holdout);
      const nt = n - nc;
      c = {
        n: c.n + nc, hit: c.hit + binomial(nc, base, rnd), sup: c.sup + binomial(nc, sbase, rnd),
      };
      t = {
        n: t.n + nt,
        hit: t.hit + binomial(nt, Math.min(0.95, base * (1 + effect)), rnd),
        sup: t.sup + binomial(nt, Math.min(0.95, sbase * (1 + effect * 1.4)), rnd),
      };
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + w * 7);
      series.push({ start: d.toISOString().slice(0, 10), control: { bundles: c.n, hits: c.hit }, cohort: { bundles: t.n, hits: t.hit } });
    }
    const cmp = compare(c.hit, c.n, t.hit, t.n);
    const scmp = def.support ? compare(c.sup, c.n, t.sup, t.n) : null;
    const enough = c.n >= LOW && t.n >= LOW;
    return {
      id: r.id,
      label: r.label,
      experience: r.experience,
      goal: def.goal || { navigate: true },
      goalLabel: def.goalLabel || (r.id === 'none' ? 'any click' : ''),
      share: r.share,
      control: { bundles: c.n, goalRate: cmp.rateA },
      cohort: { bundles: t.n, goalRate: cmp.rateB },
      lift: cmp.lift,
      p: cmp.p,
      significant: cmp.significant,
      support: scmp ? {
        label: def.supportLabel || def.support.click, control: scmp.rateA, cohort: scmp.rateB, lift: scmp.lift, p: scmp.p, significant: scmp.significant,
      } : null,
      lowSample: !enough,
      verdict: verdictOf(r.id, cmp, enough, scmp).text,
      weeks: series,
    };
  });
  const last = out[0]?.weeks.at(-1)?.start;
  const all = out.reduce((a, r) => ({ c: a.c + r.control.bundles, t: a.t + r.cohort.bundles }), { c: 0, t: 0 });
  return {
    mock: true,
    meta: {
      domain: cj.meta.domain,
      path: cj.meta.path,
      start: out[0]?.weeks[0]?.start,
      end: last,
      experiment: rules.experiment || 'homepage-cohorts',
      plannedHoldout: holdout,
      controlShare: all.c / ((all.c + all.t) || 1),
      bundles: all.c + all.t,
    },
    rules: out,
  };
}

/* ---------- view ---------- */

function chart(r, color) {
  const w = 300;
  const ht = 110;
  const pad = {
    l: 34, r: 8, t: 10, b: 20,
  };
  const pts = (r.weeks || []).map((wk) => ({
    c: wk.control.bundles ? wk.control.hits / wk.control.bundles : null,
    t: wk.cohort.bundles ? wk.cohort.hits / wk.cohort.bundles : null,
  }));
  const n = pts.length;
  const vals = pts.flatMap((p) => [p.c, p.t]).filter((v) => v != null);
  if (n < 2 || !vals.length) return h('p', 'sub', 'No weekly data.');
  const lo = Math.max(0, Math.min(...vals) - 0.05);
  const hi = Math.min(1, Math.max(...vals) + 0.05);
  const x = (i) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (ht - pad.t - pad.b);
  const line = (k) => pts.map((p, i) => (p[k] == null ? '' : `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`)).join('');
  const ticks = [lo, (lo + hi) / 2, hi];
  return svg(
    'svg',
    {
      viewBox: `0 0 ${w} ${ht}`, class: 'hchart', role: 'img', 'aria-label': `Goal rate by week: holdout ${pct(r.control.goalRate)}, cohort ${pct(r.cohort.goalRate)}`,
    },
    ticks.map((v) => svg('g', {}, svg('line', {
      x1: pad.l, x2: w - pad.r, y1: y(v), y2: y(v), class: 'grid',
    }), svg('text', {
      x: pad.l - 4, y: y(v), dy: '0.35em', class: 'tick end',
    }, `${Math.round(v * 100)}%`))),
    svg('text', { x: pad.l, y: ht - 4, class: 'tick' }, 'week 1'),
    svg('text', { x: w - pad.r, y: ht - 4, class: 'tick end' }, `week ${n}`),
    svg('path', { d: line('c'), class: 'ctl' }),
    svg('path', { d: line('t'), stroke: color, class: 'trt' }),
  );
}

function card(r, rules) {
  const color = groupColor(rules, r.experience || 'default');
  const v = verdictOf(r.id, { significant: r.significant, lift: r.lift }, !r.lowSample, r.support);
  const d = h('span', 'dot');
  d.style.setProperty('--c', color);
  const goal = r.goalLabel || r.goal?.click || (r.goal?.navigate ? 'tap through to any page' : '');
  const el = h(
    'article',
    'hcard',
    h('header', '', d, h('div', '', h('h3', '', r.label), h('p', 'sub', `${pct(r.share)} of views · goal: ${goal}`))),
    chart(r, color),
    h(
      'dl',
      'nums',
      h('div', '', h('dt', '', 'Holdout'), h('dd', '', pct(r.control.goalRate)), h('dd', 'n', `${r.control.bundles} views`)),
      h('div', '', h('dt', '', 'Cohort'), h('dd', '', pct(r.cohort.goalRate)), h('dd', 'n', `${r.cohort.bundles} views`)),
      h('div', '', h('dt', '', 'Lift'), h('dd', '', r.lowSample ? '–' : signed(r.lift)), h('dd', 'n', r.lowSample ? '' : `p ${r.p.toFixed(3)}`)),
    ),
    r.support ? h('p', 'sub', `Supporting step (${r.support.label}): ${pct(r.support.control)} → ${pct(r.support.cohort)}`) : null,
    h('p', `verdict ${v.key}`, v.text),
  );
  el.style.setProperty('--c', color);
  return el;
}

export async function loadReview(cj, rules) {
  try {
    const res = await fetch('/cohorts/review.json', { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch { /* none published */ }
  return cj?.rules ? mockReview(cj, rules) : null;
}

export default function renderHoldout(host, { review, rules }) {
  if (!review) {
    host.append(h('p', 'note', 'No review.json and no cohorts.json to build an example from.'));
    return;
  }
  const m = review.meta;
  const aa = review.rules.find((r) => r.id === 'none');
  const judged = review.rules.filter((r) => r.id !== 'none' && !r.lowSample);
  const count = (t) => judged.filter((r) => r.verdict.startsWith(t)).length;
  const head = h(
    'div',
    'flow-head',
    review.mock ? h('p', 'mock', 'Example data. No holdout has run yet: the shares and goal rates are real, the effects are invented, so you can judge the view. Publish review.json at /cohorts/review.json to replace it.') : null,
    h('h2', '', 'Cohorts against the holdout'),
    h('p', 'sub', `${m.experiment} · ${m.start} to ${m.end} · holdout ${pct(m.controlShare)}${m.plannedHoldout ? ` (planned ${pct(m.plannedHoldout, 0)})` : ''} · ${m.bundles?.toLocaleString() || '–'} sampled views. Lines: goal rate so far, grey the holdout, colour the cohort.`),
    h(
      'ul',
      'summary',
      h('li', 'good', `${count('Keep')} beat the holdout`),
      h('li', 'flat', `${count('No clear') + count('Promising')} no clear difference yet`),
      h('li', 'bad', `${count('Fix')} worse`),
      h('li', 'wait', `${review.rules.filter((r) => r.id !== 'none' && r.lowSample).length} too small to judge`),
      aa ? h('li', aa.verdict.startsWith('A/A ok') ? 'good' : 'bad', aa.verdict) : null,
    ),
  );
  const rank = (r) => ({
    Keep: 0, Fix: 1, Promising: 2, No: 3,
  })[r.verdict.split(/[ :]/)[0]] ?? 4;
  const cards = [...review.rules].filter((r) => r.id !== 'none').sort((a, b) => rank(a) - rank(b) || (b.share || 0) - (a.share || 0));
  host.append(head, h('div', 'hgrid', cards.map((r) => card(r, rules)), aa ? card(aa, rules) : null));
}
