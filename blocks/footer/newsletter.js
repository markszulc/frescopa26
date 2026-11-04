const NEWSLETTER_LABELS = new Map([
  ['', {
    lang: 'en',
    newsletterLabel: 'A little warmth in your inbox.',
    newsletterPlaceholder: 'you@example.com',
    newsletterButton: 'Sign up',
  }],
  ['de', {
    lang: 'de',
    newsletterLabel: 'Ein wenig Wärme in Ihrem Postfach.',
    newsletterPlaceholder: 'sie@beispiel.de',
    newsletterButton: 'Anmelden',
  }],
  ['jp', {
    lang: 'ja',
    newsletterLabel: 'メールボックスに、少しのぬくもりを。',
    newsletterPlaceholder: 'you@example.jp',
    newsletterButton: '登録する',
  }],
  ['ko', {
    lang: 'ko',
    newsletterLabel: '메일함에 작은 따뜻함을 전해 드려요.',
    newsletterPlaceholder: 'you@example.kr',
    newsletterButton: '구독하기',
  }],
]);

export default function getNewsletterLabels(pathname, overrides = {}) {
  const prefix = pathname.split('/')[1];
  // The language sheet also uses /kr for Korean pages.
  const defaults = NEWSLETTER_LABELS.get(prefix === 'kr' ? 'ko' : prefix)
    || NEWSLETTER_LABELS.get('');
  return {
    lang: defaults.lang,
    newsletterLabel: overrides.newsletterLabel || defaults.newsletterLabel,
    newsletterPlaceholder: overrides.newsletterPlaceholder || defaults.newsletterPlaceholder,
    newsletterButton: overrides.newsletterButton || defaults.newsletterButton,
  };
}
