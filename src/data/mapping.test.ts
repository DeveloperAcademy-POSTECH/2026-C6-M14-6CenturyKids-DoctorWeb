import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageOn, cancerName, dateOnly, toPatients } from './mapping.ts';

test('날짜만 저장한 칸은 그 날 0시 (UTC로 밀리지 않게)', () => {
  const d = dateOnly('2026-11-06');
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()], [2026, 10, 6, 0]);
});

test('만 나이는 생일이 지나야 한 살 더한다', () => {
  assert.equal(ageOn(new Date(1959, 10, 10), new Date(2026, 10, 9)), 66);
  assert.equal(ageOn(new Date(1959, 10, 9), new Date(2026, 10, 9)), 67);
});

test('암종 이름: 목록·직접 쓴 이름·모름', () => {
  assert.equal(cancerName('colorectal', 'stage3'), '대장암 3기');
  assert.equal(cancerName('담관암', 'unknown'), '담관암');
  assert.equal(cancerName(null, null), undefined);
});

test('서버 행을 환자별로 묶고 진료 전 기록은 최신 먼저', () => {
  const [p] = toPatients({
    patients: [{ user_id: 'a', carcinoma_type: 'lung', carcinoma_stage: 'stage4', user: { id: 'a', name: '박영호', birthday: '1954-03-02', sex: 'male' } }],
    symptoms: [{ patient_id: 'a', recorded_at: '2026-11-08T10:30:00Z', condition: null,
      entries: [{ type: 'diarrhea', part: null, side: null, raw_location: null, presence: 'present', duration: null, count: 2, detail: '네 / 두 번이요' }] }],
    pains: [{ patient_id: 'a', occurred_at: '2026-11-08T00:00:00Z', pain_before: 6, pain_after: null, locations: [{ part: 'chest', side: 'center', view: 'front' }] },
      { patient_id: 'b', occurred_at: '2026-11-08T00:00:00Z', pain_before: 1, pain_after: 0, locations: [] }],
    previsits: [
      { patient_id: 'a', selected_date: '2026-10-20', memo: null, state_of_mind: 'candid', submitted_at: '2026-10-21T00:00:00Z' },
      { patient_id: 'a', selected_date: '2026-11-07', memo: '숨이 막혀요', state_of_mind: 'carefully', submitted_at: '2026-11-08T00:00:00Z' },
    ],
  }, new Date(2026, 10, 9));
  assert.equal(p.sex, '남');
  assert.equal(p.age, 72);
  assert.equal(p.cancer, '폐암 4기');
  assert.equal(p.symptoms[0].symptoms[0].occurrenceCount, 2);
  assert.equal(p.symptoms[0].conditionText, undefined);
  assert.equal(p.pains.length, 1);
  assert.equal(p.pains[0].painAfter, undefined);
  assert.equal(p.previsits[0].memo, '숨이 막혀요');
});

test('환자 이름을 읽을 권한이 없으면 비워 둔다', () => {
  const [p] = toPatients({ patients: [{ user_id: 'a', carcinoma_type: null, carcinoma_stage: null, user: null }], symptoms: [], pains: [], previsits: [] }, new Date());
  assert.equal(p.name, undefined);
  assert.equal(p.age, undefined);
});
