import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicKey } from './keyCheck.ts';

const jwt = (role: string) => `x.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.y`;

test('공개용 키만 통과', () => {
  assert.equal(isPublicKey('sb_publishable_abc'), true);
  assert.equal(isPublicKey(' sb_publishable_abc\n'), true);
  assert.equal(isPublicKey(jwt('anon')), true);
});

test('secret·service_role·모르는 모양은 막는다', () => {
  assert.equal(isPublicKey('sb_secret_abc'), false);
  assert.equal(isPublicKey(jwt('service_role')), false);
  assert.equal(isPublicKey('something-else'), false);
  assert.equal(isPublicKey('a.not-base64!.c'), false);
  assert.equal(isPublicKey(''), false);
});
