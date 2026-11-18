import Icon from './Icon.tsx';
import { Button } from '@fluentui/react-components';
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
    <div className="period-control">
      {k > 0 && <Button appearance="subtle" size="small" className="latest-week" aria-label="최근 주로" onClick={() => onChange(0)}>최근으로</Button>}
      <div className="pager" role="group" aria-label="보는 기간">
        <Button appearance="subtle" size="small" icon={<span className="backwards"><Icon name="chevron" size={18} /></span>} aria-label="이전 7일" disabled={k === max} onClick={() => onChange(k + 1)} />
        <div className="label" aria-live="polite" aria-atomic="true">
          {short(days[0])} ~ {short(days[6])}
          <small>{k === 0 ? '통증과 증상 최근 7일' : `통증과 증상 ${k}주 전`}</small>
        </div>
        <Button appearance="subtle" size="small" icon={<Icon name="chevron" size={18} />} aria-label="다음 7일" disabled={k === 0} onClick={() => onChange(k - 1)} />
      </div>
    </div>
  );
}
