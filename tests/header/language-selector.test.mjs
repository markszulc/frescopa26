import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LANGUAGES, getLanguage, getLanguageHref } from '../../blocks/header/language-selector.js';

test('uses the confirmed prefixes and HTML language codes', () => {
  assert.deepEqual(
    LANGUAGES.map(({ prefix, code }) => [prefix, code]),
    [['', 'en'], ['fr', 'fr'], ['de', 'de'], ['es', 'es'], ['it', 'it'],
      ['jp', 'ja'], ['kr', 'ko'], ['cn', 'zh-Hans']],
  );
});

test('switches every language pair, preserving page paths, queries, and anchors', () => {
  LANGUAGES.forEach((source) => {
    LANGUAGES.forEach((target) => {
      ['', '/', '/machines/atelier', '/machines/atelier/', '/caf%C3%A9'].forEach((page) => {
        const pathname = source.prefix ? `/${source.prefix}${page}` : page || '/';
        const location = { pathname, search: '?coffee=espresso&size=2', hash: '#details' };
        assert.equal(getLanguage(pathname), source);
        const suffix = page === '/' ? '' : page;
        let expected = target.prefix ? `/${target.prefix}${suffix}` : page || '/';
        if (target === source) expected = pathname;
        assert.equal(getLanguageHref(target, location), `${expected}${location.search}${location.hash}`);
      });
    });
  });
});

test('recognizes only complete leading language segments', () => {
  ['/jpo/machines', '/france', '/machines/jp', '/en/machines'].forEach((pathname) => {
    const location = { pathname, search: '', hash: '' };
    assert.equal(getLanguage(pathname), LANGUAGES[0]);
    assert.equal(getLanguageHref(LANGUAGES[5], location), `/jp${pathname}`);
  });
});

test('switching to the current language leaves the URL unchanged', () => {
  ['/', '/machines', '/jp', '/jp/', '/cn/machines'].forEach((pathname) => {
    const location = { pathname, search: '?q=coffee', hash: '#details' };
    assert.equal(
      getLanguageHref(getLanguage(pathname), location),
      `${pathname}${location.search}${location.hash}`,
    );
  });
});
