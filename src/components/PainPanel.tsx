import { useEffect, useMemo, useState } from 'react';
import type { Jump } from './Workspace.tsx';
import { BODY_REGIONS, locationName, scoreColor } from '../domain/labels.ts';
import type { PainRecord } from '../domain/types.ts';
import { dayKey, hm, mdw, shortMdw, weekday } from '../lib/dates.ts';
import { useScrollTo } from '../lib/useScrollTo.ts';
import bodyImage from '../assets/pain-body.jpg';

interface Props {
  records: PainRecord[];
  /** 통증·증상 칸이 함께 보는 7일 */
  days: Date[];
  jump: Jump | null;
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round1 = (v: number) => String(Math.round(v * 10) / 10);

/** 통증 기록: 앱 주 그래프 + 몸 그림 부위 + 기록 목록. 날짜를 누르면 그날만 */
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
  const pairs = inWindow.filter((r) => r.painAfter !== undefined);

  let headline = <strong>이 기간 통증 기록이 없어요</strong>;
  if (pairs.length) {
    const diff = avg(pairs.map((r) => r.painBefore)) - avg(pairs.map((r) => r.painAfter!));
    headline = diff > 0.05 ? <><strong>평균 {round1(diff)}점 낮아졌어요</strong><span className="arrow down">↓</span></>
      : diff < -0.05 ? <><strong>평균 {round1(-diff)}점 높아졌어요</strong><span className="arrow up">↑</span></>
      : <strong>평균 변화가 없어요</strong>;
  } else if (inWindow.length) {
    headline = <strong>1시간 뒤 점수가 아직 없어요</strong>;
  }
  const peak = inWindow.length ? Math.max(...inWindow.map((r) => Math.max(r.painBefore, r.painAfter ?? 0))) : undefined;

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
            <div className="headline">
              <h4>통증 발생 당시와 1시간 뒤 통증 변화 그래프</h4>
              <span className="change">{headline}{peak !== undefined && <span className="peak">· 이 기간 최고 <b>{peak}</b>점</span>}</span>
            </div>
            <PainChart days={days} byDay={byDay} picked={pickedDay}
              onPick={(day) => setPickedDay(pickedDay === day ? null : day)} />
            <div className="chart-note">
              <span><ArrowKey up={false} />통증감소</span>
              <span><ArrowKey up />통증증가</span>
              <span><i style={{ background: 'var(--surface)', border: '3px solid var(--fg-sub)', height: 4, width: 12 }} />통증 발생 당시만 기록</span>
            </div>
            <div className="scope">
              {pickedDay && scoped.length
                ? <><h4>{shortMdw(scoped[0].recordedDate)}의 부위 별 기록 횟수</h4><button type="button" onClick={() => setPickedDay(null)}>7일 전체</button></>
                : <><h4>통증 부위 별 기록 횟수</h4><span>상단의 그래프를 클릭하면 그 날의 통증 부위와 기록 횟수를 확인할 수 있어요</span></>}
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

function PainChart({ days, byDay, picked, onPick }: {
  days: Date[];
  byDay: Map<string, PainRecord[]>;
  picked: string | null;
  onPick: (day: string) => void;
}) {
  const W = 420, H = 248, L = 32, R = 8, T = 14, B = 56;
  const ph = H - T - B, cw = (W - L - R) / 7;
  const y = (v: number) => T + ((10 - v) / 10) * ph;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="7일 통증 점수 그래프">
      {Array.from({ length: 11 }, (_, v) => v % 5 === 0 ? (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end">{v}</text>
        </g>
      ) : <line key={v} x1={L - 12} x2={L - 6} y1={y(v)} y2={y(v)} stroke="var(--line)" />)}
      {days.map((t, i) => {
        const day = dayKey(t), rs = byDay.get(day) ?? [], cx = L + cw * (i + 0.5), selected = picked === day;
        const pairs = rs.filter((r) => r.painAfter !== undefined);
        let marks: JSX.Element;
        if (pairs.length) {
          const before = avg(pairs.map((r) => r.painBefore)), after = avg(pairs.map((r) => r.painAfter!));
          const up = after > before, color = up ? 'var(--up)' : 'var(--down)';
          // 통증 발생 당시는 동그라미, 1시간 뒤는 바뀐 쪽을 향한 화살촉. 막대는 화살촉 밑변에서 끝나게
          const ya = y(after), d = up ? -1 : 1, base = ya - 6 * d;
          const top = Math.min(y(before), base), bottom = Math.max(y(before), base);
          marks = (
            <>
              <rect x={cx - 9} y={top} width={18} height={Math.max(0, bottom - top)} fill={color} />
              <circle cx={cx} cy={y(before)} r={10} fill={color} />
              <circle cx={cx} cy={y(before)} r={5} fill="var(--surface)" />
              {after !== before && (
                <path d={`M ${cx - 10} ${base} L ${cx + 10} ${base} L ${cx} ${ya + 9 * d} Z`}
                  fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
              )}
            </>
          );
        } else if (rs.length) {
          marks = <circle cx={cx} cy={y(avg(rs.map((r) => r.painBefore)))} r={8} fill="var(--surface)" stroke="var(--fg-sub)" strokeWidth={4} />;
        } else {
          marks = <rect x={cx - 8} y={y(0) - 18} width={16} height={4} rx={2} fill="var(--track)" />;
        }
        const pick = () => rs.length && onPick(day);
        return (
          <g key={day} className="col" tabIndex={rs.length ? 0 : -1} role="button" aria-pressed={selected}
            aria-label={`${mdw(t)} 통증 ${rs.length}건`} onClick={pick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }}>
            <rect className="hit" x={cx - cw / 2 + 2} y={T - 8} width={cw - 4} height={H - T + 4} rx={8}
              fill={selected ? 'var(--surface-2)' : 'transparent'} stroke={selected ? 'var(--line)' : 'none'} />
            {marks}
            <text x={cx} y={H - 29} textAnchor="middle" style={{ fill: rs.length ? 'var(--fg)' : 'var(--fg-faint)' }}>{t.getMonth() + 1}/{t.getDate()}</text>
            <text x={cx} y={H - 9} textAnchor="middle" style={{ fontFamily: 'var(--sans)' }}>{weekday(t)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** 범례: 막대 + 바뀐 쪽을 향한 화살촉 */
function ArrowKey({ up }: { up: boolean }) {
  const color = up ? 'var(--up)' : 'var(--down)';
  return (
    <svg className="key" width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
      <rect x="4" y={up ? 7 : 0} width="4" height="9" fill={color} />
      <path d={up ? 'M 0 8 L 12 8 L 6 1 Z' : 'M 0 8 L 12 8 L 6 15 Z'} fill={color} />
    </svg>
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
        {r.painAfter === undefined ? <span className="muted" style={{ fontSize: 13 }}>기록 없음</span> : (
          <>
            <span className="dot" style={{ background: scoreColor(r.painAfter) }} title="1시간 뒤">{r.painAfter}</span>
            <span className={`delta ${change! < 0 ? 'down' : change! > 0 ? 'up' : 'muted'}`}>{change! > 0 ? '+' : ''}{change}</span>
          </>
        )}
      </div>
    </li>
  );
}
