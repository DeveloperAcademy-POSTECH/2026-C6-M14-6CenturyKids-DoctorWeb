import { useState } from 'react';
import { MOODS, scoreColor } from '../domain/labels.ts';
import type { Patient, SymptomRecord } from '../domain/types.ts';
import { dayKey, hm, mdw, shortMdw } from '../lib/dates.ts';
import Avatar from './Avatar.tsx';

interface Props {
  patient: Patient;
  doctorName: string;
  /** 통증·증상 칸이 함께 보는 7일 */
  days: Date[];
  onJump: (date: Date) => void;
}

/** 진료 전 기록: 최신 1건, [전체보기]로 지난 기록까지. 하고 싶은 말은 원문 그대로 */
export default function PrevisitPanel({ patient, doctorName, days, onJump }: Props) {
  const [showAll, setShowAll] = useState(false);
  const records = showAll ? patient.previsits : patient.previsits.slice(0, 1);
  const keys = new Set(days.map(dayKey));
  const answers = patient.symptoms.filter((r) => r.conditionText && keys.has(dayKey(r.recordedDate)));

  return (
    <section className="panel previsit" aria-labelledby="h-previsit">
      <div className="panel-head">
        <h2 id="h-previsit">진료 전 기록</h2>
        <span className="hint">환자가 쓴 원문</span>
        {patient.previsits.length > 1 && (
          <button type="button" className="icon-btn" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
            {showAll ? '최신만 보기' : `전체보기 (${patient.previsits.length})`}
          </button>
        )}
      </div>
      <div className="panel-body">
        {answers.length > 0 && <ConditionCard records={answers} />}
        {records.length === 0 && <p className="empty-note">아직 보낸 진료 전 기록이 없어요</p>}
        {records.map((r, i) => {
          const mood = MOODS[r.stateOfMind];
          const day = dayKey(r.selectedDate);
          const symptom = patient.symptoms.find((s) => dayKey(s.recordedDate) === day);
          const pains = patient.pains.filter((p) => dayKey(p.recordedDate) === day);
          const presentCount = symptom?.symptoms.filter((e) => e.presence === 'present').length ?? 0;
          const maxPain = pains.length ? Math.max(...pains.map((p) => p.painBefore)) : undefined;
          return (
            <article key={r.submittedAt.getTime()} className={`letter ${i === 0 ? 'latest' : ''}`}>
              <div className="letter-top">
                <Avatar mood={r.stateOfMind} />
                <div className="mood"><b>{mood.title}</b>{mood.caption && <span>{mood.caption}</span>}</div>
                <div className="sent">{mdw(r.submittedAt)}<br />{hm(r.submittedAt)} 보냄</div>
              </div>
              <div className="letter-body">
                <span className="to">To. {doctorName} 선생님</span>
                {r.memo ? <p>{r.memo}</p> : <p className="empty">하고 싶은 말을 남기지 않았어요.</p>}
                <span className="from">From. {patient.name ?? '환자'}</span>
              </div>
              <button type="button" className="attach" onClick={() => onJump(r.selectedDate)}>
                <span>함께 보낸 기록 <b>{mdw(r.selectedDate)}</b></span>
                {symptom && <span className="badge">증상 {presentCount}</span>}
                {maxPain !== undefined && (
                  <span className="badge"><span className="mark" style={{ background: scoreColor(maxPain) }} />통증 {maxPain}점</span>
                )}
                <span className="go" aria-hidden="true">→</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** 음성 대화 첫 질문(컨디션) 답 원문을 날짜별로, 최신 먼저 */
function ConditionCard({ records }: { records: SymptomRecord[] }) {
  const shown = [...records].sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime());
  return (
    <article className="day">
      <div className="day-head"><h3>컨디션 어떠세요?</h3><span className="time">첫 질문에 한 답</span></div>
      <div className="day-body">
        {shown.map((r) => (
          <div key={r.recordedDate.getTime()} className="cond-row">
            <div className="when"><b>{shortMdw(r.recordedDate)}</b> {hm(r.recordedDate)} 통화</div>
            <p>“{r.conditionText}”</p>
          </div>
        ))}
      </div>
    </article>
  );
}
