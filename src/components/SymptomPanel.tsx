import { useEffect, useMemo, useState } from 'react';
import type { Jump } from './Workspace.tsx';
import { CARE_CALL_TYPES, COUNT_PREFIX, SYMPTOM_NAMES, locationName } from '../domain/labels.ts';
import type { SymptomEntry, SymptomRecord, SymptomType } from '../domain/types.ts';
import { dayKey, hm, mdw, weekWindows, weekday } from '../lib/dates.ts';
import { isReview, parseDetail } from '../lib/symptomDetail.ts';
import { useScrollTo } from '../lib/useScrollTo.ts';
import Pager from './Pager.tsx';

interface Props {
  records: SymptomRecord[];
  jump: Jump | null;
}

/** 증상 기록: 7일 단위, 위는 한눈에 보는 표, 아래는 날짜별 줄글 */
export default function SymptomPanel({ records, jump }: Props) {
  const windows = useMemo(() => weekWindows(records.map((r) => r.recordedDate)), [records]);
  const [k, setK] = useState(0);
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const { container, scrollTo, toTop } = useScrollTo<HTMLDivElement>();

  useEffect(() => {
    if (!jump || !windows) return;
    const day = dayKey(jump.date);
    setK(windows.indexOf(jump.date));
    setFocusDay(day);
    setTarget(null);
    scrollTo(`[data-daycard="${day}"]`);
  }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToEntry = (day: string, type: SymptomType) => {
    setFocusDay(day);
    setTarget(`${day}:${type}`);
    scrollTo(`[data-entry="${day}:${type}"]`, 'center');
  };

  const days = windows?.days(k) ?? [];
  const byDay = new Map(records.map((r) => [dayKey(r.recordedDate), r]));
  const inWindow = days.map((t) => byDay.get(dayKey(t))).filter((r): r is SymptomRecord => !!r);
  const rows: SymptomType[] = inWindow.some((r) => r.symptoms.some((e) => e.symptomType === 'other'))
    ? [...CARE_CALL_TYPES, 'other'] : CARE_CALL_TYPES;

  return (
    <section className="panel symptom" aria-labelledby="h-symptom">
      <div className="panel-head">
        <h2 id="h-symptom">증상 기록</h2>
        <span className="hint">음성 대화를 통해 하루동안 있었던 증상</span>
        {records.length > 0 && <span className="range">{records.length}일</span>}
      </div>
      <div className="panel-body" ref={container}>
        {!windows && <p className="empty-note">아직 증상 기록이 없어요</p>}
        {windows && <WeekGrid days={days} byDay={byDay} rows={rows} focusDay={focusDay} onPick={goToEntry} />}
        {[...days].reverse().map((t) => (
          <DayCard key={dayKey(t)} date={t} record={byDay.get(dayKey(t))} focused={focusDay === dayKey(t)} target={target} />
        ))}
      </div>
      {windows && (
        <Pager days={days} k={k} max={windows.max} total={inWindow.length}
          onChange={(next) => { setK(next); setFocusDay(null); setTarget(null); toTop(); }} />
      )}
    </section>
  );
}

function WeekGrid({ days, byDay, rows, focusDay, onPick }: {
  days: Date[];
  byDay: Map<string, SymptomRecord>;
  rows: SymptomType[];
  focusDay: string | null;
  onPick: (day: string, type: SymptomType) => void;
}) {
  const cell = (date: Date, type: SymptomType) => {
    const day = dayKey(date);
    const entries = byDay.get(day)?.symptoms.filter((e) => e.symptomType === type) ?? [];
    if (!entries.length) return null;
    const go = (cls: string, label: string) => (
      <button type="button" className="mark-btn" aria-label={`${mdw(date)} ${SYMPTOM_NAMES[type]} ${label} 기록으로 가기`} onClick={() => onPick(day, type)}>
        <span className={`mark ${cls}`}>{cls === 'flag' ? '!' : null}</span>
      </button>
    );
    if (entries.some(isReview)) return go('flag', '검토 필요');
    if (entries.some((e) => e.presence === 'present')) return go('present', '있음');
    if (entries.some((e) => e.presence === 'unknown')) return <span className="mark unknown" title="모름">?</span>;
    return <span className="mark absent" title="없음" />;
  };

  return (
    <>
      <div className="grid-title">
        <h4>주간 증상 기록 그래프</h4>
        <span>점을 선택하면 상세 기록으로 이동해요</span>
      </div>
      <div className="grid-wrap">
        <table className="sym-grid">
          <thead>
            <tr>
              <th scope="col" aria-label="증상" />
              {days.map((t) => (
                <th key={dayKey(t)} scope="col" className={`${byDay.has(dayKey(t)) ? '' : 'off'} ${focusDay === dayKey(t) ? 'focus' : ''}`}>
                  <b>{t.getMonth() + 1}/{t.getDate()}</b>{weekday(t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((type) => (
              <tr key={type}>
                <th scope="row">{SYMPTOM_NAMES[type]}</th>
                {days.map((t) => <td key={dayKey(t)}>{cell(t, type)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <span><i className="mark present" />있음</span>
        <span><i className="mark flag">!</i>검토 필요</span>
        <span><i className="mark absent" />없음</span>
        <span><b className="mark unknown">?</b>모름</span>
        <span>빈 칸: 그날 기록 없음 · 묻지 못함</span>
      </div>
    </>
  );
}

function DayCard({ date, record, focused, target }: { date: Date; record?: SymptomRecord; focused: boolean; target: string | null }) {
  const day = dayKey(date);
  if (!record) {
    return (
      <article className="day none" data-daycard={day}>
        <div className="day-head"><h3>{mdw(date)}</h3><span className="count">기록 없음</span></div>
      </article>
    );
  }
  const shown = record.symptoms.filter((e) => e.presence === 'present' || isReview(e))
    .sort((a, b) => Number(isReview(b)) - Number(isReview(a)));
  const unknown = record.symptoms.filter((e) => e.presence === 'unknown' && !isReview(e));
  const absent = record.symptoms.filter((e) => e.presence === 'absent');
  const present = record.symptoms.filter((e) => e.presence === 'present').length;

  return (
    <article className={`day ${focused ? 'focus' : ''}`} data-daycard={day}>
      <div className="day-head">
        <h3>{mdw(date)}</h3>
        <span className="time">{hm(record.recordedDate)} 통화</span>
        <span className="count">있음 {present} · 없음 {absent.length}{unknown.length ? ` · 모름 ${unknown.length}` : ''}</span>
      </div>
      <div className="day-body">
        {record.conditionText && (
          <p className="cond"><small>오늘 몸 상태를 묻는 첫 질문에</small>“{record.conditionText}”</p>
        )}
        {shown.map((e, i) => <EntryRow key={i} entry={e} day={day} targeted={target === `${day}:${e.symptomType}`} />)}
        <div className="rest">
          {unknown.map((e, i) => (
            <div key={i}><b>모름</b>{SYMPTOM_NAMES[e.symptomType]}{e.detail && <> — <q>{parseDetail(e).lines.map((l) => l.text).join(' / ')}</q></>}</div>
          ))}
          {absent.length > 0 && <div><b>없음</b>{absent.map((e) => SYMPTOM_NAMES[e.symptomType]).join(', ')}</div>}
        </div>
      </div>
    </article>
  );
}

function EntryRow({ entry, day, targeted }: { entry: SymptomEntry; day: string; targeted: boolean }) {
  const { needsReview, otherName, lines } = parseDetail(entry);
  const countPrefix = COUNT_PREFIX[entry.symptomType];
  const chips: string[] = [];
  if (entry.bodyPart) chips.push(`${locationName(entry.bodyPart, entry.bodySide)}${entry.rawLocationText ? ` · “${entry.rawLocationText}”` : ''}`);
  else if (entry.rawLocationText) chips.push(`“${entry.rawLocationText}”`);
  if (entry.occurrenceCount !== undefined) chips.push(`${countPrefix ? `${countPrefix} ` : ''}${entry.occurrenceCount}회`);
  if (entry.durationMinutes !== undefined) chips.push(`한 번에 ${entry.durationMinutes}분`);
  return (
    <div className={`entry ${needsReview ? 'flagged' : ''} ${targeted ? 'target' : ''}`} data-entry={`${day}:${entry.symptomType}`}>
      <div className="type">
        {otherName ? <>{otherName}<small>기타 증상</small></> : SYMPTOM_NAMES[entry.symptomType]}
      </div>
      <div>
        {(chips.length > 0 || needsReview) && (
          <div className="facts">
            {chips.map((c) => <span key={c} className="badge">{c}</span>)}
            {needsReview && <span className="review">검토 필요</span>}
          </div>
        )}
        <p className="text">
          {lines.map((l, i) => (
            <span key={i}>{i > 0 && <br />}{l.label && <span className="label">{l.label} </span>}{l.text}</span>
          ))}
        </p>
      </div>
    </div>
  );
}
