/*
 * Site rules for the brand-visibility read "who arrives" (site-merge skill format; one site
 * is a merge of one). A visit's need is read from the page it lands on, first match wins.
 */
export default {
  title: 'Fréscopa',
  sites: [
    { id: 'frescopa', name: 'Fréscopa', label: 'frescopa.coffee', host: 'www.frescopa.coffee', domain: 'frescopa.coffee', home: '^/$', target: true, homePath: '/' },
  ],
  needs: [
    ['client', '/customer|/account|/log-?in'],
    ['cart', '/cart|/checkout'],
    ['insights', '/blog'],
    ['solutions', '/machines|/beverages|/subscriptions|/cafe|/offers|/support|/sustainability'],
    ['legal', 'privacy|legal|terms|cookie'],
  ],
  needLabels: {
    client: 'Account', cart: 'Cart and checkout', insights: 'Journal', solutions: 'Machines, coffee, cafés and care', legal: 'Notices', home: 'Homepage, no next step', other: 'Other pages',
  },
  audiences: [
    { id: 'solutions', label: 'Shoppers and owners', on: 'Product and care pages', keep: '-', gain: '' },
    { id: 'insights', label: 'Readers', on: 'Journal', keep: '-', gain: '' },
    { id: 'other', label: 'Everything else', on: '-', keep: '-', gain: '' },
  ],
  layers: [
    { id: 'all', label: 'All traffic', sub: 'Every visit' },
    { id: 'seo', label: 'SEO', sub: 'Visits from search engines', channels: ['search'] },
    { id: 'geo', label: 'GEO', sub: 'Visits from AI assistants and answer engines', channels: ['ai'] },
  ],
  minSample: 30,
  minLayerSample: 300,
};
