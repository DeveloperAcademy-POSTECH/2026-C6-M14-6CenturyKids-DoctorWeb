import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardSummary } from './dashboardSummary.ts';
import type { Patient } from '../domain/types.ts';

const day = (date: number, hour = 9) => new Date(2026, 10, date, hour);
const base: Patient = { id: 'example', pains: [], symptoms: [], previsits: [] };

test('summary only counts records inside the shared selected window and deduplicates days', () => {
  const result = dashboardSummary({ ...base,
    pains: [
      { recordedDate: day(3), painBefore: 6, painAfter: 2, location: [] },
      { recordedDate: day(3, 20), painBefore: 8, location: [] },
      { recordedDate: day(2), painBefore: 10, location: [] },
    ],
    symptoms: [
      { recordedDate: day(3), symptoms: [{ symptomType: 'diarrhea', presence: 'present', detail: '[검토 필요] 원문' }] },
      { recordedDate: day(4), symptoms: [{ symptomType: 'oralPain', presence: 'absent' }] },
      { recordedDate: day(2), symptoms: [{ symptomType: 'other', presence: 'unknown', detail: '[검토 필요] 기간 밖' }] },
    ],
  }, [day(3), day(4)]);
  assert.deepEqual(result, { recordedDays: 2, painCount: 2, maxPain: 8, reviewCount: 1 });
});

test('missing pain scores remain missing instead of displaying zero pain', () => {
  assert.deepEqual(dashboardSummary(base, [day(3)]), { recordedDays: 0, painCount: 0, maxPain: undefined, reviewCount: 0 });
});

test('a recorded zero is a valid pain score', () => {
  assert.equal(dashboardSummary({ ...base, pains: [{ recordedDate: day(3), painBefore: 0, location: [] }] }, [day(3)]).maxPain, 0);
});
