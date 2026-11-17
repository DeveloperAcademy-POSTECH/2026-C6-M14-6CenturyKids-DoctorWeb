export type Screen = 'list' | 'overview' | 'previsit' | 'pain' | 'symptom';

interface Props {
  screen: Screen;
  /** 고른 환자 (없으면 기록 관리를 누를 수 없다) */
  patientName?: string | null;
  doctorName: string;
  sample: boolean;
  onChange: (screen: Screen) => void;
  onSignOut: () => void;
}

// 피그마 Sidebar Sub Item 순서
const SUBS: { screen: Screen; label: string }[] = [
  { screen: 'previsit', label: '진료 전 기록' },
  { screen: 'pain', label: '복용 후 통증 변화' },
  { screen: 'symptom', label: '증상 기록' },
];

/**
 * 피그마 Sidebar (시안 A): 환자 목록 · 기록 관리(= 한눈에 보기) └ 진료 전 기록 · 복용 후 통증 변화 · 증상 기록 (환자 정보와 설정은 아직 없어 시연 화면에서 뺐다).
 * 흰 바탕은 화면에 한 개만: 하위 메뉴를 고르면 기록 관리는 꺼진 모양.
 */
export default function Sidebar({ screen, patientName, doctorName, sample, onChange, onSignOut }: Props) {
  const hasPatient = patientName !== undefined;
  const item = (s: Screen) => ({ 'aria-current': screen === s ? ('page' as const) : undefined, onClick: () => onChange(s) });
  return (
    <nav className="sidebar" aria-label="메뉴">
      <ul className="side-menu">
        <li><button type="button" className="side-item" {...item('list')}><Icon name="people" />환자 목록</button></li>
        <li>
          <button type="button" className="side-item" disabled={!hasPatient} {...item('overview')}>
            <Icon name="doc" /><span>기록 관리</span>
            {hasPatient ? <span className="side-patient">{patientName ?? '이름 없음'}</span> : <span className="side-soon">환자 선택 후</span>}
          </button>
          <ul className="side-sub">
            {SUBS.map((s) => (
              <li key={s.screen}>
                <button type="button" className="side-item sub" disabled={!hasPatient} {...item(s.screen)}>{s.label}</button>
              </li>
            ))}
          </ul>
        </li>
      </ul>
      <div className="side-foot">
        {sample && <span className="sample">예시 데이터</span>}
        <span className="doctor">{doctorName} 선생님</span>
        <button type="button" className="soft-btn" onClick={onSignOut}>{sample ? '예시 닫기' : '로그아웃'}</button>
      </div>
    </nav>
  );
}

function Icon({ name }: { name: 'people' | 'doc' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className="side-icon" viewBox="0 0 16 16" aria-hidden="true">
      {name === 'people' && <g {...common}><circle cx="6" cy="5" r="2.3" /><path d="M1.8 13.5c.5-2.4 2.2-3.7 4.2-3.7s3.7 1.3 4.2 3.7" /><path d="M10.6 3a2.2 2.2 0 0 1 0 4.2M11.8 9.9c1.3.4 2.2 1.6 2.5 3.6" /></g>}
      {name === 'doc' && <g {...common}><path d="M4 1.8h5.2L12.5 5v9.2H4z" /><path d="M9 1.8V5h3.5M6.2 8.3h4M6.2 11h4" /></g>}
    </svg>
  );
}
