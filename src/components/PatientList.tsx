import { useState, type ReactNode } from 'react';
import type { Patient } from '../domain/types.ts';
import { daysBetween, relative } from '../lib/dates.ts';
import { lastRecordDate, reviewCount } from '../lib/patientSummary.ts';
import Avatar from './Avatar.tsx';
import Chevron from './Chevron.tsx';

interface Props {
  patients: Patient[];
  selectedId: string | null;
  today: Date;
  onSelect: (id: string) => void;
  notice: ReactNode;
}

const sexAge = (p: Patient) => [p.sex ? `${p.sex}성` : undefined, p.age !== undefined ? `${p.age}세` : undefined].filter(Boolean).join(' ');

/** 환자 목록 (피그마 07 Doctor iPad '환자 목록', Patient Row): 마지막 기록이 최신인 순. 누르면 한눈에 보기로 */
export default function PatientList({ patients, selectedId, today, onSelect, notice }: Props) {
  const [query, setQuery] = useState('');
  const shown = patients
    .filter((p) => !query.trim() || (p.name ?? '').includes(query.trim()))
    .sort((a, b) => (lastRecordDate(b)?.getTime() ?? 0) - (lastRecordDate(a)?.getTime() ?? 0));

  return (
    <main className="screen list-screen">
      <header className="list-head">
        <h1 className="screen-title">환자 목록</h1>
        <span className="list-count">{patients.length}명</span>
        {patients.length > 0 && (
          <input className="search end" type="search" placeholder="이름으로 찾기" aria-label="환자 이름으로 찾기"
            autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
        )}
      </header>
      {notice}
      {patients.length === 0 ? (
        <div className="empty-block">
          <b>아직 연결된 환자가 없어요.</b>
          <p>환자가 앱에서 선생님의 의사 코드를 넣으면 여기에 보여요.</p>
        </div>
      ) : (
        <div className="ptable">
          <div className="pt pt-cols" aria-hidden="true">
            <span>이름</span><span>성별과 나이</span><span>암종</span><span>최근 7일</span><span>마지막 기록</span><span />
          </div>
          {shown.length === 0 && <p className="empty-note">찾는 환자가 없어요</p>}
          <ul className="ptlist">
            {shown.map((p) => {
              const last = lastRecordDate(p);
              const reviews = reviewCount(p, today);
              const latest = p.previsits[0];
              const newPrevisit = latest && daysBetween(latest.submittedAt, today) < 7;
              return (
                <li key={p.id}>
                  <button type="button" className="pt" aria-current={p.id === selectedId ? 'true' : undefined} onClick={() => onSelect(p.id)}>
                    <span className="pt-name"><Avatar mood={latest?.stateOfMind} /><b>{p.name ?? '이름 없음'}</b></span>
                    <span className="pt-cell">{sexAge(p) || '-'}</span>
                    <span className="pt-cell">{p.cancer ?? '-'}</span>
                    <span className="pt-tags">
                      {newPrevisit && <span className="badge">새 진료 전 기록</span>}
                      {reviews > 0 && <span className="badge">확인 요청 답 {reviews}개</span>}
                    </span>
                    <span className="pt-cell sub">{last ? relative(last, today) : '기록 없음'}</span>
                    <span className="pt-go"><Chevron /></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
