import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changeSentence } from './painChange.ts';

test('1시간 뒤 요약 문장: 0인 항목은 말하지 않는다', () => {
  assert.equal(changeSentence(9, 5, 0, 2, 2), '9번 중 5번 낮아졌고 2번 높아졌어요. 2번은 1시간 뒤 점수가 없어요.');
  assert.equal(changeSentence(2, 2, 0, 0, 0), '2번 모두 낮아졌어요.');
  assert.equal(changeSentence(3, 0, 0, 0, 3), '3번은 1시간 뒤 점수가 없어요.');
  assert.equal(changeSentence(4, 1, 2, 1, 0), '4번 중 1번 낮아졌고 2번 그대로였고 1번 높아졌어요.');
});

test('라벨-값 줄 요약: 값은 하나, 나머지는 설명 한 줄', async () => {
  const { changeSummary } = await import('./painChange.ts');
  assert.deepEqual(changeSummary(9, 5, 0, 2, 2), { value: '9번 중 5번 낮아짐', rest: '2번 높아짐, 2번은 1시간 뒤 기록 없음' });
  assert.deepEqual(changeSummary(2, 2, 0, 0, 0), { value: '2번 모두 낮아짐', rest: '' });
  assert.deepEqual(changeSummary(3, 0, 1, 1, 1), { value: '3번 중 1번 그대로', rest: '1번 높아짐, 1번은 1시간 뒤 기록 없음' });
  assert.deepEqual(changeSummary(2, 0, 0, 0, 2), { value: '2번 모두 1시간 뒤 기록 없음', rest: '' });
});
