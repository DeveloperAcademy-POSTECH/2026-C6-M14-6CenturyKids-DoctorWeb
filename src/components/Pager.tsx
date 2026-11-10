import { md } from '../lib/dates.ts';

interface Props {
  days: Date[];
  /** 0 = 가장 최근 7일 */
  k: number;
  max: number;
  total: number;
  onChange: (k: number) => void;
}

/** 칸 아래 « ‹ › » : 그 칸만 7일씩 이동 */
export default function Pager({ days, k, max, total, onChange }: Props) {
  return (
    <div className="panel-foot pager">
      <button type="button" aria-label="첫 기록 주로" disabled={k === max} onClick={() => onChange(max)}>«</button>
      <button type="button" aria-label="이전 7일" disabled={k === max} onClick={() => onChange(k + 1)}>‹</button>
      <div className="label">
        {md(days[0])} – {md(days[6])}
        <small>{max - k + 1} / {max + 1}주 · 이 기간 {total}건</small>
      </div>
      <button type="button" aria-label="다음 7일" disabled={k === 0} onClick={() => onChange(k - 1)}>›</button>
      <button type="button" aria-label="최근 주로" disabled={k === 0} onClick={() => onChange(0)}>»</button>
    </div>
  );
}
