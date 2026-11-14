import { useEffect, useState } from 'react';
import type { Jump } from './Workspace.tsx';
import { CARE_CALL_TYPES, COUNT_PREFIX, SYMPTOM_NAMES, locationName } from '../domain/labels.ts';
import type { SymptomEntry, SymptomRecord, SymptomType } from '../domain/types.ts';
import { dayKey, hm, mdw, shortMdw, weekday } from '../lib/dates.ts';
import { isReview, parseDetail } from '../lib/symptomDetail.ts';
import { summarizeBySymptom, type SymptomSummary } from '../lib/symptomSummary.ts';
import { useScrollTo } from '../lib/useScrollTo.ts';

interface Props {
  records: SymptomRecord[];
  /** 통증·증상 칸이 함께 보는 7일 */
  days: Date[];
  jump: Jump | null;
}

/** all = 전체, review = 검토 필요만 */
type Filter = SymptomType | 'all' | 'review';

/** 증상 기록: 7일 단위, 위는 한눈에 보는 표, 아래는 증상별 줄글 */
export default function SymptomPanel({ records, days, jump }: Props) {
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  // 증상별 기록에서 볼 증상 (all = 전체)
  const [filter, setFilter] = useState<Filter>('all');
  const { container, scrollTo, toTop } = useScrollTo<HTMLDivElement>();

  // 기간이 바뀌면 강조를 풀고 맨 위로 (날짜로 가기는 아래 효과가 다시 고른다)
  const start = days[0]?.getTime();
  useEffect(() => {
    setFocusDay(null);
    setTarget(null);
    toTop();
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!jump) return;
    const day = dayKey(jump.date);
    setFocusDay(day);
    setTarget(null);
    toTop();
  }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToEntry = (day: string, type: SymptomType) => {
    // 다른 증상만 보고 있으면 누른 증상으로 바꿔야 그 기록이 보인다
    const state = summaries.find((s) => s.type === type)?.days.find((d) => d.day === day)?.state;
    if (shown === 'review' ? state !== 'review' : shown !== 'all' && shown !== type) setFilter(type);
    setFocusDay(day);
    setTarget(`${day}:${type}`);
    scrollTo(`[data-entry="${day}:${type}"]`, 'center');
  };

  const byDay = new Map(records.map((r) => [dayKey(r.recordedDate), r]));
  const inWindow = days.map((t) => byDay.get(dayKey(t))).filter((r): r is SymptomRecord => !!r);
  const summaries = summarizeBySymptom(inWindow);
  // 기간을 바꿔 고른 증상의 답이 없으면 전체를 보여준다
  const available = (f: Filter) => f === 'all' || summaries.some((s) => (f === 'review' ? s.review > 0 : s.type === f));
  const shown: Filter = available(filter) ? filter : 'all';
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
        {!records.length && <p className="empty-note">아직 증상 기록이 없어요</p>}
        {records.length > 0 && <WeekGrid days={days} byDay={byDay} rows={rows} focusDay={focusDay} onPick={goToEntry} />}
        {records.length > 0 && inWindow.length > 0 && (
          <>
            <h4>증상별 기록</h4>
            <SymptomFilter value={shown} available={available} onChange={setFilter} />
            {summaries.filter((s) => shown === 'all' || (shown === 'review' ? s.review > 0 : s.type === shown))
              .map((s) => <SymptomCard key={s.type} summary={s} onlyReview={shown === 'review'} target={target} />)}
          </>
        )}
      </div>
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

/** [전체] [오심·구토] … [기타]: 이 기간 답이 없는 증상은 누를 수 없음 */
function SymptomFilter({ value, available, onChange }: {
  value: Filter;
  available: (f: Filter) => boolean;
  onChange: (v: Filter) => void;
}) {
  const options: Filter[] = ['all', ...CARE_CALL_TYPES, 'other', 'review'];
  return (
    <div className="sym-filter" role="group" aria-label="증상 고르기">
      {options.map((o) => {
        return (
          <button key={o} type="button" className={o === 'review' ? 'review-chip' : undefined}
            aria-pressed={value === o} disabled={!available(o)} onClick={() => onChange(o)}>
            {o === 'all' ? '전체' : o === 'review' ? '검토 필요' : SYMPTOM_NAMES[o]}
          </button>
        );
      })}
    </div>
  );
}

/** 한 증상의 7일: 있음·검토 필요·모름인 날은 답 원문, 없음인 날은 한 줄 */
function SymptomCard({ summary, onlyReview, target }: { summary: SymptomSummary; onlyReview: boolean; target: string | null }) {
  const { type, days, count, review } = summary;
  // 검토 필요만 볼 때는 검토 필요인 날만, 없음 줄도 뺀다
  const told = days.filter((d) => (onlyReview ? d.state === 'review' : d.state !== 'absent'));
  const absent = onlyReview ? [] : days.filter((d) => d.state === 'absent');
  const unknown = days.filter((d) => d.state === 'unknown').length;
  return (
    <article className="day">
      <div className="day-head">
        <h3>{SYMPTOM_NAMES[type]}</h3>
        {review > 0 && <span className="review">검토 필요 {review}</span>}
        <span className="count">있음 {count}일{absent.length ? ` · 없음 ${absent.length}일` : ''}{unknown ? ` · 모름 ${unknown}일` : ''}</span>
      </div>
      {(told.length > 0 || absent.length > 0) && (
        <div className="day-body">
          {told.flatMap((d) => d.entries.filter((e) => (onlyReview ? isReview(e) : e.presence !== 'absent' || isReview(e))).map((e, i) => (
            <EntryRow key={`${d.day}-${i}`} entry={e} day={d.day} date={d.recordedDate} first={i === 0}
              targeted={target === `${d.day}:${type}`} />
          )))}
          {absent.length > 0 && (
            <div className="rest"><b>없음</b>{absent.map((d) => shortMdw(d.recordedDate)).join(', ')}</div>
          )}
        </div>
      )}
    </article>
  );
}

function EntryRow({ entry, day, date, first, targeted }: { entry: SymptomEntry; day: string; date: Date; first: boolean; targeted: boolean }) {
  const { needsReview, otherName, lines } = parseDetail(entry);
  const countPrefix = COUNT_PREFIX[entry.symptomType];
  const chips: string[] = [];
  if (otherName) chips.push(otherName);
  if (entry.presence === 'unknown') chips.push('모름');
  if (entry.bodyPart) chips.push(`${locationName(entry.bodyPart, entry.bodySide)}${entry.rawLocationText ? ` · “${entry.rawLocationText}”` : ''}`);
  else if (entry.rawLocationText) chips.push(`“${entry.rawLocationText}”`);
  if (entry.occurrenceCount !== undefined) chips.push(`${countPrefix ? `${countPrefix} ` : ''}${entry.occurrenceCount}회`);
  if (entry.durationMinutes !== undefined) chips.push(`한 번에 ${entry.durationMinutes}분`);
  return (
    <div className={`entry ${needsReview ? 'flagged' : ''} ${targeted ? 'target' : ''}`} data-entry={first ? `${day}:${entry.symptomType}` : undefined}>
      <div className="type">{first && <>{shortMdw(date)}<small>{hm(date)} 통화</small></>}</div>
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
