/*
 * Client themes for Fréscopa: what someone is trying to solve, in their words. One list for the
 * landing pages, for the questions put to search and AI assistants, and for what Fréscopa says
 * it wants. First match wins, so the specific comes before the general.
 */
export default {
  topical: ['solutions', 'insights', 'campaign', 'other'],
  themes: [
    { id: 'offers', label: 'Offers and financing', words: 'offers?|students?|bundles?|financ\\w*' },
    { id: 'smart', label: 'Smart coffee, the coffee agent', words: 'agent|smart|learns|ai|atelier taste' },
    { id: 'pods', label: 'Pods and sustainability', words: 'pods?|capsules?|compostable|sustainab\\w*|recycl\\w*|nothing wasted' },
    { id: 'care', label: 'Care and descaling', words: 'support|descal\\w*|cleaning|filter|care|warranty' },
    { id: 'cafes', label: 'Cafés and classes', words: 'cafe|classes|tour|cupping|soho' },
    { id: 'brewing', label: 'Brewing at home', words: 'latte|flat white|frothing|brew\\w*|recipes?|dialling|slow pour' },
    { id: 'beans', label: 'Beans and subscription', words: 'beverages|beans?|subscriptions?|single origin|tea' },
    { id: 'machines', label: 'Espresso machines', words: 'machines?|atelier|espresso|bean to cup|compare|reviews' },
  ],
};
