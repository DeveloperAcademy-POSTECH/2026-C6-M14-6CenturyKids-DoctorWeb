import { useState } from 'react';
import type { Patient } from '../domain/types.ts';
import { daysBetween, relative } from '../lib/dates.ts';
import { lastRecordDate, reviewCount } from '../lib/patientSummary.ts';
import Avatar from './Avatar.tsx';
import { patientMeta } from './PatientHeader.tsx';

interface Props {
  patients: Patient[];
  selectedId: string;
  today: Date;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function PatientList({ patients, selectedId, today, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const shown = patients
    .filter((p) => !query.trim() || (p.name ?? '').includes(query.trim()))
    .sort((a, b) => (lastRecordDate(b)?.getTime() ?? 0) - (lastRecordDate(a)?.getTime() ?? 0));

  return (
    <section className="panel plist" aria-labelledby="h-plist">
      <div className="panel-head">
        <h2 id="h-plist">환자</h2>
        <span className="hint">{patients.length}명</span>
        <button type="button" className="icon-btn" aria-label="환자 목록 접기" onClick={onClose}>«</button>
      </div>
      <div className="panel-body">
        <input className="search" id="ptSearch" type="search" placeholder="이름으로 찾기" aria-label="환자 이름으로 찾기"
          autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="ptlist">
          {shown.length === 0 && <p className="empty-note">찾는 환자가 없어요</p>}
          {shown.map((p) => {
            const last = lastRecordDate(p);
            const reviews = reviewCount(p, today);
            const latest = p.previsits[0];
            const newPrevisit = latest && daysBetween(latest.submittedAt, today) < 7;
            return (
              <button key={p.id} type="button" className="pt" aria-current={p.id === selectedId} onClick={() => onSelect(p.id)}>
                <Avatar mood={latest?.stateOfMind} />
                <span className="pt-main">
                  <span className="pt-row"><b>{p.name ?? '이름 없음'}</b><small>{last ? relative(last, today) : '기록 없음'}</small></span>
                  <small>{[patientMeta(p), p.cancer].filter(Boolean).join(' · ')}</small>
                  {(reviews > 0 || newPrevisit) && (
                    <span className="pt-tags">
                      {reviews > 0 && <span className="review">검토 필요 {reviews}</span>}
                      {newPrevisit && <span className="badge">진료 전 기록</span>}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
