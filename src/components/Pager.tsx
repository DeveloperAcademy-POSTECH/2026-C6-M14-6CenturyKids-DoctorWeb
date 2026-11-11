const short = (t: Date) => `${t.getMonth() + 1}/${t.getDate()}`;

interface Props {
  days: Date[];
  /** 0 = 가장 최근 7일 */
  k: number;
  max: number;
  onChange: (k: number) => void;
}

/** 환자 띠의 « ‹ › » : 통증·증상 칸이 함께 7일씩 이동 */
export default function Pager({ days, k, max, onChange }: Props) {
  return (
    <div className="pager" role="group" aria-label="보는 기간">
      <button type="button" aria-label="첫 기록 주로" disabled={k === max} onClick={() => onChange(max)}>«</button>
      <button type="button" aria-label="이전 7일" disabled={k === max} onClick={() => onChange(k + 1)}>‹</button>
      <div className="label">
        {short(days[0])} – {short(days[6])}
        <small>{max - k + 1} / {max + 1}주</small>
      </div>
      <button type="button" aria-label="다음 7일" disabled={k === 0} onClick={() => onChange(k - 1)}>›</button>
      <button type="button" aria-label="최근 주로" disabled={k === 0} onClick={() => onChange(0)}>»</button>
    </div>
  );
}
