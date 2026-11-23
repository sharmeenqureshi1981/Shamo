const test = require('node:test');
const assert = require('node:assert/strict');
const PG = require('../src/detectors.js');

const types = (text, opts) => PG.detect(text, opts).map((f) => f.type);

test('card numbers: Luhn-valid only', () => {
  assert.deepEqual(types('my card is 4111 1111 1111 1111 thanks'), ['CARD']);
  assert.deepEqual(types('order ref 4111 1111 1111 1112'), []);
});

test('IBAN with checksum', () => {
  assert.deepEqual(types('send to GB29 NWBK 6016 1331 9268 19 please'), ['IBAN']);
  assert.deepEqual(types('GB00 NWBK 6016 1331 9268 19'), []);
});

test('sort code needs context, dates are not sort codes', () => {
  assert.deepEqual(types('sort code 20-00-00'), ['SORT_CODE']);
  assert.deepEqual(types('20-00-00 account 12345678'), ['SORT_CODE', 'ACCOUNT_NUMBER']);
  assert.deepEqual(types('meeting on 12-05-24'), []);
});

test('account number needs context', () => {
  assert.deepEqual(types('account no 12345678'), ['ACCOUNT_NUMBER']);
  assert.deepEqual(types('ticket 12345678'), []);
});

test('secrets', () => {
  assert.deepEqual(types('key sk-proj-abcdefghijklmnopqrstuvwx123'), ['SECRET']);
  assert.deepEqual(types('AKIAIOSFODNN7EXAMPLE'), ['SECRET']);
  const f = PG.detect('my password is hunter22 ok');
  assert.equal(f[0].type, 'SECRET');
  assert.equal(f[0].value, 'hunter22');
});

test('identity data', () => {
  assert.deepEqual(types('NI number AB 12 34 56 C'), ['NI_NUMBER']);
  assert.deepEqual(types('email jane.doe@example.co.uk'), ['EMAIL']);
  assert.deepEqual(types('call 07700 900123'), ['PHONE']);
  assert.deepEqual(types('call +44 20 7946 0958'), ['PHONE']);
  assert.deepEqual(types('I live at SW1A 1AA'), ['POSTCODE']);
  assert.deepEqual(types('DOB 03/04/1985'), ['DOB']);
  assert.deepEqual(types('due 03/04/1985'), []);
});

test('money amounts are warn-only by default', () => {
  const f = PG.detect('I owe £1,250.50 and $300');
  assert.deepEqual(f.map((x) => [x.type, x.policy]), [['AMOUNT', 'warn'], ['AMOUNT', 'warn']]);
});

test('custom terms', () => {
  const f = PG.detect('Ask Sarah Khan at Acme Ltd', { customTerms: ['Sarah Khan', 'Acme Ltd'] });
  assert.deepEqual(f.map((x) => x.value), ['Sarah Khan', 'Acme Ltd']);
});

test('policy off disables a category', () => {
  assert.deepEqual(types('jane@example.com', { policies: { EMAIL: 'off' } }), []);
});

test('redact keeps consistent placeholders across messages', () => {
  const vault = new Map();
  const t1 = 'Email jane@x.com and bob@y.com, then jane@x.com again. Budget £500.';
  const r1 = PG.redact(t1, PG.detect(t1), vault);
  assert.equal(r1.text, 'Email [EMAIL_1] and [EMAIL_2], then [EMAIL_1] again. Budget £500.');
  const t2 = 'Also cc bob@y.com and amy@z.com';
  const r2 = PG.redact(t2, PG.detect(t2), vault);
  assert.equal(r2.text, 'Also cc [EMAIL_2] and [EMAIL_3]');
});

test('no false positives on ordinary text', () => {
  assert.deepEqual(types('Can you help me plan a 3 day trip to Rome in May 2025 for 2 adults?'), []);
});

test('mask', () => {
  assert.equal(PG.mask('4111 1111 1111 1111'), '411••••••••••••111');
});
