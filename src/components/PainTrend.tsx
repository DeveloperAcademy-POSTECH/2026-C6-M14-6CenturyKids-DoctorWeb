import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PainRecord } from '../domain/types.ts';
import { painTrendData, type PainTrendDay } from '../lib/painTrendData.ts';

export default function PainTrend({ records, days }: { records: PainRecord[]; days: Date[] }) {
  const data = painTrendData(records, days);
  return (
    <figure className="pain-trend">
      <figcaption><h3>7일 통증 추이</h3><span>일별 마지막 기록 · 0~10점</span></figcaption>
      <div className="trend-legend"><span><i className="line-before" />발생 당시</span><span><i className="line-after" />1시간 뒤</span></div>
      <div className="pain-chart" aria-label="날짜별 발생 당시와 1시간 뒤 통증 점수">
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <LineChart data={data} margin={{top:14,right:10,bottom:4,left:0}} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tickMargin={12} height={32} tick={{fill:'var(--fg-sub)',fontSize:12}} padding={{left:8,right:8}} />
            <YAxis domain={[0,10]} ticks={[0,2,4,6,8,10]} axisLine={false} tickLine={false} width={24} tickMargin={8} tick={{fill:'var(--fg-sub)',fontSize:12}} />
            <Tooltip content={<PainTooltip />} cursor={{stroke:'var(--chart-cursor)',strokeWidth:1,strokeDasharray:'3 3'}} isAnimationActive={false} />
            <Line name="발생 당시" type="linear" dataKey="before" stroke="var(--chart-before)" strokeWidth={1.75} strokeDasharray="5 4" dot={{r:2.75,fill:'var(--surface)',strokeWidth:1.5}} activeDot={{r:4,strokeWidth:2}} connectNulls={false} isAnimationActive={false} />
            <Line name="1시간 뒤" type="linear" dataKey="after" stroke="var(--chart-after)" strokeWidth={2.25} dot={{r:3,fill:'var(--chart-after)',stroke:'var(--surface)',strokeWidth:1.5}} activeDot={{r:4.5,stroke:'var(--surface)',strokeWidth:2}} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="visually-hidden"><caption>일별 마지막 통증 기록</caption><thead><tr><th>날짜</th><th>발생 당시</th><th>1시간 뒤</th></tr></thead><tbody>{data.map(d=><tr key={d.key}><th>{d.fullDate}</th><td>{d.before ?? '기록 없음'}</td><td>{d.after ?? '기록 없음'}</td></tr>)}</tbody></table>
    </figure>
  );
}
function PainTooltip({ active, payload }: { active?: boolean; payload?: { payload?: PainTrendDay }[] }) {
  const day=payload?.[0]?.payload;
  if (!active || !day) return null;
  return <div className="pain-tooltip"><b>{day.fullDate}</b><div><span><i className="tooltip-before"/>발생 당시</span><strong>{day.before === null ? '기록 없음' : `${day.before}점`}</strong></div><div><span><i className="tooltip-after"/>1시간 뒤</span><strong>{day.after === null ? '기록 없음' : `${day.after}점`}</strong></div></div>;
}
