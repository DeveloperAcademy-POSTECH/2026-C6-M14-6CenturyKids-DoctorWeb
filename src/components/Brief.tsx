import { useState } from 'react';
import { locationName, MOODS, SYMPTOM_NAMES } from '../domain/labels.ts';
import type { PainRecord, Patient, SymptomEntry, SymptomRecord, SymptomType } from '../domain/types.ts';
import { dayKey, daysBetween, hm, mdw, shortMdw } from '../lib/dates.ts';
import { isReview, parseDetail } from '../lib/symptomDetail.ts';
import { summarizeBySymptom } from '../lib/symptomSummary.ts';
import Avatar from './Avatar.tsx';
import Chevron from './Chevron.tsx';

interface Props {
  patient: Patient;
  /** 증상·통증이 함께 보는 7일 */
  days: Date[];
  today: Date;
  onOpenPrevisit: () => void;
  onOpenSymptom: (opts?: { day?: Date; type?: SymptomType }) => void;
  onOpenPain: () => void;
}

/** 날짜별 기록에서 처음 펼쳐 두는 최근 날 수 (나머지는 '이전 기록 보기').
 *  환자가 고른 날은 따로 맨 위에 두므로 세지 않는다 */
const OPEN_DAYS = 2;

/**
 * 한눈에 보기: 1분 안에 위에서 아래로 훑어 읽는 화면.
 * 왼쪽 환자 카드 (누구이고 어떤 마음으로 무슨 말을 하고 싶은지)
 * 오른쪽 위 요약 세 개 (통증 효과, 가장 잦은 증상, 앱이 확인을 요청한 답) → 아래 날짜별 기록 (그날 통증과 증상을 문장으로)
 * 그림(몸 그림, 쐐기, 막대)은 자세히 화면에만 두고, 여기서는 숫자와 문장으로 읽는다.
 */
export default function Brief({ patient, days, today, onOpenPrevisit, onOpenSymptom, onOpenPain }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (!patient.previsits.length && !patient.pains.length && !patient.symptoms.length) {
    return <p className="card empty-note">아직 환자가 앱에서 보낸 기록이 없어요</p>;
  }

  const latest = patient.previsits[0];
  const keys = new Set(days.map(dayKey));
  const symptoms = patient.symptoms.filter((r) => keys.has(dayKey(r.recordedDate)));
  const pains = patient.pains.filter((r) => keys.has(dayKey(r.recordedDate))).sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime());
  const flagged = symptoms
    .flatMap((r) => r.symptoms.filter(isReview).map((e) => ({ date: r.recordedDate, entry: e })))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const picked = latest ? dayKey(latest.selectedDate) : null;

  // 날짜별 기록: 이 7일 중 기록이 있는 날, 최신 먼저.
  // 환자가 진료 때 이야기하고 싶은 날은 의사가 가장 먼저 볼 날이라 목록 맨 위에 따로 고정한다 (아래로 밀려나지 않게)
  const byDay = [...days].reverse().map((d) => {
    const key = dayKey(d);
    return { key, date: d, symptom: symptoms.find((r) => dayKey(r.recordedDate) === key), pains: pains.filter((r) => dayKey(r.recordedDate) === key) };
  });
  const pickedDay = byDay.find((t) => t.key === picked);
  const timeline = byDay.filter((t) => t.key !== picked && (t.symptom || t.pains.length));
  const shown = showAll ? timeline : timeline.slice(0, OPEN_DAYS);
  const hidden = timeline.length - shown.length;
  const period = `${shortMdw(days[0]).split(' ')[0]}–${shortMdw(days[days.length - 1]).split(' ')[0]}`;

  return (
    <div className="ov">
      {/* 숫자 카드 네 개: 라벨(무엇) → 큰 값 → 한 줄 맥락. 이 7일 통증과 증상을 먼저 훑는다 */}
      <div className="kpis" aria-label={`${period} 7일 요약`}>
        <PainKpi pains={pains} onClick={onOpenPain} />
        <PlaceKpi pains={pains} onClick={onOpenPain} />
        <SymptomKpi records={symptoms} onClick={() => onOpenSymptom()} />
        <FlagKpi flagged={flagged} onClick={() => onOpenSymptom(flagged[0] ? { day: flagged[0].date } : undefined)} />
      </div>

      <PersonCard patient={patient} today={today} onOpenPrevisit={onOpenPrevisit} />

      {/* 회색 묶음 하나 = 날짜별 기록. 안의 흰 카드 하나 = 하루 */}
      <section className="ov-col ov-main" aria-labelledby="ov-records">
        <div className="ov-col-head">
          <h2 id="ov-records" className="ov-title">날짜별 기록</h2>
          <span className="count">{period}</span>
        </div>
        {!pains.length && !symptoms.length ? <p className="ov-item empty-note">이 기간에는 통증과 증상 기록이 없어요</p> : (
          <>
            {pickedDay && (
              <div className="ov-item day picked">
                <p className="day-tag">진료 전 기록에서 환자가 고른 날</p>
                <button type="button" className="tl-date" onClick={() => (pickedDay.symptom ? onOpenSymptom({ day: pickedDay.date }) : onOpenPain())}>
                  {mdw(pickedDay.date)}<Chevron />
                </button>
                <DayLines symptom={pickedDay.symptom} pains={pickedDay.pains} />
              </div>
            )}
            {shown.map((t) => (
              <div key={t.key} className="ov-item day">
                <button type="button" className="tl-date" onClick={() => (t.symptom ? onOpenSymptom({ day: t.date }) : onOpenPain())}>
                  {mdw(t.date)}<Chevron />
                </button>
                <DayLines symptom={t.symptom} pains={t.pains} />
              </div>
            ))}
            {hidden > 0 && <button type="button" className="col-more" onClick={() => setShowAll(true)}>이전 기록 {hidden}일 더 보기<Chevron /></button>}
          </>
        )}
      </section>
    </div>
  );
}

/** 왼쪽 환자 카드: 새로 온 것 → 마음 → 이야기하고 싶은 날 → 하고 싶은 말(원문, 길이가 정해지지 않아 맨 아래) */
function PersonCard({ patient, today, onOpenPrevisit }: { patient: Patient; today: Date; onOpenPrevisit: () => void }) {
  const latest = patient.previsits[0];
  const isNew = latest && daysBetween(latest.submittedAt, today) < 7;
  return (
    <section className="ov-col ov-person" aria-labelledby="ov-person">
      <div className="ov-col-head">
        <h2 id="ov-person" className="ov-title">진료 전 기록</h2>
        {isNew && <span className="count">새로 보냄</span>}
        {latest && (
          <button type="button" className="col-go" onClick={onOpenPrevisit}
            aria-label={patient.previsits.length > 1 ? `진료 전 기록 ${patient.previsits.length}건 모두 보기` : '진료 전 기록 자세히 보기'}>
            <Chevron />
          </button>
        )}
      </div>
      {!latest ? <p className="ov-item empty-note">아직 보낸 진료 전 기록이 없어요</p> : (
        <dl className="facts">
          <div className="sent">환자가 {mdw(latest.submittedAt)} {hm(latest.submittedAt)}에 앱으로 보냈어요</div>
          <div className="ov-item fact">
            <Avatar mood={latest.stateOfMind} size={40} />
            <div>
              <dt>진료 때 원하는 대화 방식</dt>
              <dd>{MOODS[latest.stateOfMind].title}</dd>
              {MOODS[latest.stateOfMind].caption && <dd className="sub">{MOODS[latest.stateOfMind].caption}</dd>}
            </div>
          </div>
          <div className="ov-item fact">
            <Icon name="calendar" />
            <div>
              <dt>진료 때 이야기하고 싶은 날</dt>
              <dd>{mdw(latest.selectedDate)}</dd>
            </div>
          </div>
          <div className="ov-item fact memo-fact">
            <Icon name="message" />
            <div>
              <dt>선생님께 하고 싶은 말</dt>
              {!latest.memo && <dd className="sub">하고 싶은 말을 남기지 않았어요</dd>}
            </div>
            {latest.memo && <dd className="memo-text memo">{latest.memo}</dd>}
          </div>
        </dl>
      )}
    </section>
  );
}

/** 숫자 카드: 라벨(13, 무엇의 값인지) → 값(24) → 맥락(13). 카드 전체가 버튼 */
function Kpi({ label, value, note, onClick, go }: { label: string; value: string; note: string; onClick: () => void; go: string }) {
  return (
    <button type="button" className="kpi" onClick={onClick} aria-label={`${label}: ${value}. ${note}. ${go}`}>
      <span className="kpi-label">{label}</span>
      <b className="kpi-value">{value}</b>
      <span className="kpi-note">{note}</span>
      <span className="kpi-go"><Chevron /></span>
    </button>
  );
}

function PainKpi({ pains, onClick }: { pains: PainRecord[]; onClick: () => void }) {
  const label = '약 먹고 통증이 줄어든 횟수';
  if (!pains.length) return <Kpi label={label} value="–" note="이 기간에는 통증 기록이 없어요" onClick={onClick} go="통증 자세히 보기" />;
  const lower = pains.filter((r) => r.painAfter !== undefined && r.painAfter < r.painBefore).length;
  return <Kpi label={label} value={`${lower}번`} note={`통증 기록 ${pains.length}번 중, 먹고 1시간 뒤 기준`} onClick={onClick} go="통증 자세히 보기" />;
}

function PlaceKpi({ pains, onClick }: { pains: PainRecord[]; onClick: () => void }) {
  const label = '가장 자주 아프다고 한 곳';
  const counts = new Map<string, number>();
  for (const r of pains) for (const l of r.location) { const n = locationName(l.bodyPart, l.bodySide); counts.set(n, (counts.get(n) ?? 0) + 1); }
  const [top] = [...counts].sort((a, b) => b[1] - a[1]);
  if (!top) return <Kpi label={label} value="–" note="이 기간에는 통증 기록이 없어요" onClick={onClick} go="통증 자세히 보기" />;
  return <Kpi label={label} value={top[0]} note={`통증 기록 ${pains.length}번 중 ${top[1]}번`} onClick={onClick} go="통증 자세히 보기" />;
}

function SymptomKpi({ records, onClick }: { records: SymptomRecord[]; onClick: () => void }) {
  const label = '가장 자주 말한 증상';
  const [first] = summarizeBySymptom(records).filter((s) => s.count > 0);
  if (!first) return <Kpi label={label} value="–" note={records.length ? '있다고 말한 증상이 없어요' : '이 기간에는 증상 기록이 없어요'} onClick={onClick} go="증상 자세히 보기" />;
  return <Kpi label={label} value={SYMPTOM_NAMES[first.type]} note={`증상 기록한 ${records.length}일 중 ${first.count}일`} onClick={onClick} go="증상 자세히 보기" />;
}

function FlagKpi({ flagged, onClick }: { flagged: { date: Date; entry: SymptomEntry }[]; onClick: () => void }) {
  const label = '앱이 의사 확인을 요청한 환자 답';
  if (!flagged.length) return <Kpi label={label} value="0개" note="이 기간에는 없어요" onClick={onClick} go="증상 자세히 보기" />;
  const [first] = flagged;
  return <Kpi label={label} value={`${flagged.length}개`} note={`가장 최근 ${shortMdw(first.date)} ${entryName(first.entry)}`} onClick={onClick} go="그날 증상 기록 보기" />;
}

const entryName = (e: SymptomEntry) => parseDetail(e).otherName ?? SYMPTOM_NAMES[e.symptomType];

/** 하루 기록 줄: 증상(있다고 답한 것) → 앱이 확인을 요청한 답(원문) → 통증(시각순) */
function DayLines({ symptom, pains }: { symptom?: SymptomRecord; pains: PainRecord[] }) {
  if (!symptom && !pains.length) return <p className="tl-line none">이날 남긴 증상과 통증 기록이 없어요</p>;
  const present = symptom?.symptoms.filter((e) => e.presence === 'present') ?? [];
  const reviews = symptom?.symptoms.filter(isReview) ?? [];
  return (
    <>
      {symptom && (
        <p className="tl-line">
          <span className="tl-kind">말한 증상</span>
          <span className="tl-text">{present.length ? present.map(entryName).join(', ') : '있다고 답한 증상 없음'}</span>
          <span className="tl-time">{hm(symptom.recordedDate)}</span>
        </p>
      )}
      {reviews.map((e, i) => (
        <div key={i} className="quote tl-quote">
          <span className="tl-kind">{entryName(e)}, 앱이 확인을 요청한 환자 답</span>
          “{parseDetail(e).lines.map((l) => l.text).join(' ')}”
        </div>
      ))}
      {pains.map((r) => (
        <p key={r.recordedDate.getTime()} className="tl-line">
          <span className="tl-kind">통증 점수</span>
          <span className="tl-text">
            {r.location.map((l) => locationName(l.bodyPart, l.bodySide)).join(', ')} 약 먹기 전 <b>{r.painBefore}점</b> → 1시간 뒤 {r.painAfter === undefined ? <span className="sub">기록 없음</span> : <b>{r.painAfter}점</b>}
          </span>
          <span className="tl-time">{hm(r.recordedDate)}</span>
        </p>
      ))}
    </>
  );
}

function Icon({ name }: { name: 'calendar' | 'message' }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className="fact-icon" viewBox="0 0 24 24" aria-hidden="true">
      {name === 'calendar' && <g {...c}><rect x="4" y="5.5" width="16" height="14" rx="3" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></g>}
      {name === 'message' && <g {...c}><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" /></g>}
    </svg>
  );
}
