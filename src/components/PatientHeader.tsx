import type { Patient } from '../domain/types.ts';
import { hm, mdw } from '../lib/dates.ts';
import { lastRecordDate } from '../lib/patientSummary.ts';

interface Props {
  patient: Patient;
  doctorName: string;
  sample: boolean;
  failed: string[];
  listOpen: boolean;
  onOpenList: () => void;
  onSignOut: () => void;
}

export const patientMeta = (p: Patient) => [p.sex, p.age !== undefined ? `${p.age}세` : undefined].filter(Boolean).join(' · ');

export default function PatientHeader({ patient, doctorName, sample, failed, listOpen, onOpenList, onSignOut }: Props) {
  const last = lastRecordDate(patient);
  return (
    <header className="patient" aria-label="환자 정보">
      <button type="button" className="icon-btn" hidden={listOpen} onClick={onOpenList}>» 환자 목록</button>
      <div className="who"><span className="name">{patient.name ?? '이름 없음'}</span><span className="meta">{patientMeta(patient)}</span></div>
      <span className="sep" aria-hidden="true" />
      <dl className="field"><dt>암종</dt><dd>{patient.cancer ?? '-'}</dd></dl>
      <dl className="field"><dt>마지막 기록</dt><dd>{last ? `${mdw(last)} ${hm(last)}` : '없음'}</dd></dl>
      {sample && <span className="sample">예시 데이터</span>}
      {failed.length > 0 && <span className="review">{failed.join(', ')}을 불러오지 못했어요</span>}
      <div className="account">
        {doctorName && <span>{doctorName} 선생님</span>}
        <button type="button" className="icon-btn" onClick={onSignOut}>{sample ? '예시 닫기' : '로그아웃'}</button>
      </div>
    </header>
  );
}
