import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Patient } from '../domain/types.ts';
import { mergeRefreshed } from './mergeRefreshed.ts';
import type { DoctorData } from './server.ts';

const patient = (score: number): Patient => ({
  id: 'p1', symptoms: [], previsits: [],
  pains: [{ recordedDate: new Date(2026, 10, 9, 9), location: [], painBefore: score }],
});
const data = (over: Partial<DoctorData> = {}): DoctorData => ({ doctorName: '희망', patients: [patient(3)], failed: [], ...over });

test('새 기록이 있으면 새 내용으로 바꾼다', () => {
  const next = data({ patients: [patient(7)] });
  assert.equal(mergeRefreshed(data(), next)?.patients, next.patients);
});

test('내용이 같으면 보던 환자 목록을 그대로 쓴다', () => {
  const previous = data();
  assert.equal(mergeRefreshed(previous, data())?.patients, previous.patients);
});

test('전에 읽었던 기록을 못 읽으면 반영하지 않는다', () => {
  assert.equal(mergeRefreshed(data(), data({ patients: [], failed: ['통증 기록'] })), null);
});

test('처음부터 못 읽던 기록은 갱신을 막지 않는다', () => {
  const next = data({ patients: [patient(7)], failed: ['진료 전 기록'] });
  assert.equal(mergeRefreshed(data({ failed: ['진료 전 기록'] }), next)?.patients, next.patients);
});

test('의사 이름을 못 읽으면 보던 이름을 유지한다', () => {
  assert.equal(mergeRefreshed(data(), data({ doctorName: '' }))?.doctorName, '희망');
});
