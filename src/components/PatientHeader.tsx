import type { Patient } from '../domain/types.ts';
import { hm, mdw } from '../lib/dates.ts';
import { lastRecordDate } from '../lib/patientSummary.ts';
import Pager from './Pager.tsx';
import Avatar from './Avatar.tsx';
import Icon from './Icon.tsx';
import { Button } from '@fluentui/react-components';

interface Props {
  patient: Patient;
  failed: string[];
  listOpen: boolean;
  onOpenList: () => void;
  /** 통증·증상 칸이 함께 보는 7일 (기록이 없으면 없음) */
  period?: { days: Date[]; k: number; max: number; onChange: (k: number) => void };
}

export const patientMeta = (p: Patient) => [p.sex, p.age !== undefined ? `${p.age}세` : undefined].filter(Boolean).join(' / ');

export default function PatientHeader({ patient, failed, listOpen, onOpenList, period }: Props) {
  const last = lastRecordDate(patient);
  return (
    <header className="patient" aria-label="환자 정보">
      <Button className="open-patients" appearance="subtle" hidden={listOpen} icon={<Icon name="panel" />} onClick={onOpenList}>환자 목록</Button>
      <div className="who"><Avatar mood={patient.previsits[0]?.stateOfMind} size={48} /><div><h1 className="name">{patient.name ?? '이름 없음'}</h1><span className="meta">{patientMeta(patient)}</span></div></div>
      <span className="sep" aria-hidden="true" />
      <dl className="field"><dt>암종</dt><dd>{patient.cancer ?? '-'}</dd></dl>
      <dl className="field last-record"><dt>마지막 기록</dt><dd>{last ? `${mdw(last)} ${hm(last)}` : '없음'}</dd></dl>
      {failed.length > 0 && <span className="load-error" role="alert">{failed.join(', ')}을 불러오지 못했어요</span>}
      {/* 줄이 바뀌어도 기간 이동이 맨 오른쪽에 오게 한 묶음 */}
      <div className="header-end">
        {period && <><span className="period-caption">조회 기간</span><Pager {...period} /></>}
      </div>
    </header>
  );
}
