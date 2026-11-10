import type { Patient } from '../domain/types.ts';
import { daysBetween } from './dates.ts';
import { isReview } from './symptomDetail.ts';

export const lastRecordDate = (p: Patient) => {
  const times = [...p.symptoms, ...p.pains].map((r) => r.recordedDate.getTime());
  return times.length ? new Date(Math.max(...times)) : undefined;
};

/** 최근 7일 증상 기록의 '검토 필요' 항목 수 */
export const reviewCount = (p: Patient, today: Date) =>
  p.symptoms
    .filter((r) => daysBetween(r.recordedDate, today) < 7)
    .flatMap((r) => r.symptoms)
    .filter(isReview).length;
