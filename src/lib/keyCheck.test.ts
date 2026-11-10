import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicKey } from './keyCheck.ts';

const jwt = (payload: object) => `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.y`;
const publishable = `sb_publishable_${'a'.repeat(31)}`;

test('공개용 키만 통과', () => {
  assert.equal(isPublicKey(publishable), true);
  assert.equal(isPublicKey(` ${publishable}\n`), true);
  assert.equal(isPublicKey(jwt({ role: 'anon' })), true);
});

test('secret·service_role·모르는 모양은 막는다', () => {
  assert.equal(isPublicKey(`sb_secret_${'a'.repeat(31)}`), false);
  assert.equal(isPublicKey(jwt({ role: 'service_role' })), false);
  assert.equal(isPublicKey('something-else'), false);
  assert.equal(isPublicKey('a.not-base64!.c'), false);
  assert.equal(isPublicKey(''), false);
});

test('공개용 키 뒤에 다른 키를 붙인 값은 막는다', () => {
  assert.equal(isPublicKey(`${publishable} sb_secret_${'b'.repeat(31)}`), false);
  assert.equal(isPublicKey(`${publishable}.${'c'.repeat(10)}`), false);
  assert.equal(isPublicKey(`${jwt({ role: 'anon' })} extra`), false);
  assert.equal(isPublicKey('sb_publishable_short'), false);
});
