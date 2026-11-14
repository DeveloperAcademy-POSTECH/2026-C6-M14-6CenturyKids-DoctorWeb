import { CARE_CALL_TYPES } from '../domain/labels.ts';
import type { SymptomEntry, SymptomRecord, SymptomType } from '../domain/types.ts';
import { dayKey } from './dates.ts';
import { isReview } from './symptomDetail.ts';

/** 한 증상의 하루 상태. 표의 점과 같은 규칙 (검토 필요 > 있음 > 모름 > 없음) */
export type DayState = 'review' | 'present' | 'unknown' | 'absent';

export interface SymptomDay {
  day: string;
  recordedDate: Date;
  state: DayState;
  entries: SymptomEntry[];
}

export interface SymptomSummary {
  type: SymptomType;
  /** 최신 날짜 먼저, 그날 묻지 못한 날은 없음 */
  days: SymptomDay[];
  /** 정렬 기준: 표에 점(있음·검토 필요)이 찍힌 날 수 */
  count: number;
  review: number;
}

const stateOf = (entries: SymptomEntry[]): DayState =>
  entries.some(isReview) ? 'review'
    : entries.some((e) => e.presence === 'present') ? 'present'
    : entries.some((e) => e.presence === 'unknown') ? 'unknown' : 'absent';

/**
 * 7일 증상 기록을 증상별로 묶어 많은 순으로.
 * 같으면 기타 먼저, 그다음 앱 항목 순서(오심·구토 → … → 탈수·영양). 답이 하나도 없는 증상은 뺀다.
 */
export function summarizeBySymptom(records: SymptomRecord[]): SymptomSummary[] {
  const newestFirst = [...records].sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime());
  const summarize = (type: SymptomType): SymptomSummary => {
    const days = newestFirst.flatMap((r) => {
      const entries = r.symptoms.filter((e) => e.symptomType === type);
      return entries.length ? [{ day: dayKey(r.recordedDate), recordedDate: r.recordedDate, state: stateOf(entries), entries }] : [];
    });
    return {
      type,
      days,
      count: days.filter((d) => d.state === 'review' || d.state === 'present').length,
      review: days.filter((d) => d.state === 'review').length,
    };
  };
  // sort는 같은 값이면 원래 순서를 지키므로 [기타, ...앱 항목 순서]가 동률 순서가 된다
  return (['other', ...CARE_CALL_TYPES] as SymptomType[]).map(summarize)
    .filter((s) => s.days.length)
    .sort((a, b) => b.count - a.count);
}
