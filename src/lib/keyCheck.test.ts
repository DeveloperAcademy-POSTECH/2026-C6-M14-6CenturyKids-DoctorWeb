import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSecretKey } from './keyCheck.ts';

const jwt = (role: string) => `x.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.y`;

test('secret·service_role 키는 막고 공개용 키는 통과', () => {
  assert.equal(isSecretKey('sb_secret_abc'), true);
  assert.equal(isSecretKey(jwt('service_role')), true);
  assert.equal(isSecretKey('sb_publishable_abc'), false);
  assert.equal(isSecretKey(jwt('anon')), false);
});
