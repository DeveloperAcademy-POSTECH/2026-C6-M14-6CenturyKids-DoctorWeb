import { useId } from 'react';
import type { PainRecord } from '../domain/types.ts';
import { hm, shortMdw } from '../lib/dates.ts';

/**
 * 작은 쐐기: 환자 앱 통증 슬라이더(오른쪽으로 갈수록 높아지는 쐐기)를 줄인 모양.
 * 점수만큼 왼쪽부터 차오르고, 색은 앱과 같이 위치에 따라 연두 → 빨강(chart/score). 밝은 화면은 같은 계열을 진하게(--w*).
 * 환자가 앱에서 고른 모양 그대로라 의사 화면과 이어진다. 세기는 높이로, 정확한 값은 옆 숫자로 읽는다.
 */
export function Wedge({ score }: { score: number }) {
  const id = useId();
  return (
    <svg className="wedge" viewBox="0 0 40 16" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--w0)" />
          <stop offset="0.25" stopColor="var(--w25)" />
          <stop offset="0.5" stopColor="var(--w50)" />
          <stop offset="0.75" stopColor="var(--w75)" />
          <stop offset="1" stopColor="var(--w100)" />
        </linearGradient>
        <clipPath id={`${id}c`}><rect x="0" y="0" width={score * 4} height="16" /></clipPath>
      </defs>
      <path d="M1 15.5 L39 15.5 L39 1.5 Z" className="wedge-track" />
      <path d="M1 15.5 L39 15.5 L39 1.5 Z" fill={`url(#${id}g)`} clipPath={`url(#${id}c)`} />
    </svg>
  );
}

/** 약 먹기 전 쐐기·점수 → 먹고 1시간 뒤 쐐기·점수 */
export function PainPair({ record: r }: { record: PainRecord }) {
  return (
    <span className="pain-pair" aria-hidden="true">
      <span className="pain-score"><Wedge score={r.painBefore} /><b>{r.painBefore}</b></span>
      <span className="pair-arrow">→</span>
      {r.painAfter === undefined
        ? <span className="pain-score empty"><Wedge score={0} /><b>–</b></span>
        : <span className="pain-score"><Wedge score={r.painAfter} /><b>{r.painAfter}</b></span>}
    </span>
  );
}

/** 바뀐 점수를 말로: "4점 낮아짐". 색으로 좋고 나쁨을 나타내지 않는다.
 *  1시간 뒤 점수가 없으면 '기록 없음' (판 라벨과 쐐기 자리 '–'가 무엇이 없는지 말해 준다) */
export function changeWords(r: PainRecord) {
  if (r.painAfter === undefined) return '기록 없음';
  const c = r.painAfter - r.painBefore;
  return c < 0 ? `${-c}점 낮아짐` : c > 0 ? `${c}점 높아짐` : '그대로';
}

export const painRowLabel = (r: PainRecord, parts: string) =>
  `${shortMdw(r.recordedDate)} ${hm(r.recordedDate)} ${parts}, 약 먹기 전 ${r.painBefore}점${r.painAfter === undefined ? ', 1시간 뒤 기록 없음' : `, 먹고 1시간 뒤 ${r.painAfter}점`}`;
