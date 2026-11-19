#!/usr/bin/env node
/*
 * Synthetic Optel bundles for the Fréscopa homepage-cohorts demo.
 *
 * Nothing here is measured. The cohort mix and behaviour are set by hand in SPEC below
 * (directionally like a premium appliance brand's landing page, lower volumes, with jitter),
 * and every bundle is drawn from a seeded random generator, so the output is reproducible.
 *
 *   node cohorts/demo-data.mjs            → cohorts/.data/home.jsonl + site.jsonl (+ frescopa-site.jsonl, the same rows)
 *   node <skills>/homepage-cohorts/scripts/size.js --rules scripts/cohort-rules.js \
 *     --bundles cohorts/.data/home.jsonl --site cohorts/.data/site.jsonl --out cohorts/cohorts.json
 *
 * Change SEED for another draw, HOME_BUNDLES / SITE_BUNDLES for volume, SPEC for the story.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = 2026;
const HOST = 'https://www.frescopa.coffee';
const WEIGHT = 100; // 1 in 100 views sampled
const HOME_BUNDLES = 1240; // ~124k homepage views in 30 days
const SITE_BUNDLES = 2900; // other pages, same period
const END = Date.parse('2026-11-18T00:00:00Z');
const DAYS = 30;

/* ---------- seeded random ---------- */
let state = SEED;
const rnd = () => {
  state += 0x6D2B79F5;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const chance = (p) => rnd() < p;
const pick = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  return pairs.find(([, w]) => (r -= w) < 0)?.[0] ?? pairs[pairs.length - 1][0];
};
const jitter = (v, by = 0.12) => v * (1 + (rnd() * 2 - 1) * by);
const id = () => Math.floor(rnd() * 36 ** 6).toString(36).padStart(6, '0');

/* ---------- the homepage: links and controls ---------- */
const LINK = {
  atelier: ['.hero a', '/machines/atelier'],
  learn: ['.columns a', '/machines/atelier'],
  machines: ['header nav a', '/machines'],
  beverages: ['header nav a', '/beverages'],
  cafe: ['.find-cafe a', '/cafe'],
  tour: ['.find-cafe a.button', '/cafe/book-atelier-tour'],
  blog: ['header nav a', '/blog'],
  account: ['header .nav-tools a.account', '/customer/login'],
  subs: ['.cards-product a', '/subscriptions'],
  offers: ['.bundle-cards a', '/offers'],
  cart: ['header .nav-tools a.cart', '/cart'],
  support: ['footer a', '/support'],
};
const CONTROL = {
  search: 'header .nav-tools button.search',
  mood: '.mood-calendar button.day',
  taste: '.taste-profile button',
  menu: 'header button.nav-hamburger',
  heroImage: '.hero picture', // a tap on the hero image, which does nothing
};
const BLOCKS = ['.hero', '.columns', '.taste-profile', '.mood-calendar', '.cards-product', '.cards-quote', '.find-cafe'];

const UA = {
  mobile: [['mobile:ios:webkit', 64], ['mobile:android:blink', 33], ['mobile:ipados:webkit', 3]],
  desktop: [['desktop:windows:blink', 55], ['desktop:mac:webkit', 24], ['desktop:mac:blink', 14], ['desktop:windows:gecko', 4], ['desktop:chromeos:blink', 3]],
};

/*
 * One row per cohort rule (ids as in scripts/cohort-rules.js).
 *   share    of homepage views, before jitter
 *   growth   last full week over the first
 *   mobile   share of the cohort on a phone
 *   ladder   [nothing, scrolled, used a control, clicked through]
 *   links    where the click-through goes;  controls: what they use on the page
 *   signal() the events that make the rule match
 */
const enter = (source = '') => ({ checkpoint: 'enter', source });
const utm = (o) => Object.entries(o).map(([k, v]) => ({ checkpoint: 'utm', source: `utm_${k}`, target: v }));
const paid = (network, param) => ({ checkpoint: 'paid', source: network, target: param });
const internalFrom = () => ({ checkpoint: 'navigate', source: `${HOST}${pick([['/machines/atelier', 30], ['/machines', 18], ['/beverages', 16], ['/cafe', 12], ['/blog', 10], ['/customer/login', 8], ['/cart', 6]])}`, target: 'visible' });
const directOrInternal = (internal) => () => [chance(internal) ? internalFrom() : enter(pick([['', 80], ['https://www.youtube.com/', 8], ['https://www.reddit.com/', 5], ['https://www.instagram.com/', 7]]))];

const SPEC = [
  {
    rule: 'personal-agent', share: 0.006, growth: 2.4, mobile: 0, ladder: [0.2, 0.1, 0.25, 0.45],
    links: [['atelier', 45], ['offers', 25], ['machines', 15], ['tour', 15]], controls: [['search', 1]],
    ua: [['bot:ai:chatgpt-agent', 55], ['bot:ai:claude-agent', 25], ['bot:ai:google-agent', 20]],
    signal: () => [enter('')],
  },
  {
    rule: 'from-email', share: 0.046, growth: 1.1, mobile: 0.68, ladder: [0.27, 0.22, 0.2, 0.31],
    links: [['subs', 30], ['account', 26], ['beverages', 22], ['offers', 10], ['support', 7], ['atelier', 5]], controls: [['mood', 3], ['taste', 2], ['search', 2], ['menu', 3]],
    signal: (mobile) => (chance(0.6)
      ? [enter(mobile ? 'android-app://com.google.android.gm/' : pick([['https://mail.google.com/', 70], ['https://mail.yahoo.com/', 18], ['https://outlook.live.com/', 12]]))]
      : [enter(''), ...utm({ source: 'newsletter', medium: 'email', campaign: pick([['this-week-for-you', 60], ['bean-reorder', 40]]) })]),
  },
  {
    rule: 'from-app', share: 0.026, growth: 1.3, mobile: 0.94, ladder: [0.12, 0.14, 0.2, 0.54],
    links: [['subs', 38], ['account', 30], ['support', 18], ['beverages', 14]], controls: [['menu', 3], ['search', 2]],
    signal: () => [enter(''), ...utm({ source: 'frescopa-app', medium: 'app' })],
  },
  {
    rule: 'campus-partner', share: 0.016, growth: 1.6, mobile: 0.72, ladder: [0.2, 0.24, 0.22, 0.34],
    links: [['offers', 52], ['atelier', 26], ['cart', 10], ['cafe', 12]], controls: [['mood', 3], ['menu', 3], ['heroImage', 2]],
    signal: () => [enter(''), ...utm({ source: 'partner', medium: 'partner', campaign: pick([['campus-fall', 70], ['student-finance', 30]]) })],
  },
  {
    rule: 'deal-sites', share: 0.014, growth: 1.2, mobile: 0.3, ladder: [0.36, 0.14, 0.14, 0.36],
    links: [['offers', 48], ['cart', 24], ['atelier', 20], ['machines', 8]], controls: [['search', 3], ['mood', 1]],
    signal: () => [enter(pick([['https://capitaloneshopping.com/', 75], ['https://www.rakuten.com/', 25]]))],
  },
  {
    rule: 'ai-referred', share: 0.019, growth: 2.3, mobile: 0.36, ladder: [0.1, 0.2, 0.22, 0.48],
    links: [['atelier', 40], ['machines', 24], ['offers', 18], ['cafe', 8], ['beverages', 6], ['cart', 4]], controls: [['taste', 3], ['mood', 3], ['search', 2]],
    signal: () => pick([
      [[enter('https://chatgpt.com/'), ...utm({ source: 'chatgpt.com' })], 62],
      [[enter('https://www.perplexity.ai/')], 14],
      [[enter('https://gemini.google.com/')], 12],
      [[enter('https://copilot.microsoft.com/')], 7],
      [[enter('https://claude.ai/')], 5],
    ]),
  },
  {
    rule: 'paid-social', share: 0.023, growth: 0.9, mobile: 0.86, ladder: [0.46, 0.26, 0.16, 0.12],
    links: [['atelier', 55], ['offers', 15], ['cafe', 15], ['beverages', 15]], controls: [['heroImage', 5], ['mood', 3], ['menu', 2]],
    signal: () => [enter(pick([['https://m.facebook.com/', 45], ['https://www.instagram.com/', 45], ['https://www.tiktok.com/', 10]])), paid('facebook', 'fbclid'), ...utm({ source: pick([['ig', 55], ['fb', 45]]), medium: 'psoc', campaign: 'atelier-launch' })],
  },
  {
    rule: 'paid-search', share: 0.212, growth: 1.5, mobile: 0.57, ladder: [0.13, 0.23, 0.36, 0.28],
    links: [['atelier', 34], ['offers', 14], ['machines', 20], ['beverages', 9], ['cafe', 7], ['cart', 6], ['account', 6], ['subs', 4]],
    controls: [['search', 9], ['heroImage', 8], ['mood', 6], ['taste', 4], ['menu', 5]],
    signal: () => {
      const bing = chance(0.16);
      const tagged = chance(0.22); // most brand ads land untagged
      return [
        enter(bing ? 'https://www.bing.com/' : 'https://www.google.com/'),
        paid(bing ? 'microsoft' : 'google', bing ? 'msclkid' : 'gclid'),
        ...(tagged ? utm({ source: bing ? 'bing' : 'google', medium: 'cpc', campaign: pick([['atelier-price', 40], ['espresso-machine', 30], ['bean-subscription', 18], ['bundle-offer', 12]]) }) : []),
      ];
    },
  },
  {
    // modelled by size.js from an account click on a view no other rule claims (desktop)
    rule: 'signed-in-before', share: 0.041, growth: 1.0, mobile: 0, ladder: [0, 0, 0, 1],
    links: [['account', 1]], controls: [], also: [['subs', 0.3], ['support', 0.12]],
    signal: directOrInternal(0.45),
  },
  {
    // modelled by size.js from a click into a product page on a view no other rule claims (desktop)
    rule: 'returning-interest', share: 0.062, growth: 1.4, mobile: 0, ladder: [0, 0, 0, 1],
    links: [['atelier', 44], ['machines', 18], ['beverages', 16], ['offers', 10], ['cafe', 12]], controls: [], also: [['cart', 0.14]],
    signal: directOrInternal(0.4),
  },
  {
    rule: 'organic-search', share: 0.034, growth: 0.9, mobile: 0.5, ladder: [0.19, 0.2, 0.27, 0.34],
    links: [['atelier', 36], ['machines', 22], ['cafe', 14], ['beverages', 12], ['offers', 8], ['account', 8]], controls: [['search', 4], ['mood', 3], ['taste', 2], ['menu', 3]],
    signal: () => [enter(pick([['https://www.google.com/', 78], ['https://www.bing.com/', 12], ['https://duckduckgo.com/', 6], ['https://search.yahoo.com/', 4]]))],
  },
  {
    rule: 'mobile-first-visit', share: 0.306, growth: 1.2, mobile: 1, ladder: [0.25, 0.27, 0.25, 0.23],
    links: [['cafe', 30], ['atelier', 24], ['beverages', 14], ['account', 12], ['machines', 9], ['cart', 6], ['tour', 5]], controls: [['menu', 12], ['heroImage', 9], ['mood', 6], ['search', 4], ['taste', 3]],
    signal: directOrInternal(0.42),
  },
  {
    // no rule: desktop, no campaign, and nothing clicked that shows an interest
    rule: 'none', share: 0.195, growth: 0.9, mobile: 0, ladder: [0.3, 0.3, 0.3, 0.1],
    links: [['blog', 70], ['cart', 30]], controls: [['search', 8], ['mood', 7], ['taste', 5], ['heroImage', 6]],
    signal: directOrInternal(0.5),
  },
];

/* ---------- bundles ---------- */
const WEEK = 7 * 864e5;
function timeFor(growth) {
  // four full weeks, then a short fifth; weight each week by the cohort's growth
  const start = END - DAYS * 864e5;
  const weeks = [0, 1, 2, 3].map((k) => [k, 1 + ((growth - 1) * k) / 3]);
  weeks.push([4, (growth * 2) / 7]);
  const k = pick(weeks);
  const span = k === 4 ? 2 * 864e5 : WEEK;
  // daytime-heavy hours
  const t = start + k * WEEK + Math.floor(rnd() * (span / 864e5)) * 864e5 + pick([[8, 6], [10, 9], [13, 9], [16, 8], [19, 10], [21, 7], [23, 3], [2, 1], [6, 3]]) * 36e5 + rnd() * 36e5;
  return new Date(Math.min(t, END - 1));
}

function bundle(url, userAgent, when, events) {
  const time = when.toISOString();
  return {
    id: id(), host: 'rum.hlx.page', time, timeSlot: `${time.slice(0, 13)}:00:00.000Z`, url, userAgent, weight: WEIGHT, events,
  };
}

const seen = (count, scrolledFar) => BLOCKS.slice(0, count).map((b, i) => ({ checkpoint: 'viewblock', source: b, timeDelta: Math.round(i === 0 ? jitter(320) : (scrolledFar ? 2200 + i * jitter(2600) : jitter(520))) }));
const clickOn = ([source, target], t) => ({ checkpoint: 'click', source, target: `${HOST}${target}`, timeDelta: Math.round(t) });
const use = (name, t) => ({ checkpoint: 'click', source: CONTROL[name], timeDelta: Math.round(t) });

function homeBundle(spec) {
  const mobile = chance(spec.mobile);
  const ua = pick(spec.ua || UA[mobile ? 'mobile' : 'desktop']);
  const level = pick(spec.ladder.map((w, i) => [i, w]));
  const events = [...spec.signal(mobile)];
  events.forEach((e) => { e.timeDelta = Math.round(jitter(180)); });
  events.push(...seen(level === 0 ? 1 : 2 + Math.floor(rnd() * 5), level > 0));
  if (level >= 2 && spec.controls.length && (level === 2 || chance(0.35))) events.push(use(pick(spec.controls), jitter(6400, 0.5)));
  if (level === 3) {
    events.push(clickOn(LINK[pick(spec.links)], jitter(11800, 0.6)));
    (spec.also || []).forEach(([name, p]) => { if (chance(p)) events.push(clickOn(LINK[name], jitter(19000, 0.4))); });
  }
  return bundle(`${HOST}/`, ua, timeFor(spec.growth), events);
}

/* Other pages: where people go after the homepage, what they do there, what precedes the cart. */
const PAGES = {
  // path: [share of arrivals from the homepage, share of other views, next clicks, cart-click rate]
  '/machines/atelier': [0.33, 0.24, [['/offers', 24], ['/cart', 14], ['/machines', 12], ['/cafe/book-atelier-tour', 9], ['/support', 4]], 0.15],
  '/machines': [0.12, 0.1, [['/machines/atelier', 46], ['/offers', 11], ['/cafe', 5]], 0.04],
  '/beverages': [0.13, 0.13, [['/subscriptions', 26], ['/cart', 17], ['/machines/atelier', 6]], 0.17],
  '/cafe': [0.14, 0.11, [['/cafe/book-atelier-tour', 31], ['/machines/atelier', 9], ['/beverages', 5]], 0.02],
  '/customer/login': [0.1, 0.09, [['/subscriptions', 33], ['/support', 15], ['/beverages', 12]], 0.05],
  '/offers': [0.07, 0.06, [['/cart', 37], ['/machines/atelier', 20], ['/cafe/book-atelier-tour', 6]], 0.37],
  '/subscriptions': [0.04, 0.07, [['/cart', 29], ['/customer/login', 14], ['/beverages', 10]], 0.29],
  '/support': [0.02, 0.06, [['/customer/login', 18], ['/subscriptions', 7]], 0.01],
  '/blog': [0.04, 0.07, [['/beverages', 12], ['/machines/atelier', 9]], 0.01],
  '/cart': [0.01, 0.05, [['/checkout', 44]], 0],
  '/cafe/book-atelier-tour': [0, 0.02, [['/machines/atelier', 10]], 0],
};
const pageNames = Object.keys(PAGES);

function siteBundle(fromHome) {
  const here = pick(pageNames.map((p) => [p, PAGES[p][fromHome ? 0 : 1]]));
  const [, , nexts] = PAGES[here];
  const mobile = chance(0.56);
  let first;
  if (fromHome) first = { checkpoint: 'navigate', source: `${HOST}/`, target: 'visible' };
  else if (chance(0.34)) first = enter(pick([['', 40], ['https://www.google.com/', 42], ['https://chatgpt.com/', 4], ['https://mail.google.com/', 8], ['https://www.instagram.com/', 6]]));
  else {
    // the cart is reached from the pages that convince: offers, the Atelier, the subscription
    const prev = here === '/cart'
      ? pick([['/offers', 30], ['/machines/atelier', 26], ['/subscriptions', 19], ['/beverages', 17], ['/customer/login', 5], ['/blog', 3]])
      : pick(pageNames.filter((p) => p !== here).map((p) => [p, PAGES[p][1]]));
    first = { checkpoint: 'navigate', source: `${HOST}${prev}`, target: 'visible' };
  }
  first.timeDelta = Math.round(jitter(170));
  const events = [first, ...seen(1 + Math.floor(rnd() * 4), chance(0.6))];
  const total = nexts.reduce((s, [, w]) => s + w, 0);
  if (chance(Math.min(0.92, jitter(total / 100)))) events.push({ checkpoint: 'click', source: 'main a', target: `${HOST}${pick(nexts)}`, timeDelta: Math.round(jitter(14000, 0.6)) });
  return bundle(`${HOST}${here}`, pick(UA[mobile ? 'mobile' : 'desktop']), timeFor(1.2), events);
}

/*
 * Landing pages by client theme (visibility/theme-rules.js), for the brand visibility read
 * "who arrives": [share of landing visits, [search, ai, direct, email, paid, social], pages].
 * Pages marked new do not exist on the site yet.
 */
const LANDING_BUNDLES = 1500;
const LANDINGS = {
  machines: [0.27, [50, 3, 20, 2, 20, 5], [['/machines/atelier', 50], ['/machines', 22], ['/machines/compare', 12] /* new */, ['/blog/automatic-espresso-machines-explained', 10] /* new */, ['/machines/atelier/reviews', 6] /* new */]],
  care: [0.15, [52, 4, 26, 16, 2, 0], [['/support', 30] /* new */, ['/support/descaling-the-atelier', 30] /* new */, ['/support/cleaning-the-milk-system', 20] /* new */, ['/support/water-filter', 20] /* new */]],
  cafes: [0.14, [60, 1, 25, 4, 0, 10], [['/cafe', 45], ['/cafe/classes/latte-art', 18] /* new */, ['/cafe/book-atelier-tour', 14], ['/cafe/classes/cupping', 13] /* new */, ['/blog/soho-morning', 10]]],
  brewing: [0.12, [70, 3, 12, 3, 0, 12], [['/blog/dialling-in-espresso', 35], ['/blog/slow-pour', 20], ['/blog/how-to-make-a-latte-at-home', 25] /* new */, ['/blog/milk-frothing-guide', 20] /* new */]],
  beans: [0.11, [46, 2, 22, 20, 8, 2], [['/beverages', 30], ['/beverages/coffee', 20], ['/subscriptions', 25] /* new */, ['/blog/single-origin', 15], ['/blog/tea-quiet-hour', 10]]],
  offers: [0.08, [30, 1, 15, 12, 30, 12], [['/offers', 50] /* new */, ['/offers/atelier-year-of-beans', 25] /* new */, ['/offers/students', 25] /* new */]],
  smart: [0.07, [42, 9, 25, 4, 6, 14], [['/blog/atelier-taste', 45], ['/blog/what-is-a-coffee-agent', 30] /* new */, ['/blog/smart-coffee-machines-explained', 25] /* new */]],
  pods: [0.06, [58, 5, 20, 7, 0, 10], [['/blog/nothing-wasted', 40], ['/sustainability', 35] /* new */, ['/blog/are-compostable-capsules-really-compostable', 25] /* new */]],
};
const CHANNEL = [
  () => [enter(pick([['https://www.google.com/', 84], ['https://www.bing.com/', 11], ['https://duckduckgo.com/', 5]]))],
  () => (chance(0.65) ? [enter('https://chatgpt.com/'), ...utm({ source: 'chatgpt.com' })] : [enter(pick([['https://www.perplexity.ai/', 40], ['https://gemini.google.com/', 35], ['https://copilot.microsoft.com/', 25]]))]),
  () => [enter('')],
  () => [enter(''), ...utm({ source: 'newsletter', medium: 'email' })],
  () => [enter('https://www.google.com/'), paid('google', 'gclid')],
  () => [enter(pick([['https://www.instagram.com/', 55], ['https://www.youtube.com/', 25], ['https://www.reddit.com/', 20]]))],
];

function landingBundle() {
  const theme = pick(Object.keys(LANDINGS).map((t) => [t, LANDINGS[t][0]]));
  const [, mix, pages] = LANDINGS[theme];
  const events = CHANNEL[pick(mix.map((w, i) => [i, w]))]();
  events.forEach((e) => { e.timeDelta = Math.round(jitter(180)); });
  events.push(...seen(1 + Math.floor(rnd() * 4), chance(0.6)));
  if (chance(0.38)) events.push({ checkpoint: 'click', source: 'main a', target: `${HOST}${pick([['/machines/atelier', 40], ['/offers', 20], ['/cafe', 15], ['/beverages', 15], ['/cart', 10]])}`, timeDelta: Math.round(jitter(15000, 0.6)) });
  return bundle(`${HOST}${pick(pages)}`, pick(UA[chance(0.58) ? 'mobile' : 'desktop']), timeFor(1.15), events);
}

/* ---------- write ---------- */
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '.data');
fs.mkdirSync(out, { recursive: true });

const home = [];
SPEC.forEach((spec) => {
  const n = Math.max(1, Math.round(HOME_BUNDLES * jitter(spec.share)));
  for (let i = 0; i < n; i += 1) home.push(homeBundle(spec));
});
// what the collector also sees and the reports drop: crawlers
for (let i = 0; i < Math.round(HOME_BUNDLES * 0.14); i += 1) {
  home.push(bundle(`${HOST}/`, pick([['bot:search', 40], ['bot:ai:meta-externalagent', 20], ['bot:monitoring', 25], ['bot:seo', 15]]), timeFor(1), [enter('')]));
}

const fromHomeShare = 0.3;
const site = [];
for (let i = 0; i < SITE_BUNDLES; i += 1) site.push(siteBundle(chance(fromHomeShare)));
// drawn last, so the homepage and journey bundles above stay the same when the themes change
for (let i = 0; i < LANDING_BUNDLES; i += 1) site.push(landingBundle());

const byTime = (a, b) => a.time.localeCompare(b.time);
const write = (file, rows) => fs.writeFileSync(path.join(out, file), `${rows.sort(byTime).map((r) => JSON.stringify(r)).join('\n')}\n`);
write('home.jsonl', home);
write('site.jsonl', [...home, ...site]);
write('frescopa-site.jsonl', [...home, ...site]); // the name the brand-visibility scripts read (<site id>-site.jsonl)
console.log(`home.jsonl: ${home.length} bundles · site.jsonl: ${home.length + site.length} bundles · seed ${SEED} · synthetic, not measured`);
