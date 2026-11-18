import type { Patient } from '../domain/types.ts';
import { dashboardSummary } from '../lib/dashboardSummary.ts';

export default function RecordSummary({ patient, days }: { patient: Patient; days: Date[] }) {
  const summary = dashboardSummary(patient, days);
  return (
    <dl className="record-summary" aria-label="조회 기간 기록 요약">
      <div><dt>환자가 기록을 남긴 날</dt><dd>{summary.recordedDays}<span>일</span></dd></div>
      <div><dt>통증 기록</dt><dd>{summary.painCount}<span>건</span></dd></div>
      <div><dt>최고 통증</dt><dd className={summary.maxPain === undefined ? 'no-value' : undefined}>{summary.maxPain ?? '없음'}<span>{summary.maxPain === undefined ? '' : '/ 10점'}</span></dd><p>통증 발생 당시 기준</p></div>
    </dl>
  );
}
