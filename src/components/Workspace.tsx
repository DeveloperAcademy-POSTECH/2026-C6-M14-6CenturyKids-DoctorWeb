import { useEffect, useMemo, useState } from 'react';
import type { Patient } from '../domain/types.ts';
import { weekWindows } from '../lib/dates.ts';
import { lastRecordDate } from '../lib/patientSummary.ts';
import { useMedia } from '../lib/useMedia.ts';
import PainPanel from './PainPanel.tsx';
import PatientHeader from './PatientHeader.tsx';
import PatientList from './PatientList.tsx';
import PrevisitPanel from './PrevisitPanel.tsx';
import SymptomPanel from './SymptomPanel.tsx';

/** 진료 전 기록의 '함께 보낸 기록'을 누르면 통증·증상 칸이 그 날로 간다 */
export interface Jump {
  date: Date;
  seq: number;
}

interface Props {
  patients: Patient[];
  doctorName: string;
  today: Date;
  /** 예시 데이터일 때만 위쪽 띠에 표시 */
  sample: boolean;
  /** 읽지 못한 부분 ("진료 전 기록") */
  failed: string[];
  onSignOut: () => void;
}

// 아이패드 가로까지(1399px 이하)는 환자 목록이 화면 위에 덮는 서랍
const DRAWER_QUERY = '(max-width: 1399px)';

export default function Workspace({ patients, doctorName, today, sample, failed, onSignOut }: Props) {
  const drawer = useMedia(DRAWER_QUERY);
  const [listOpen, setListOpen] = useState(!drawer);
  useEffect(() => setListOpen(!drawer), [drawer]);

  const [patientId, setPatientId] = useState(() =>
    [...patients].sort((a, b) => (lastRecordDate(b)?.getTime() ?? 0) - (lastRecordDate(a)?.getTime() ?? 0))[0]?.id);
  const patient = patients.find((p) => p.id === patientId);
  const [jump, setJump] = useState<Jump | null>(null);
  // 통증·증상 칸은 같은 7일을 함께 본다 (기준은 두 기록 중 더 늦은 날)
  const windows = useMemo(() => patient && weekWindows([...patient.symptoms, ...patient.pains].map((r) => r.recordedDate)), [patient]);
  const [k, setK] = useState(0);

  if (!patient) {
    return (
      <div className="center-note">
        <p>아직 연결된 환자가 없어요.<br />환자가 앱에서 선생님의 의사 코드를 넣으면 여기에 보여요.</p>
        <button type="button" className="icon-btn" onClick={onSignOut}>로그아웃</button>
      </div>
    );
  }

  const selectPatient = (id: string) => {
    if (id !== patientId) {
      setPatientId(id);
      setJump(null);
      setK(0);
    }
    if (drawer) setListOpen(false);
  };

  const days = windows?.days(k) ?? [];
  const goTo = (date: Date) => {
    if (windows) setK(windows.indexOf(date));
    setJump({ date, seq: Date.now() });
  };

  return (
    <div className="app">
      <PatientHeader patient={patient} doctorName={doctorName} sample={sample} failed={failed}
        listOpen={listOpen} onOpenList={() => setListOpen(true)} onSignOut={onSignOut}
        period={windows ? { days, k, max: windows.max, onChange: (next) => { setK(next); setJump(null); } } : undefined} />
      <main className={`cols ${listOpen ? '' : 'collapsed'}`}>
        <PatientList patients={patients} selectedId={patient.id} today={today} onSelect={selectPatient} onClose={() => setListOpen(false)} />
        {/* key: 환자를 바꾸면 칸마다 주 위치·고른 날짜를 처음으로 */}
        <PrevisitPanel key={`previsit-${patient.id}`} patient={patient} doctorName={doctorName}
          onJump={goTo} />
        <PainPanel key={`pain-${patient.id}`} records={patient.pains} days={days} jump={jump} />
        <SymptomPanel key={`symptom-${patient.id}`} records={patient.symptoms} days={days} jump={jump} />
      </main>
      <div className="scrim" onClick={() => setListOpen(false)} />
    </div>
  );
}
