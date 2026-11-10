import { DETAIL_LABELS } from '../domain/labels.ts';
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
