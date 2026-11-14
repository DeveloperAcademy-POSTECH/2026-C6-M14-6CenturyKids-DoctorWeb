import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SymptomEntry, SymptomRecord, SymptomType } from '../domain/types.ts';
import { summarizeBySymptom } from './symptomSummary.ts';

const has = (symptomType: SymptomType, detail = '네'): SymptomEntry => ({ symptomType, presence: 'present', detail });
const no = (symptomType: SymptomType): SymptomEntry => ({ symptomType, presence: 'absent' });
const rec = (date: string, symptoms: SymptomEntry[]): SymptomRecord => ({ recordedDate: new Date(date), symptoms });

const records = [
  rec('2026-11-05T10:00', [has('diarrhea'), no('constipation'), has('numbness'), has('other', '어지러움: 핑 돌아요')]),
  rec('2026-11-06T10:00', [has('diarrhea', '[검토 필요] 물 같은 변'), has('constipation'), no('numbness')]),
  rec('2026-11-07T10:00', [has('diarrhea'), no('constipation'), no('numbness')]),
];

test('기타까지 많은 순, 같으면 기타 먼저 그다음 앱 항목 순서', () => {
  const s = summarizeBySymptom(records);
  assert.deepEqual(s.map((x) => x.type), ['diarrhea', 'other', 'constipation', 'numbness']);
  assert.deepEqual(s.map((x) => x.count), [3, 1, 1, 1]);
  assert.equal(s[0].review, 1);
  assert.equal(s[0].days[0].day, '2026-11-7');
});
