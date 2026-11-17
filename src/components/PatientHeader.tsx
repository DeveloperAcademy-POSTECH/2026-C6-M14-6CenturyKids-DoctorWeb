import type { Patient } from '../domain/types.ts';
import { hm, mdw } from '../lib/dates.ts';
import { lastRecordDate } from '../lib/patientSummary.ts';
import Pager from './Pager.tsx';
import Chevron from './Chevron.tsx';

interface Props {
  patient: Patient;
  /** 위로 한 단계 (이름 왼쪽 ‹). label은 돌아갈 화면 이름 */
  back: { label: string; onClick: () => void };
  /** 증상·통증이 함께 보는 7일 (기록이 없으면 없음) */
  period?: { days: Date[]; k: number; max: number; onChange: (k: number) => void };
}

/** '여성 67세' (점 대신 띄어 쓴다) */
export const patientMeta = (p: Patient) => [p.sex ? `${p.sex}성` : undefined, p.age !== undefined ? `${p.age}세` : undefined].filter(Boolean).join(' ');

/** 환자 기록 맨 위 (내려도 남는다): 고른 환자 이름이 가장 크게, 오른쪽에 7일 넘기기 */
export default function PatientHeader({ patient, back, period }: Props) {
  const last = lastRecordDate(patient);
  return (
    <header className="patient" aria-label="환자 정보">
      <button type="button" className="back-btn" onClick={back.onClick} aria-label={`${back.label}${/[가-힣]/.test(back.label.slice(-1)) && (back.label.charCodeAt(back.label.length - 1) - 0xac00) % 28 ? '으로' : '로'} 돌아가기`} title={back.label}>
        <Chevron dir="left" />
      </button>
      <div className="who">
        <h1 className="name">{patient.name ?? '이름 없음'}</h1>
        <p className="meta">
          {patientMeta(patient) && <span>{patientMeta(patient)}</span>}
          {patient.cancer && <span>{patient.cancer}</span>}
          <span>마지막 기록 <b>{last ? `${mdw(last)} ${hm(last)}` : '없음'}</b></span>
        </p>
      </div>
      {period && <Pager {...period} />}
    </header>
  );
}
