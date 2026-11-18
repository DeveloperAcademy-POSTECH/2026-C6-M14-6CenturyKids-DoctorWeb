import { useEffect, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PainRecord } from '../domain/types.ts';
import { locationName, scoreColor } from '../domain/labels.ts';
import { dayKey, hm } from '../lib/dates.ts';
import { painTrendData } from '../lib/painTrendData.ts';

// 그래프 안쪽 자리. 날짜 칸은 위로 조금, 아래로 날짜 글자까지 덮는다 (아래 LineChart의 margin, YAxis width, XAxis padding과 같은 값)
const PLOT = { left: 24 + 8, right: 10 + 8, top: 14, bottom: 4 + 32 };

/**
 * 7일 통증 추이. 그래프 아래 날짜가 버튼이다: 날짜를 누르면 그 날짜 세로줄(그날 점들)이 칠해지고
 * 그래프 바로 아래에 그날 기록 상세가 뜬다. 칠해진 줄 = '지금 보고 있는 날'.
 * (아래 목록으로 내려가지 않는다. 같은 날을 다시 누르거나, 바깥을 누르거나, Esc로 닫는다)
 */
export default function PainTrend({ records, days }: { records: PainRecord[]; days: Date[] }) {
  const data = painTrendData(records, days);
  const [selected, setSelected] = useState<string | null>(null);
  const figure = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!selected) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !figure.current?.contains(e.target as Node)) setSelected(null);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [selected]);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const step = data.length > 1 ? (width - PLOT.left - PLOT.right) / (data.length - 1) : 0;
  const index = data.findIndex((d) => d.key === selected);
  const dayRecords = selected ? records.filter((r) => dayKey(r.recordedDate) === selected).sort((a, b) => a.recordedDate.getTime() - b.recordedDate.getTime()) : [];

  return (
    <figure className="pain-trend" ref={figure}>
      <figcaption><h3>7일 통증 추이</h3><span>아래 날짜를 누르면 그날 기록을 보여 줘요</span></figcaption>
      <div className="trend-legend"><span><i className="line-before" />발생 당시</span><span><i className="line-after" />1시간 뒤</span><span className="trend-note">하루에 여러 번이면 마지막 기록</span></div>
      <div className="pain-chart" ref={box} aria-label="날짜별 발생 당시와 1시간 뒤 통증 점수">
        {/* 고른 날 칸 */}
        {index >= 0 && step > 0 && (
          <span className="day-band picked" aria-hidden="true"
            style={{ left: PLOT.left + index * step - step / 2, width: step, top: PLOT.top - 6, bottom: 4 }} />
        )}
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <LineChart data={data} margin={{ top: PLOT.top, right: 10, bottom: 4, left: 0 }} accessibilityLayer
            onClick={(state) => {
              const st = state as { activeLabel?: string | number; activeTooltipIndex?: number | string | null } | null;
              const i = Number(st?.activeTooltipIndex);
              const day = Number.isInteger(i) ? data[i] : data.find((d) => d.label === st?.activeLabel);
              if (day) setSelected(day.key === selected ? null : day.key);
            }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} height={32} tick={false} padding={{ left: 8, right: 8 }} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} axisLine={false} tickLine={false} width={24} tickMargin={8} tick={{ fill: 'var(--fg-sub)', fontSize: 13 }} />
            <Tooltip content={() => null} cursor={false} isAnimationActive={false} />
            <Line name="발생 당시" type="linear" dataKey="before" stroke="var(--chart-before)" strokeWidth={1.75} strokeDasharray="5 4" dot={{ r: 2.75, fill: 'var(--surface)', strokeWidth: 1.5 }} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
            <Line name="1시간 뒤" type="linear" dataKey="after" stroke="var(--chart-after)" strokeWidth={2.25} dot={{ r: 3, fill: 'var(--chart-after)', stroke: 'var(--surface)', strokeWidth: 1.5 }} activeDot={{ r: 4.5, stroke: 'var(--surface)', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        {/* 날짜 버튼: 그래프 x축 자리에 날짜마다 하나 */}
        {step > 0 && (
          <div className="trend-days">
            {data.map((d, i) => (
              <button key={d.key} type="button" className="trend-day" aria-pressed={d.key === selected}
                aria-label={`${d.fullDate} 통증 기록 보기`}
                style={{ left: PLOT.left + i * step - step / 2, width: step }}
                onClick={() => setSelected(d.key === selected ? null : d.key)}>{d.label}</button>
            ))}
          </div>
        )}
      </div>
      {index >= 0 && (
        <div className="day-detail" role="dialog" aria-label={`${data[index].fullDate} 통증 기록`}
          style={{ ['--caret' as string]: `${PLOT.left + index * step}px` }}>
          <div className="day-detail-head"><b>{data[index].fullDate}</b><span>{dayRecords.length ? `통증 기록 ${dayRecords.length}건` : '기록 없음'}</span>
            <button type="button" aria-label="닫기" onClick={() => setSelected(null)}>×</button></div>
          {dayRecords.length > 0 && (
            <ul>
              {dayRecords.map((r) => (
                <li key={r.recordedDate.getTime()}>
                  <span className="dd-time">{hm(r.recordedDate)}</span>
                  <span className="dd-parts">{r.location.map((l) => locationName(l.bodyPart, l.bodySide)).join(', ')}</span>
                  <span className="dd-score">
                    <i style={{ background: scoreColor(r.painBefore) }} title="발생 당시">{r.painBefore}</i>→
                    {r.painAfter === undefined ? <em>기록 없음</em> : <i style={{ background: scoreColor(r.painAfter) }} title="1시간 뒤">{r.painAfter}</i>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <table className="visually-hidden"><caption>일별 마지막 통증 기록</caption><thead><tr><th>날짜</th><th>발생 당시</th><th>1시간 뒤</th></tr></thead><tbody>{data.map((d) => <tr key={d.key}><th>{d.fullDate}</th><td>{d.before ?? '기록 없음'}</td><td>{d.after ?? '기록 없음'}</td></tr>)}</tbody></table>
    </figure>
  );
}
