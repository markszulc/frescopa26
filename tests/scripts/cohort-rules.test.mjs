import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRule } from '../../scripts/cohorts.js';
import rules from '../../scripts/cohort-rules.js';

const s = (o) => ({
  refHost: '', source: 'direct', utm: {}, paid: [], device: 'desktop', bot: false, memory: {}, ...o,
});
const rule = (o) => matchRule(rules, s(o)).rule;
const experience = (o) => matchRule(rules, s(o)).experience;

test('no signal keeps the original homepage', () => assert.equal(rule({}), null));
test('an agent only matches the agent rule', () => assert.equal(rule({ agent: 'chatgpt-agent', device: 'mobile' }), 'personal-agent'));
test('email visitors are owners', () => assert.equal(experience({ utm: { medium: 'email' } }), 'owner'));
test('the app tags its links', () => assert.equal(rule({ utm: { source: 'frescopa-app' } }), 'from-app'));
test('campus partner links get the deal', () => assert.equal(experience({ utm: { campaign: 'campus-fall' } }), 'deal'));
test('deal sites get the deal', () => assert.equal(rule({ refHost: 'rakuten.com', source: 'other' }), 'deal-sites'));
test('AI referrals are shoppers', () => assert.equal(rule({ source: 'ai' }), 'ai-referred'));
test('paid search is a shopper', () => assert.equal(rule({ source: 'search', paid: ['google'] }), 'paid-search'));
test('a signed-in browser is an owner', () => assert.equal(rule({ memory: { signedIn: true, visits: 3 } }), 'signed-in-before'));
test('organic search is a shopper', () => assert.equal(rule({ source: 'search' }), 'organic-search'));
test('a first visit on a phone goes local', () => assert.equal(experience({ device: 'mobile', memory: { visits: 1 } }), 'local'));
test('every rule names an experience that exists', () => rules.rules.forEach((r) => assert.ok(rules.experiences[r.experience], r.id)));
