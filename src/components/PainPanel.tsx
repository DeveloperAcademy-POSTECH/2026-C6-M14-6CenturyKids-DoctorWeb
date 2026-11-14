import { useEffect, useMemo, useState } from 'react';
import type { Jump } from './Workspace.tsx';
import { BODY_REGIONS, locationName, scoreColor } from '../domain/labels.ts';
import type { PainRecord } from '../domain/types.ts';
import { dayKey, hm, mdw, shortMdw } from '../lib/dates.ts';
import { useScrollTo } from '../lib/useScrollTo.ts';
import bodyImage from '../assets/pain-body.jpg';

interface Props {
  records: PainRecord[];
  /** 통증·증상 칸이 함께 보는 7일 */
  days: Date[];
  jump: Jump | null;
}

/** 통증 기록: 몸 그림 부위 + 기록 목록. 진료 전 기록에서 날짜로 오면 그날만 */
export default function PainPanel({ records, days, jump }: Props) {
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const { container, toTop } = useScrollTo<HTMLDivElement>();

  const byDay = useMemo(() => {
    const map = new Map<string, PainRecord[]>();
    for (const r of records) map.set(dayKey(r.recordedDate), [...(map.get(dayKey(r.recordedDate)) ?? []), r]);
    return map;
  }, [records]);

  // 기간이 바뀌면 고른 날을 풀고 맨 위로 (날짜로 가기는 아래 효과가 다시 고른다)
  const start = days[0]?.getTime();
  useEffect(() => {
    setPickedDay(null);
    toTop();
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!jump) return;
    setPickedDay(byDay.has(dayKey(jump.date)) ? dayKey(jump.date) : null);
  }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps

  const inWindow = days.flatMap((t) => byDay.get(dayKey(t)) ?? []);
  const scoped = pickedDay ? byDay.get(pickedDay) ?? [] : inWindow;

  return (
    <section className="panel pain" aria-labelledby="h-pain">
      <div className="panel-head">
        <h2 id="h-pain">통증 기록</h2>
        <span className="hint">통증 발생 당시 → 1시간 뒤 통증 변화 비교</span>
        {records.length > 0 && <span className="range">{records.length}건</span>}
      </div>
      <div className="panel-body" ref={container}>
        {!records.length ? <p className="empty-note">아직 통증 기록이 없어요</p> : (
          <>
            <div className="scope">
              {pickedDay && scoped.length
                ? <><h4>{shortMdw(scoped[0].recordedDate)}의 부위 별 기록 횟수</h4><button type="button" onClick={() => setPickedDay(null)}>7일 전체</button></>
                : <h4>통증 부위 별 기록 횟수</h4>}
            </div>
            {scoped.length ? <BodyMap records={scoped} /> : <p className="empty-note">기록이 없어요</p>}
            <h4>기록 {scoped.length}건</h4>
            {scoped.length > 0 && (
              <ul className="prec">
                {[...scoped].sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime()).map((r) => (
                  <PainRow key={r.recordedDate.getTime()} record={r} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function BodyMap({ records }: { records: PainRecord[] }) {
  const pins = new Map<string, { region: (typeof BODY_REGIONS)[number]; count: number; max: number }>();
  for (const r of records) {
    for (const loc of r.location) {
      const view = loc.bodyView === 'back' ? 'back' : 'front';
      const sides = loc.bodySide === 'both' ? ['left', 'right'] : [loc.bodySide];
      let hits = BODY_REGIONS.filter((g) => g.part === loc.bodyPart && g.view === view && sides.includes(g.side));
      if (!hits.length) hits = BODY_REGIONS.filter((g) => g.part === loc.bodyPart && g.view === view);
      for (const region of hits) {
        const key = `${region.part}.${region.side}.${region.view}`;
        const pin = pins.get(key) ?? { region, count: 0, max: 0 };
        pin.count += 1;
        pin.max = Math.max(pin.max, r.painBefore);
        pins.set(key, pin);
      }
    }
  }
  const list = [...pins.values()];
  return (
    <>
      <div className="body-map" role="img"
        aria-label={`통증 부위: ${list.map((p) => `${locationName(p.region.part, p.region.side)} ${p.count}건`).join(', ') || '없음'}`}>
        <img src={bodyImage} alt="" />
        <span className="face" style={{ left: '4%' }}>앞면</span>
        <span className="face" style={{ right: '4%' }}>뒷면</span>
        {list.map(({ region, count, max }) => (
          // 이미지는 정사각, 칸은 세로 0.94 비율이라 y를 0.94로 나눔
          <span key={`${region.part}.${region.side}.${region.view}`} className="pin"
            style={{ left: `${region.x * 100}%`, top: `${(region.y / 0.94) * 100}%`, background: scoreColor(max) }}
            title={`${locationName(region.part, region.side)} · ${count}건 · 가장 높은 점수 ${max}점`}>{count}</span>
        ))}
      </div>
      <div className="scale"><span>0</span><span className="bar" /><span>10</span></div>
      <p className="chart-note">원 색 = 그 부위의 가장 높은 통증 발생 당시 점수</p>
    </>
  );
}

function PainRow({ record: r }: { record: PainRecord }) {
  const change = r.painAfter === undefined ? undefined : r.painAfter - r.painBefore;
  return (
    <li>
      <div className="when">{mdw(r.recordedDate)}<small>{hm(r.recordedDate)}</small></div>
      <div className="parts">{r.location.map((l, i) => <span key={i} className="badge">{locationName(l.bodyPart, l.bodySide)}</span>)}</div>
      <div className="score">
        <span className="dot" style={{ background: scoreColor(r.painBefore) }} title="통증 발생 당시">{r.painBefore}</span>→
        {r.painAfter === undefined ? <span className="muted none">기록 없음</span> : (
          <>
            <span className="dot" style={{ background: scoreColor(r.painAfter) }} title="1시간 뒤">{r.painAfter}</span>
            <span className={`delta ${change! < 0 ? 'down' : change! > 0 ? 'up' : 'muted'}`}>{change! > 0 ? '+' : ''}{change}</span>
          </>
        )}
      </div>
    </li>
  );
}
