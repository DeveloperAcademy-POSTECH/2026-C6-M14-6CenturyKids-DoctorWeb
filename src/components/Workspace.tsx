import { useEffect, useMemo, useRef, useState } from 'react';
import type { Patient, SymptomType } from '../domain/types.ts';
import { dayKey, weekWindows } from '../lib/dates.ts';
import Brief from './Brief.tsx';
import PainPanel from './PainPanel.tsx';
import PatientHeader from './PatientHeader.tsx';
import PatientList from './PatientList.tsx';
import PrevisitPanel from './PrevisitPanel.tsx';
import Sidebar, { type Screen } from './Sidebar.tsx';
import SymptomPanel from './SymptomPanel.tsx';

interface Props {
  patients: Patient[];
  doctorName: string;
  today: Date;
  /** 예시 데이터일 때만 사이드바에 표시 */
  sample: boolean;
  /** 읽지 못한 부분 ("진료 전 기록") */
  failed: string[];
  onSignOut: () => void;
}

/**
 * 사이드바 + 화면 하나.
 * 환자 목록 → (환자를 고르면) 한눈에 보기 → 필요할 때만 자세히(진료 전 기록 · 통증 · 증상).
 */
export default function Workspace({ patients, doctorName, today, sample, failed, onSignOut }: Props) {
  const [screen, setScreen] = useState<Screen>('list');
  const [patientId, setPatientId] = useState<string | null>(null);
  const patient = patients.find((p) => p.id === patientId);
  // 증상·통증은 같은 7일을 함께 본다 (기준은 두 기록 중 더 늦은 날)
  const windows = useMemo(() => patient && weekWindows([...patient.symptoms, ...patient.pains].map((r) => r.recordedDate)), [patient]);
  const [k, setK] = useState(0);
  const days = windows?.days(k) ?? [];
  // 한눈에 보기에서 고른 날 · 증상 (자세히 화면에서 표시)
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const [focusType, setFocusType] = useState<SymptomType | null>(null);
  const main = useRef<HTMLElement>(null);

  // 화면 이동을 브라우저 기록에 남겨, 아이패드 사파리의 밀어서 뒤로가기·브라우저 뒤로가기도 앱 안에서 한 단계씩 돌아가게
  useEffect(() => {
    history.replaceState({ screen: 'list' }, '');
    const onPop = (e: PopStateEvent) => {
      setFocusDay(null);
      setFocusType(null);
      setScreen((e.state?.screen as Screen | undefined) ?? 'list');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next: Screen) => {
    if (next !== screen) history.pushState({ screen: next }, '');
    setScreen(next);
    main.current?.scrollTo({ top: 0 });
  };
  const changeScreen = (next: Screen) => {
    setFocusDay(null);
    setFocusType(null);
    go(next);
  };
  const selectPatient = (id: string) => {
    if (id !== patientId) {
      setPatientId(id);
      setK(0);
    }
    changeScreen('overview');
  };
  const openDay = (date: Date, to: 'symptom' | 'pain') => {
    if (windows) setK(windows.indexOf(date));
    setFocusDay(dayKey(date));
    setFocusType(null);
    go(to);
  };

  const notice = failed.length > 0 && <p className="notice-error" role="alert">{failed.join(', ')}을 불러오지 못했어요</p>;

  return (
    <div className="shell">
      <Sidebar screen={screen} patientName={patient ? patient.name : undefined} doctorName={doctorName} sample={sample} onChange={changeScreen} onSignOut={onSignOut} />
      {screen === 'list' || !patient ? (
        <PatientList patients={patients} selectedId={patientId} today={today} onSelect={selectPatient} notice={notice} />
      ) : (
        <main className="screen" ref={main}>
          {/* 위로 한 단계: 자세히 → 한눈에 보기 → 환자 목록 */}
          <PatientHeader patient={patient}
            back={screen === 'overview' ? { label: '환자 목록', onClick: () => changeScreen('list') } : { label: '한눈에 보기', onClick: () => changeScreen('overview') }}
            period={windows && screen !== 'previsit'
              ? { days, k, max: windows.max, onChange: (next) => { setK(next); setFocusDay(null); } } : undefined} />
          {notice}
          {screen === 'overview' && (
            <Brief patient={patient} days={days} today={today}
              onOpenPrevisit={() => changeScreen('previsit')}
              onOpenSymptom={(o) => (o?.day ? openDay(o.day, 'symptom') : (setFocusDay(null), setFocusType(o?.type ?? null), go('symptom')))}
              onOpenPain={() => changeScreen('pain')} />
          )}
          {screen === 'previsit' && (
            <PrevisitPanel patient={patient} onOpenSymptom={(d) => openDay(d, 'symptom')} onOpenPain={() => changeScreen('pain')} />
          )}
          {screen === 'symptom' && (
            <SymptomPanel records={patient.symptoms} days={days} focusDay={focusDay} focusType={focusType}
              onClearFocus={() => { setFocusDay(null); setFocusType(null); }} />
          )}
          {screen === 'pain' && <PainPanel records={patient.pains} days={days} focusDay={focusDay} />}
        </main>
      )}
    </div>
  );
}
