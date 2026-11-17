import Chevron from './Chevron.tsx';

const short = (t: Date) => `${t.getMonth() + 1}/${t.getDate()}`;

interface Props {
  days: Date[];
  /** 0 = 가장 최근 7일 */
  k: number;
  max: number;
  onChange: (k: number) => void;
}

/**
 * 통증과 증상을 보는 7일 넘기기 (진료 전 기록은 늘 가장 최근 것이라 바뀌지 않는다는 걸 아랫줄에 밝힌다)
 * 넘기기: ‹ 이전 7일 · 다음 7일 ›. 가장 최근이 아닐 때만 '최근으로' 글자 버튼이 나온다.
 * (« » 두 겹 화살표는 한 겹과 뜻이 구분되지 않아 쓰지 않는다)
 */
export default function Pager({ days, k, max, onChange }: Props) {
  return (
    <div className="pager-wrap">
      {k > 0 && <button type="button" className="soft-btn" onClick={() => onChange(0)}>최근으로</button>}
      <div className="pager" role="group" aria-label="보는 기간">
        <button type="button" aria-label="이전 7일" disabled={k === max} onClick={() => onChange(k + 1)}><Chevron dir="left" /></button>
        <div className="label" aria-live="polite">
          {short(days[0])} – {short(days[6])}
          <small>{k === 0 ? '통증과 증상 최근 7일' : `통증과 증상 ${k}주 전`}</small>
        </div>
        <button type="button" aria-label="다음 7일" disabled={k === 0} onClick={() => onChange(k - 1)}><Chevron /></button>
      </div>
    </div>
  );
}
