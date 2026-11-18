import Icon from './Icon.tsx';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { Jump } from './Workspace.tsx';
import { BODY_REGIONS, locationName, scoreColor } from '../domain/labels.ts';
import type { PainRecord } from '../domain/types.ts';
import { dayKey, hm, mdw, shortMdw } from '../lib/dates.ts';
import { useScrollTo } from '../lib/useScrollTo.ts';
import bodyImage from '../assets/pain-body.jpg';
const PainTrend = lazy(() => import('./PainTrend.tsx'));

interface Props {
  records: PainRecord[];
  /** 통증·증상 칸이 함께 보는 7일 */
  days: Date[];
  jump: Jump | null;
}

/** 통증 기록: 몸 그림 부위 + 기록 목록. 진료 전 기록에서 날짜로 오면 그날만 */
/** 몸 그림의 한 자리 (부위·좌우·앞뒤) */
type Region = (typeof BODY_REGIONS)[number];
const regionKey = (g: Region) => `${g.part}.${g.side}.${g.view}`;
/** 기록 한 건이 몸 그림에서 찍히는 자리들 (양쪽이면 좌우 둘, 맞는 좌우가 없으면 그 부위 전체) */
function regionsOf(r: PainRecord): Region[] {
  return r.location.flatMap((loc) => {
    const view = loc.bodyView === 'back' ? 'back' : 'front';
    const sides = loc.bodySide === 'both' ? ['left', 'right'] : [loc.bodySide];
    const hits = BODY_REGIONS.filter((g) => g.part === loc.bodyPart && g.view === view && sides.includes(g.side));
    return hits.length ? hits : BODY_REGIONS.filter((g) => g.part === loc.bodyPart && g.view === view);
  });
}

export default function PainPanel({ records, days, jump }: Props) {
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  // 몸 그림에서 누른 부위: 통증 상세를 그 부위 기록만으로 좁힌다
  const [pickedRegion, setPickedRegion] = useState<string | null>(null);
  // 통증 기록 목록은 처음엔 접어 두고 '전체 보기'를 누르면 그래프와 부위 아래로 펼친다 (위 내용은 그대로).
  // 부위 줄이나 원을 누르면 그 부위 기록만 펼친다
  const [detail, setDetail] = useState(false);
  const { container, scrollTo, toTop } = useScrollTo<HTMLDivElement>();
  const openDetail = (region: string | null) => { setPickedRegion(region); setDetail(true); scrollTo('.pain-records', 'start'); };
  const closeDetail = () => { setDetail(false); setPickedRegion(null); };
  const allOpen = detail && !pickedRegion;
  const toggleAll = () => { if (allOpen) { closeDetail(); } else { openDetail(null); } };

  const byDay = useMemo(() => {
    const map = new Map<string, PainRecord[]>();
    for (const r of records) map.set(dayKey(r.recordedDate), [...(map.get(dayKey(r.recordedDate)) ?? []), r]);
    return map;
  }, [records]);

  // 기간이 바뀌면 고른 날을 풀고 맨 위로 (날짜로 가기는 아래 효과가 다시 고른다)
  const start = days[0]?.getTime();
  useEffect(() => {
    setPickedDay(null);
    setPickedRegion(null);
    setDetail(false);
    toTop();
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!jump) { setPickedDay(null); return; }
    setDetail(false);
    setPickedDay(byDay.has(dayKey(jump.date)) ? dayKey(jump.date) : null);
    setPickedRegion(null);
  }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps

  const inWindow = days.flatMap((t) => byDay.get(dayKey(t)) ?? []);
  const scoped = pickedDay ? byDay.get(pickedDay) ?? [] : inWindow;
  const regionRecords = pickedRegion ? scoped.filter((r) => regionsOf(r).some((g) => regionKey(g) === pickedRegion)) : scoped;
  const regionName = pickedRegion ? (() => { const g = BODY_REGIONS.find((x) => regionKey(x) === pickedRegion); return g ? locationName(g.part, g.side) : ''; })() : '';

  return (
    <section className="panel pain" id="pain-records" tabIndex={-1} aria-labelledby="h-pain">
      <div className="panel-head">
        <span className="panel-symbol" aria-hidden="true"><Icon name="medicine" size={20} /></span>
        <h2 id="h-pain">통증 기록</h2>
        <span className="hint">발생 당시와 1시간 뒤 비교</span>
      </div>
      <div className="panel-body" ref={container}>
        {!inWindow.length ? <p className="empty-note">{records.length ? '선택한 7일에는 통증 기록이 없어요' : '아직 통증 기록이 없어요'}</p> : (
          <>
            {/* 하루만 보는 중이면 7일 그래프는 감춘다 */}
            {!pickedDay && <Suspense fallback={<div className="chart-skeleton" role="status" aria-label="통증 그래프를 불러오는 중"><span /><span /><div /></div>}><PainTrend key={start} records={inWindow} days={days} /></Suspense>}
            <div className="pain-locations">
              <div className="scope">
                {pickedDay && scoped.length ? <h3>{shortMdw(scoped[0].recordedDate)}의 통증 부위</h3> : <h3>통증 부위</h3>}
              </div>
              {scoped.length ? <BodyMap records={scoped} picked={detail ? pickedRegion : null} onPick={(k) => (detail && pickedRegion === k ? setPickedRegion(null) : openDetail(k))} /> : <p className="empty-note">기록이 없어요</p>}
            </div>
            <button type="button" className="detail-open" aria-expanded={allOpen} onClick={toggleAll}>
              <span>{allOpen ? '통증 기록 접기' : '통증 기록 전체 보기'}</span><span className="detail-count">{scoped.length}건</span>
              <span className={`detail-caret ${allOpen ? 'up' : ''}`}><Icon name="chevron" size={16} /></span>
            </button>
            {detail && (
              <div className="pain-records">
                <div className="scope">
                  <h3>{pickedRegion ? `${regionName} 통증 기록` : pickedDay && scoped.length ? `${shortMdw(scoped[0].recordedDate)} 통증 기록` : '통증 기록 전체'} <span className="section-count">{regionRecords.length}건</span></h3>
                  {pickedRegion && <button type="button" onClick={() => setPickedRegion(null)}>모든 부위</button>}
                </div>
                {regionRecords.length > 0 && (
                  <ul className="prec">
                    {[...regionRecords].sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime()).map((r) => (
                      <PainRow key={r.recordedDate.getTime()} record={r} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/**
 * 몸 그림: 원 = 그 부위의 '가장 높은 통증 점수'(강도). 색과 숫자가 같은 뜻이라 횟수와 헷갈리지 않는다.
 * 원을 누르면 아래에 그 부위 기록만 펼쳐 보여 준다 (기록 횟수 같은 자세한 정보는 그 목록에서)
 */
function BodyMap({ records, picked, onPick }: { records: PainRecord[]; picked: string | null; onPick: (key: string) => void }) {
  const pins = new Map<string, { region: Region; count: number; max: number }>();
  for (const r of records) {
    for (const region of regionsOf(r)) {
      const key = regionKey(region);
      const pin = pins.get(key) ?? { region, count: 0, max: 0 };
      pin.count += 1;
      pin.max = Math.max(pin.max, r.painBefore);
      pins.set(key, pin);
    }
  }
  const list = [...pins.values()];
  return (
    <>
      <div className="body-map">
        <img src={bodyImage} alt="" width="1024" height="1024" />
        <span className="face" style={{ left: '4%' }}>앞면</span>
        <span className="face" style={{ right: '4%' }}>뒷면</span>
        {list.map(({ region, count, max }) => {
          const key = regionKey(region);
          const name = locationName(region.part, region.side);
          return (
            // 이미지는 정사각, 칸은 세로 0.94 비율이라 y를 0.94로 나눔
            <button key={key} type="button" className="pin" aria-pressed={picked === key}
              style={{ left: `${region.x * 100}%`, top: `${(region.y / 0.94) * 100}%`, background: scoreColor(max) }}
              aria-label={`${name}, 가장 높은 통증 ${max}점, 기록 ${count}건. ${picked === key ? '모든 부위 보기' : '이 부위 기록만 보기'}`}
              title={`${name} 가장 높은 통증 ${max}점`} onClick={() => onPick(key)}>{max}</button>
          );
        })}
      </div>
      <div className="scale"><span>0</span><span className="bar" /><span>10점</span></div>
      <p className="chart-note">원 안 숫자는 그 부위에서 가장 높았던 통증 점수예요</p>
      {/* 몸 그림만으로는 누를 곳을 알기 어려워, 같은 부위를 글로 된 줄로도 둔다. 줄을 누르면 그 부위 기록 화면으로 */}
      <ul className="region-list" aria-label="부위별 통증">
        {[...list].sort((a, b) => b.max - a.max || b.count - a.count).map(({ region, count, max }) => {
          const key = regionKey(region);
          return (
            <li key={key}>
              <button type="button" className="region-row" onClick={() => onPick(key)}>
                <span className="region-score" style={{ background: scoreColor(max) }}>{max}</span>
                <span className="region-name">{locationName(region.part, region.side)}</span>
                <span className="region-meta">최고 {max}점, 기록 {count}건</span>
                <Icon name="chevron" size={16} />
              </button>
            </li>
          );
        })}
      </ul>
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
        <span className="dot" style={{ background: scoreColor(r.painBefore) }} title="통증 발생 당시">{r.painBefore}</span><Icon name="arrowRight" size={14} />
        {r.painAfter === undefined ? <span className="muted none">기록 없음</span> : (
          <>
            <span className="dot" style={{ background: scoreColor(r.painAfter) }} title="1시간 뒤">{r.painAfter}</span>
            <span className={`delta ${change! < 0 ? 'down' : change! > 0 ? 'up' : 'muted'}`} aria-label={change === 0 ? '변화 없음' : `${Math.abs(change!)}점 ${change! < 0 ? '감소' : '증가'}`}>
              <Icon name={change! < 0 ? 'arrowDown' : change! > 0 ? 'arrowUp' : 'minus'} size={14} />{change === 0 ? <span className="delta-steady">동일</span> : Math.abs(change!)}
            </span>
          </>
        )}
      </div>
    </li>
  );
}
