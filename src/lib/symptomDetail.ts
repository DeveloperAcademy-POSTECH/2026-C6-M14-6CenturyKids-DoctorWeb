import { COUNT_PREFIX, DETAIL_LABELS, locationName } from '../domain/labels.ts';
import type { SymptomEntry } from '../domain/types.ts';

const REVIEW = '[검토 필요]';

export interface DetailLine {
  /** 꼬리질문이 둘인 항목의 질문 이름 ("구토 횟수") */
  label?: string;
  text: string;
}

export interface ParsedDetail {
  needsReview: boolean;
  /** 기타 증상 이름 ("어지러움") */
  otherName?: string;
  lines: DetailLine[];
}

/**
 * 앱이 저장한 detail 한 칸을 화면용으로 나눈다.
 * 저장 모양: "[검토 필요] 기타 이름: 유무 답 원문 / 꼬리질문 답 / 모르겠다는 답"
 * 질문 이름은 앱 설정에 있는 이름일 때만 떼어 낸다 (환자 말 속 ':'을 이름으로 읽지 않게).
 */
export function parseDetail(entry: SymptomEntry): ParsedDetail {
  let text = (entry.detail ?? '').trim();
  const needsReview = text.startsWith(REVIEW);
  if (needsReview) text = text.slice(REVIEW.length).trim();

  let otherName: string | undefined;
  if (entry.symptomType === 'other') {
    const i = text.indexOf(':');
    if (i > 0) {
      otherName = text.slice(0, i).trim();
      text = text.slice(i + 1).trim();
    }
  }

  const labels = DETAIL_LABELS[entry.symptomType] ?? [];
  const lines = text
    ? text.split(' / ').map((part): DetailLine => {
        const label = labels.find((l) => part.startsWith(`${l}: `));
        return label ? { label, text: part.slice(label.length + 2) } : { text: part };
      })
    : [];
  return { needsReview, otherName, lines };
}

export const isReview = (entry: SymptomEntry) => !!entry.detail?.trim().startsWith(REVIEW);

/**
 * 한 답에서 칩으로 보일 사실: 기타 이름 · 모름 · 부위(환자가 말한 자리) · 횟수 · 지속 시간.
 * 한눈에 보기와 자세히가 같은 말로 보이게 한 곳에서 만든다.
 */
export function entryFacts(entry: SymptomEntry): string[] {
  const { otherName } = parseDetail(entry);
  const prefix = COUNT_PREFIX[entry.symptomType];
  const facts: string[] = [];
  if (otherName) facts.push(otherName);
  if (entry.presence === 'unknown') facts.push('모름');
  if (entry.bodyPart) facts.push(`${locationName(entry.bodyPart, entry.bodySide)}${entry.rawLocationText ? ` “${entry.rawLocationText}”` : ''}`);
  else if (entry.rawLocationText) facts.push(`“${entry.rawLocationText}”`);
  if (entry.occurrenceCount !== undefined) facts.push(`${prefix ? `${prefix} ` : ''}${entry.occurrenceCount}회`);
  if (entry.durationMinutes !== undefined) facts.push(`한 번에 ${entry.durationMinutes}분`);
  return facts;
}

/**
 * 한 증상의 7일 답을 처방 판단에 쓰기 좋게 모은다: 말한 부위(겹침 없이) · 하루 최대 횟수 · 한 번 최대 시간 · 기타 이름.
 * 날짜별로 다시 읽지 않아도 '얼마나 심했는지'가 보이게 가장 큰 값을 쓴다.
 */
export function peakFacts(entries: SymptomEntry[]): string[] {
  const told = entries.filter((e) => e.presence !== 'absent');
  const facts: string[] = [];
  const names = [...new Set(told.map((e) => parseDetail(e).otherName).filter((n): n is string => !!n))];
  facts.push(...names);
  const parts = [...new Set(told.filter((e) => e.bodyPart).map((e) => locationName(e.bodyPart!, e.bodySide)))];
  facts.push(...parts);
  const counts = told.map((e) => e.occurrenceCount).filter((n): n is number => n !== undefined);
  if (counts.length) {
    const prefix = COUNT_PREFIX[told[0].symptomType];
    facts.push(`${prefix ? `${prefix} ` : ''}최대 ${Math.max(...counts)}회`);
  }
  const mins = told.map((e) => e.durationMinutes).filter((n): n is number => n !== undefined);
  if (mins.length) facts.push(`한 번에 최대 ${Math.max(...mins)}분`);
  return facts;
}
