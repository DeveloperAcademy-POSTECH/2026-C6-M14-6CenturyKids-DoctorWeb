import { useEffect, useMemo, useRef, useState } from 'react';
import type { Patient } from '../domain/types.ts';
import { mdw, weekWindows } from '../lib/dates.ts';
import { lastRecordDate } from '../lib/patientSummary.ts';
import { prefersReducedMotion, useMedia } from '../lib/useMedia.ts';
import PainPanel from './PainPanel.tsx';
import PatientHeader from './PatientHeader.tsx';
import PatientList from './PatientList.tsx';
import PrevisitPanel from './PrevisitPanel.tsx';
import SymptomPanel from './SymptomPanel.tsx';
import RecordSummary from './RecordSummary.tsx';
import RefreshStatus, { type RefreshInfo } from './RefreshStatus.tsx';
import Icon from './Icon.tsx';
import { Button } from '@fluentui/react-components';
import logo from '../assets/socdoc-logo.png';

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
  /** 서버 기록을 볼 때만. 예시 데이터는 다시 읽을 것이 없다 */
  refresh?: RefreshInfo;
}

// Smaller screens keep the full record area and reveal the patient list on demand.
const DRAWER_QUERY = '(max-width: 1100px)';

const newestPatient = (patients: Patient[]) =>
  [...patients].sort((a, b) => (lastRecordDate(b)?.getTime() ?? 0) - (lastRecordDate(a)?.getTime() ?? 0))[0];

export default function Workspace({ patients, doctorName, today, sample, failed, onSignOut, refresh }: Props) {
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

  const [patientId, setPatientId] = useState(() => newestPatient(patients)?.id);
  // 새로고침으로 보던 환자가 목록에서 빠지면 가장 최근 기록 환자를 보여 준다
  const patient = patients.find((p) => p.id === patientId) ?? newestPatient(patients);
  const [jump, setJump] = useState<Jump | null>(null);
  // 통증·증상 칸은 같은 7일을 함께 본다 (기준은 두 기록 중 더 늦은 날)
  const windows = useMemo(() => patient && weekWindows([...patient.symptoms, ...patient.pains].map((r) => r.recordedDate)), [patient]);
  const [page, setK] = useState(0);
  const k = Math.min(page, windows?.max ?? 0);
  // 새 기록으로 7일 범위가 옮겨지면 '이 날 기록 보기'를 풀어 칸마다 다른 날을 보지 않게 한다
  const latestDay = windows?.days(0)[6].getTime();
  useEffect(() => setJump(null), [patient?.id, latestDay]);
  useEffect(() => setK(0), [patient?.id]);

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
      const bar = document.getElementById('day-focus');
      bar?.focus({ preventScroll: true });
      bar?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  };

  return (
    <div className="app">
      <a className="skip-link" href="#patient-records">환자 기록으로 건너뛰기</a>
      <header className="topbar">
        <div className="brand"><img src={logo} alt="SocDoc" width="49" height="24" /></div>
        <span className="current-page">환자 기록</span>
        {refresh && <RefreshStatus {...refresh} />}
        <div className="doctor-profile">{sample && <span className="sample">예시 데이터</span>}<span className="doctor-avatar">{doctorName.slice(0, 1)}</span><span><b>{doctorName} 선생님</b></span></div>
        <Button appearance="subtle" size="small" className="sign-out" icon={<Icon name="logout" size={16} />} onClick={onSignOut}>{sample ? '예시 닫기' : '로그아웃'}</Button>
      </header>
      <div className={`app-shell ${listOpen ? '' : 'collapsed'}`}>
        {/* 환자 목록을 접어도 왼쪽에 한 줄(레일)을 남겨, 다시 여는 버튼이 늘 같은 자리에 있게 */}
        {!listOpen || drawer ? (
          <nav className="plist-rail" aria-label="환자 목록">
            <Button appearance="subtle" className="rail-open" icon={<Icon name="panel" />} aria-label="환자 목록 열기" title="환자 목록 열기" aria-expanded={listOpen}
              onClick={(e) => { listOpener.current = e.currentTarget; setListOpen(true); }} />
          </nav>
        ) : null}
        <PatientList patients={patients} selectedId={patient.id} today={today} onSelect={selectPatient} onClose={() => setListOpen(false)} modal={drawer} />
        <main className="workspace-main" id="patient-records" tabIndex={-1}>

          <section className="patient-overview" aria-label="환자와 조회 기간 요약">
          <PatientHeader patient={patient} failed={failed}
            period={windows ? { days, k, max: windows.max, onChange: (next) => { setK(next); setJump(null); } } : undefined} />
          <RecordSummary patient={patient} days={days} />
          </section>
          {/* 진료 전 기록을 맨 위에 (환자가 진료 전에 하고 싶은 말을 먼저). 그래서 아래로 건너뛰는 바로 가기 줄은 두지 않는다 */}
          <div className="cols">
            <PrevisitPanel key={`previsit-${patient.id}`} patient={patient} days={days} onJump={goTo} />
            {/* '이 날 기록 보기'를 누르면: 아래 통증·증상 칸이 그 하루만 보여 주고, 이 줄에서 무엇을 보는 중인지와 되돌리기를 알려 준다 */}
            {jump && (
              <div className="day-focus" id="day-focus" tabIndex={-1} role="status">
                <Icon name="calendar" size={18} />
                <span><b>{mdw(jump.date)}</b> 통증·증상 기록만 보고 있어요</span>
                <button type="button" onClick={() => setJump(null)}>7일 전체 보기</button>
              </div>
            )}
            <PainPanel key={`pain-${patient.id}`} records={patient.pains} days={days} jump={jump} />
            <SymptomPanel key={`symptom-${patient.id}`} records={patient.symptoms} days={days} jump={jump} />
          </div>
          <p className="workspace-footnote">환자가 직접 남긴 기록입니다. 기록이 없는 날은 증상이 없는 날과 구분해 주세요.</p>
        </main>
        {drawer && listOpen && <button type="button" className="scrim" aria-label="환자 목록 닫기" onClick={() => setListOpen(false)} />}
      </div>
    </div>
  );
}
