import { useEffect, useMemo, useRef, useState } from 'react';
import type { Patient } from '../domain/types.ts';
import { weekWindows } from '../lib/dates.ts';
import { lastRecordDate } from '../lib/patientSummary.ts';
import { prefersReducedMotion, useMedia } from '../lib/useMedia.ts';
import PainPanel from './PainPanel.tsx';
import PatientHeader from './PatientHeader.tsx';
import PatientList from './PatientList.tsx';
import PrevisitPanel from './PrevisitPanel.tsx';
import SymptomPanel from './SymptomPanel.tsx';
import RecordSummary from './RecordSummary.tsx';
import Icon from './Icon.tsx';
import { Button } from '@fluentui/react-components';

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

// Smaller screens keep the full record area and reveal the patient list on demand.
const DRAWER_QUERY = '(max-width: 1100px)';

export default function Workspace({ patients, doctorName, today, sample, failed, onSignOut }: Props) {
  const drawer = useMedia(DRAWER_QUERY);
  const [listOpen, setListOpen] = useState(!drawer);
  const listOpener = useRef<HTMLElement | null>(null);
  useEffect(() => setListOpen(!drawer), [drawer]);
  useEffect(() => {
    if (!drawer || !listOpen) return;
    const previous = document.activeElement;
    const panel = document.querySelector<HTMLElement>('.plist');
    const background = document.querySelector<HTMLElement>('.workspace-main');
    if (background) background.inert = true;
    panel?.querySelector<HTMLInputElement>('input')?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setListOpen(false);
      }
      if (event.key === 'Tab' && panel) {
        const controls = [...panel.querySelectorAll<HTMLElement>('button:not(:disabled), input')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('keydown', close);
      if (background) background.inert = false;
      // Capture the opener before it becomes hidden; by effect time the browser
      // may already have moved focus to the body.
      const restore = listOpener.current ?? previous;
      if (restore instanceof HTMLElement && restore.isConnected && restore.getClientRects().length) restore.focus({ preventScroll: true });
      listOpener.current = null;
    };
  }, [drawer, listOpen]);

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
      requestAnimationFrame(() => {
        const main = document.getElementById('patient-records');
        main?.focus({ preventScroll: true });
        main?.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    }
    if (drawer) setListOpen(false);
  };

  const days = windows?.days(k) ?? [];
  const goTo = (date: Date) => {
    if (windows) setK(windows.indexOf(date));
    setJump({ date, seq: Date.now() });
    requestAnimationFrame(() => {
      const section = document.getElementById('pain-records');
      section?.focus({ preventScroll: true });
      section?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  };

  return (
    <div className="app">
      <a className="skip-link" href="#patient-records">환자 기록으로 건너뛰기</a>
      <header className="topbar">
        <div className="brand">SocDoc</div>
        <span className="current-page"><Icon name="activity" />환자 기록</span>
        <div className="doctor-profile">{sample && <span className="sample">예시 데이터</span>}<span className="doctor-avatar">{doctorName.slice(0, 1)}</span><span><b>{doctorName} 선생님</b></span></div>
        <Button appearance="subtle" size="small" className="sign-out" icon={<Icon name="logout" size={16} />} onClick={onSignOut}>{sample ? '예시 닫기' : '로그아웃'}</Button>
      </header>
      <div className={`app-shell ${listOpen ? '' : 'collapsed'}`}>
        <PatientList patients={patients} selectedId={patient.id} today={today} onSelect={selectPatient} onClose={() => setListOpen(false)} modal={drawer} />
        <main className="workspace-main" id="patient-records" tabIndex={-1}>

          <section className="patient-overview" aria-label="환자 및 선택 기간 요약">
          <PatientHeader patient={patient} failed={failed}
            listOpen={listOpen} onOpenList={() => {
              listOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
              setListOpen(true);
            }}
            period={windows ? { days, k, max: windows.max, onChange: (next) => { setK(next); setJump(null); } } : undefined} />
          <RecordSummary patient={patient} days={days} />
          </section>
          <nav className="record-nav" aria-label="환자 기록 바로가기">
            <span className="record-nav-label">선택 기간 기록</span>
            <a href="#pain-records">통증 기록</a>
            <a href="#symptom-records">증상 기록</a>
            <a href="#previsit-records">진료 전 기록<Icon name="chevron" size={16} /></a>

          </nav>
          <div className="cols">
            <PainPanel key={`pain-${patient.id}`} records={patient.pains} days={days} jump={jump} />
            <SymptomPanel key={`symptom-${patient.id}`} records={patient.symptoms} days={days} jump={jump} />
            <PrevisitPanel key={`previsit-${patient.id}`} patient={patient} days={days} onJump={goTo} />
          </div>
          <p className="workspace-footnote">환자가 직접 남긴 기록입니다. 기록이 없는 날은 증상이 없는 날과 구분해 주세요.</p>
        </main>
        {drawer && listOpen && <button type="button" className="scrim" aria-label="환자 목록 닫기" onClick={() => setListOpen(false)} />}
      </div>
    </div>
  );
}
