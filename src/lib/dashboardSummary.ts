import type { Patient } from '../domain/types.ts';
import { dayKey } from './dates.ts';
import { isReview } from './symptomDetail.ts';

/** All figures use the same selected seven-day window as the record panels. */
export function dashboardSummary(patient: Patient, days: Date[]) {
  const keys = new Set(days.map(dayKey));
  const pains = patient.pains.filter((r) => keys.has(dayKey(r.recordedDate)));
  const symptoms = patient.symptoms.filter((r) => keys.has(dayKey(r.recordedDate)));
  return {
    recordedDays: new Set([...pains, ...symptoms].map((r) => dayKey(r.recordedDate))).size,
    painCount: pains.length,
    maxPain: pains.length ? Math.max(...pains.map((r) => r.painBefore)) : undefined,
    reviewCount: symptoms.flatMap((r) => r.symptoms).filter(isReview).length,
  };
}
