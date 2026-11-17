import { MOODS } from '../domain/labels.ts';
import type { Patient } from '../domain/types.ts';
import { hm, mdw } from '../lib/dates.ts';
import Avatar from './Avatar.tsx';
import SentDay from './SentDay.tsx';

interface Props {
  patient: Patient;
  onOpenSymptom: (day: Date) => void;
  onOpenPain: () => void;
}

/** 진료 전 기록 자세히: 받은 기록 전부, 최신 먼저. 줄마다 하고 싶은 말·마음(4단) | 함께 보낸 날(2단) */
export default function PrevisitPanel({ patient, onOpenSymptom, onOpenPain }: Props) {
  return (
    <section className="detail" aria-labelledby="h-previsit">
      <div className="detail-head">
        <h2 id="h-previsit" className="detail-title">진료 전 기록</h2>
        <span className="hint">환자가 보낸 원문 {patient.previsits.length}건</span>
      </div>
      {patient.previsits.length === 0 && <p className="card empty-note">아직 보낸 진료 전 기록이 없어요</p>}
      {patient.previsits.map((r, i) => (
        <div key={r.submittedAt.getTime()} className="bento">
          <article className="card span-4">
            <div className="card-head">
              <h3 className="card-title">{mdw(r.submittedAt)} {hm(r.submittedAt)}에 보냄</h3>
              {i === 0 && <span className="badge">가장 최근</span>}
            </div>
            <div className="mood-row">
              <Avatar mood={r.stateOfMind} size={48} />
              <div>
                <span className="t-meta">환자가 고른 마음</span>
                <b className="t-main">{MOODS[r.stateOfMind].title}</b>
                {MOODS[r.stateOfMind].caption && <p className="t-sub muted">{MOODS[r.stateOfMind].caption}</p>}
              </div>
            </div>
            {r.memo ? <p className="memo">{r.memo}</p> : <p className="memo empty">하고 싶은 말을 남기지 않았어요.</p>}
          </article>
          <article className="card span-2">
            <div className="card-head"><h3 className="card-title">진료 때 이야기하고 싶은 날</h3></div>
            <SentDay patient={patient} date={r.selectedDate} onOpenSymptom={() => onOpenSymptom(r.selectedDate)} onOpenPain={onOpenPain} />
          </article>
        </div>
      ))}
    </section>
  );
}
