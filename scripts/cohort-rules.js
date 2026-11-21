/*
 * Cohort rules for the Fréscopa homepage. Order matters: the first rule that matches decides
 * the experience. Read by the browser (scripts/cohorts.js) and by the homepage-cohorts skill's
 * size.js / review.js on Optel bundles. Regexes are strings (case-insensitive).
 */
export default {
  experiment: 'homepage-cohorts',

  // the cohort sections live on the homepage itself (no separate /new page)
  pocPath: '/',

  // interests, from campaign tags and from pages visited (first match wins)
  intents: [
    ['offer', 'offer|bundle|finance|student|campus'],
    ['atelier', 'atelier|machine|espresso'],
    ['beans', 'beverages|beans|coffee|subscription'],
    ['cafe', 'cafe|tour|class'],
    ['care', 'account|customer|support|care|descal'],
  ],

  insights: {
    src: '/cohorts/cohorts.json',
    // section notes by id: a content-store file that is previewed and never published
    notes: '/cohorts/insights.json',
    label: 'Optel',
    pages: {
      '/machines/atelier': 'The Atelier', '/machines': 'Machines', '/beverages': 'Beverages', '/cafe': 'Cafés', '/offers': 'Bundles & offers', '/subscriptions': 'Bean subscription', '/customer/login': 'Account', '/support': 'Care & support',
    },
  },

  conversion: { click: '/cart|/checkout|/cafe', path: '^/(cart|checkout)', label: 'add to cart or book a tour' },

  memory: {
    storeKey: 'cohorts-v1',
    sessionGapMs: 30 * 60 * 1000,
    requireConsent: false,
    signIn: 'a[href*="/customer"], a[href*="login"], [data-signin]',
  },

  experiences: {
    owner: { label: 'Owner: your beans first', sub: 'Reorder beans · your routine · care · one new favourite' },
    shopper: { label: 'Shopper: answer the search', sub: 'Price and monthly plan · compare machines · reviews' },
    story: { label: 'Discover: see it pour', sub: 'Video · three reviews · one bundle' },
    deal: { label: 'Deal seeker: the bundle first', sub: 'Atelier + a year of beans · what is in the box · 30-night trial' },
    local: { label: 'Nearby: taste it first', sub: 'Nearest café · book an Atelier tour · classes' },
    agent: { label: 'Personal agent: plain & orderable', sub: 'Specs and prices as text · labelled actions · nothing hidden' },
  },

  // The relationship: loyalty or new. A way to read the cohorts, not a second decision: the rule
  // that fires still picks the page. A visitor counts as loyalty when any signal says they
  // already know us; one weak signal is enough.
  relationship: {
    groups: {
      loyalty: { label: 'Loyalty', sub: 'Owners, subscribers and visitors who came back', goalLabel: 'reorder beans or sign in' },
      new: { label: 'New or unknown', sub: 'Nothing says they know us: the request is all we have', goalLabel: 'find a machine' },
    },
    signals: [
      {
        id: 'signed-in', label: 'Signed in on this device before', strength: 'strong', when: { signedIn: true },
      },
      {
        id: 'app', label: 'Came from the Fréscopa app', strength: 'strong', when: { utm: { source: '^frescopa-app$' } },
      },
      {
        id: 'email', label: 'Opened one of our emails', strength: 'medium', when: { any: [{ referrer: ['mail.google.com', 'mail.yahoo.com', 'outlook.live.com'] }, { utm: { medium: '^e-?mail$' } }] },
      },
      {
        id: 'consent-before', label: 'Decided about cookies on an earlier visit', strength: 'medium', when: { consentBefore: true },
      },
      {
        id: 'repeat-visit', label: 'Visited before (on-device)', strength: 'weak', when: { visits: { min: 2 } },
      },
    ],
  },

  sources: [
    { id: 'email', label: 'Email (Gmail app, webmail)', referrer: ['mail.google.com', 'mail.yahoo.com', 'outlook.live.com'] },
    { id: 'cashback', label: 'Cashback & coupon sites', referrer: ['capitaloneshopping.com', 'rakuten.com'] },
  ],

  rules: [
    {
      id: 'personal-agent',
      group: 'new',
      label: 'A personal AI agent is browsing',
      experience: 'agent',
      intent: 'utm',
      when: { agent: true },
      goal: { click: 'machines/atelier|/offers|/cart|/cafe' },
      goalLabel: 'open the Atelier, an offer or the cart',
    },
    {
      id: 'from-email',
      group: 'loyalty',
      label: 'Opened one of our emails',
      experience: 'owner',
      when: { any: [{ referrer: ['mail.google.com', 'mail.yahoo.com', 'outlook.live.com'] }, { utm: { medium: '^e-?mail$' } }] },
      goal: { click: '/customer|/subscriptions|/support|/beverages' },
      goalLabel: 'reorder, manage beans or get care help',
      support: { click: '/offers|/beverages' },
      supportLabel: 'this week\'s favourites or an offer',
    },
    {
      id: 'from-app',
      group: 'loyalty',
      label: 'Came from the Fréscopa app',
      experience: 'owner',
      when: { utm: { source: '^frescopa-app$' } },
      goal: { click: '/customer|/subscriptions|/support|/beverages' },
      goalLabel: 'reorder, manage beans or get care help',
    },
    {
      id: 'campus-partner',
      group: 'new',
      label: 'Followed a campus partner offer',
      experience: 'deal',
      intent: 'utm',
      when: { utm: { any: 'campus|student' } },
      goal: { click: '/offers|/cart' },
      goalLabel: 'open the offer or the cart',
    },
    {
      id: 'deal-sites',
      group: 'new',
      label: 'Came from a cashback or coupon site',
      experience: 'deal',
      when: { referrer: ['capitaloneshopping.com', 'rakuten.com'] },
      goal: { click: '/offers|/cart' },
      goalLabel: 'open the offer or the cart',
      support: { click: '/offers' },
      supportLabel: 'bundles & offers',
    },
    {
      id: 'ai-referred',
      group: 'new',
      label: 'Sent by an AI assistant',
      experience: 'shopper',
      when: { source: 'ai' },
      goal: { click: 'machines/atelier|/offers|/cart' },
      goalLabel: 'open the Atelier, an offer or the cart',
      support: { click: '/machines$|/offers|reviews|compare' },
      supportLabel: 'compare machines, reviews or offers',
    },
    {
      id: 'paid-social',
      group: 'new',
      label: 'Clicked a social ad',
      experience: 'story',
      when: { any: [{ paid: ['facebook', 'pinterest', 'tiktok'] }, { utm: { medium: '^(psoc|paid[_-]?social)$' } }] },
      goal: { click: 'machines/atelier|/offers|/cart' },
      goalLabel: 'open the Atelier, an offer or the cart',
    },
    {
      id: 'paid-search',
      group: 'new',
      label: 'Clicked a search ad',
      experience: 'shopper',
      intent: 'utm',
      when: { paid: ['google', 'microsoft', 'doubleclick'] },
      goal: { click: 'machines/atelier|/offers|/cart' },
      goalLabel: 'open the Atelier, an offer or the cart',
      support: { click: '/machines$|/offers|reviews|compare' },
      supportLabel: 'compare machines, reviews or offers',
    },
    {
      id: 'signed-in-before',
      group: 'loyalty',
      label: 'Has used their account before',
      experience: 'owner',
      when: { signedIn: true },
      // not in Optel: views that open the account today are recognised on their next visit
      model: { click: '/customer|login' },
      goal: { click: '/customer|/subscriptions|/support' },
      goalLabel: 'open the account, beans or care',
    },
    {
      id: 'returning-interest',
      group: 'loyalty',
      label: 'Back with a product interest',
      experience: 'shopper',
      intent: 'memory',
      when: { visits: { min: 2 }, interest: true, source: ['direct', 'search', 'other', 'internal'] },
      // not in Optel: views that click into a product page today come back with that interest
      model: { clickIntent: true },
      goal: { click: 'machines/atelier|/offers|/cart' },
      goalLabel: 'open the Atelier, an offer or the cart',
    },
    {
      id: 'organic-search',
      group: 'new',
      label: 'Searched and landed here',
      experience: 'shopper',
      when: { source: 'search' },
      goal: { click: 'machines/atelier|/offers|/cart' },
      goalLabel: 'open the Atelier, an offer or the cart',
      support: { click: '/machines$|/offers|reviews|compare' },
    },
    {
      id: 'mobile-first-visit',
      group: 'new',
      label: 'First visit on a phone',
      experience: 'local',
      when: { device: 'mobile', visits: { max: 1 } },
      goal: { navigate: true },
      goalLabel: 'tap through to any page',
      support: { click: '/cafe' },
      supportLabel: 'find a café or book a tour',
    },
  ],

  // demo panel (?demo): visitors to simulate, each sets real signals
  scenarios: [
    ['No signal', {}],
    ['Search ad: Atelier price', {
      gclid: 'demo', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'atelier-price',
    }],
    ['From ChatGPT', { utm_source: 'chatgpt.com' }],
    ['A personal AI agent', { agent: 'chatgpt-agent' }],
    ['Owner, from our email', { utm_source: 'newsletter', utm_medium: 'email' }],
    ['Owner, from the app', { utm_source: 'frescopa-app', utm_medium: 'app' }],
    ['Campus partner offer', { utm_source: 'partner', utm_medium: 'partner', utm_campaign: 'campus-fall' }],
    ['Cashback site', { ref: 'rakuten.com' }],
    ['Social ad', { fbclid: 'demo', utm_medium: 'psoc' }],
    ['Returning, looked at beans', {}, { visits: 3, interests: { beans: 3 } }],
    ['First visit on a phone', { cohort: 'mobile-first-visit' }],
    ['Decided about cookies before (declined)', { consent: 'rejected' }, { visits: 2 }],
  ],
};
