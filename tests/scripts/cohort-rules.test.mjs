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
test('the switcher stays on the homepage', () => assert.equal(rules.pocPath, '/'));

const rel = (o) => matchRule(rules, s(o)).relationship;
test('every rule is in a relationship group', () => rules.rules.forEach((r) => assert.ok(rules.relationship.groups[r.group], r.id)));
test('no signal is new or unknown', () => assert.equal(rel({}).group, 'new'));
test('the app is a strong loyalty signal', () => assert.deepEqual([rel({ utm: { source: 'frescopa-app' } }).group, rel({ utm: { source: 'frescopa-app' } }).strength], ['loyalty', 'strong']));
test('a repeat visit is a weak loyalty signal', () => assert.deepEqual([rel({ memory: { visits: 2 } }).group, rel({ memory: { visits: 2 } }).strength], ['loyalty', 'weak']));
test('an earlier cookie decision counts, also a rejection', () => assert.equal(rel({ consent: 'rejected', consentBefore: true }).group, 'loyalty'));
