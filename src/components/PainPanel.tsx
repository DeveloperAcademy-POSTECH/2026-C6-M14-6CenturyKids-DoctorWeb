import { useEffect, useRef } from 'react';
import { locationName } from '../domain/labels.ts';
import { prefersReducedMotion } from '../lib/useMedia.ts';
import type { PainRecord } from '../domain/types.ts';
import { dayKey, hm, mdw } from '../lib/dates.ts';
import BodyMap from './BodyMap.tsx';
import { PainPair, changeWords, painRowLabel } from './PainChange.tsx';

interface Props {
  records: PainRecord[];
  /** 증상·통증이 함께 보는 7일 */
  days: Date[];
  /** 진료 전 기록에서 고른 날 (그 날 기록을 표시) */
  focusDay: string | null;
}

/** 복용 후 통증 변화 자세히: 몸 그림(3단, 내려도 남음) | 날짜별 기록(3단). 기록 줄은 한눈에 보기와 같은 쐐기 모양 */
export default function PainPanel({ records, days, focusDay }: Props) {
  const page = useRef<HTMLElement>(null);
  // 고른 날 기록으로 (증상 자세히와 같은 동작)
  useEffect(() => {
    const el = focusDay ? page.current?.querySelector(`[data-day="${focusDay}"]`) : null;
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }, [focusDay]);
  const keys = new Set(days.map(dayKey));
  const inWindow = records.filter((r) => keys.has(dayKey(r.recordedDate))).sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime());
  const groups: PainRecord[][] = [];
  for (const r of inWindow) {
    const last = groups[groups.length - 1];
    if (last && dayKey(last[0].recordedDate) === dayKey(r.recordedDate)) last.push(r);
    else groups.push([r]);
  }

  return (
    <section className="detail" aria-labelledby="h-pain" ref={page}>
      <div className="detail-head">
        <h2 id="h-pain" className="detail-title">복용 후 통증 변화</h2>
        <span className="hint">약 먹기 전 점수와 먹고 1시간 뒤 점수</span>
      </div>
      {!records.length ? <p className="card empty-note">아직 통증 기록이 없어요</p>
        : !inWindow.length ? <p className="card empty-note">이 기간에는 통증 기록이 없어요</p> : (
          <div className="bento">
            <section className="card span-3 sticky">
              <div className="card-head"><h3 className="card-title">부위별 기록 횟수</h3></div>
              <BodyMap records={inWindow} />
            </section>
            <section className="card span-3">
              <div className="card-head"><h3 className="card-title">이 기간 기록 {inWindow.length}건</h3></div>
              <div className="rows">
                {groups.map((g) => {
                  const day = dayKey(g[0].recordedDate);
                  return (
                    <div key={day} className={`row ${focusDay === day ? 'hit' : ''}`} data-day={day}>
                      <h4 className="label-large">{mdw(g[0].recordedDate)}</h4>
                      <ul className="prec">{g.map((r) => <PainRow key={r.recordedDate.getTime()} record={r} />)}</ul>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
    </section>
  );
}

function PainRow({ record: r }: { record: PainRecord }) {
  return (
    <li aria-label={painRowLabel(r, r.location.map((l) => locationName(l.bodyPart, l.bodySide)).join(', '))}>
      <span className="time">{hm(r.recordedDate)}</span>
      <span className="parts">{r.location.map((l, i) => <span key={i} className="chip">{locationName(l.bodyPart, l.bodySide)}</span>)}</span>
      <PainPair record={r} />
      <span className={`change-words ${r.painAfter === undefined ? 'none' : ''}`}>{changeWords(r)}</span>
    </li>
  );
}
