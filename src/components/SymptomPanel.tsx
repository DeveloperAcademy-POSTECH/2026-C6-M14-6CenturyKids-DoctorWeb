import Icon from './Icon.tsx';
import { useEffect, useState } from 'react';
import type { Jump } from './Workspace.tsx';
import { CARE_CALL_TYPES, COUNT_PREFIX, SYMPTOM_NAMES, locationName } from '../domain/labels.ts';
import type { SymptomEntry, SymptomRecord, SymptomType } from '../domain/types.ts';
import { dayKey, hm, mdw, shortMdw, weekday } from '../lib/dates.ts';
import { parseDetail } from '../lib/symptomDetail.ts';
import { summarizeBySymptom, type SymptomSummary } from '../lib/symptomSummary.ts';
import { useScrollTo } from '../lib/useScrollTo.ts';
import { ToggleButton } from '@fluentui/react-components';

interface Props {
  records: SymptomRecord[];
  /** 통증·증상 칸이 함께 보는 7일 */
  days: Date[];
  jump: Jump | null;
}

/** Filter the detail list without changing the weekly overview. */
type Filter = SymptomType | 'all';

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
    if (shown !== 'all' && shown !== type) setFilter(type);
    setFocusDay(day);
    setTarget(`${day}:${type}`);
    scrollTo(`[data-entry="${day}:${type}"]`, 'center');
  };

  const byDay = new Map(records.map((r) => [dayKey(r.recordedDate), r]));
  const inWindow = days.map((t) => byDay.get(dayKey(t))).filter((r): r is SymptomRecord => !!r);
  const summaries = summarizeBySymptom(inWindow);
  // 기간을 바꿔 고른 증상의 답이 없으면 전체를 보여준다
  const available = (f: Filter) => f === 'all' || summaries.some((s) => s.type === f);
  const shown: Filter = available(filter) ? filter : 'all';
  const rows: SymptomType[] = inWindow.some((r) => r.symptoms.some((e) => e.symptomType === 'other'))
    ? [...CARE_CALL_TYPES, 'other'] : CARE_CALL_TYPES;

  return (
    <section className="panel symptom" id="symptom-records" tabIndex={-1} aria-labelledby="h-symptom">
      <div className="panel-head">
        <span className="panel-symbol" aria-hidden="true"><Icon name="conversation" size={20} /></span>
        <h2 id="h-symptom">증상 기록</h2>
        <span className="hint">환자가 대화로 남긴 증상</span>
      </div>
      <div className="panel-body" ref={container}>
        {!records.length && <p className="empty-note">아직 증상 기록이 없어요</p>}
        {records.length > 0 && inWindow.length === 0 && <p className="empty-note">선택한 7일에는 증상 기록이 없어요</p>}
        {inWindow.length > 0 && <WeekGrid days={days} byDay={byDay} rows={rows} focusDay={focusDay} onPick={goToEntry} />}
        {records.length > 0 && inWindow.length > 0 && (
          <>
            <h3 className="records-heading">증상별 기록</h3>
            <SymptomFilter value={shown} available={available} onChange={setFilter} />
            {summaries.filter((s) => shown === 'all' || s.type === shown)
              .map((s) => <SymptomCard key={s.type} summary={s} target={target} />)}
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
    if (!entries.length) return <span className="state-slot" title="기록 없음 또는 묻지 못함"><SymptomState state="unrecorded" /></span>;
    const go = (cls: string, label: string) => (
      <button type="button" className="mark-btn" aria-label={`${mdw(date)} ${SYMPTOM_NAMES[type]} ${label} 기록으로 가기`} onClick={() => onPick(day, type)}>
        <SymptomState state={cls as SymptomStateName} />
      </button>
    );
    if (entries.some((e) => e.presence === 'present')) return go('present', '있음');
    if (entries.some((e) => e.presence === 'unknown')) return go('unknown', '모름');
    return <span className="state-slot" title="없음"><SymptomState state="absent" /></span>;
  };

  return (
    <>
      <div className="grid-title">
        <h3>7일 증상 분포</h3>
        <span>점을 누르면 해당 답변으로 이동</span>
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
      <div className="legend symptom-legend" aria-label="증상표 범례">
        <span><SymptomState state="present" />있음</span>
        <span><SymptomState state="absent" />없음</span>
        <span><SymptomState state="unknown" />모름</span>
        <span><SymptomState state="unrecorded" />미기록·미응답</span>
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
  const options: Filter[] = ['all', ...CARE_CALL_TYPES, 'other'];
  return (
    <div className="sym-filter" role="group" aria-label="증상 고르기">
      {options.filter(available).map((o) => {
        return (
          <ToggleButton key={o} size="small" appearance="outline"
            checked={value === o} disabled={!available(o)} onClick={() => onChange(o)}>
            {o === 'all' ? '전체' : SYMPTOM_NAMES[o]}
          </ToggleButton>
        );
      })}
    </div>
  );
}

/** Original answers by symptom; absent dates stay compact. */
function SymptomCard({ summary, target }: { summary: SymptomSummary; target: string | null }) {
  const { type, days, count } = summary;
  // Keep original answers visible; absent answers remain in the date summary.
  const told = days.filter((d) => d.state !== 'absent');
  const absent = days.filter((d) => d.state === 'absent');
  const unknown = days.filter((d) => d.state === 'unknown').length;
  return (
    <article className="day">
      <div className="day-head">
        <h4>{SYMPTOM_NAMES[type]}</h4>
        <span className="count">있음 {count}일{absent.length ? ` · 없음 ${absent.length}일` : ''}{unknown ? ` · 모름 ${unknown}일` : ''}</span>
      </div>
      {(told.length > 0 || absent.length > 0) && (
        <div className="day-body">
          {told.flatMap((d) => d.entries.filter((e) => e.presence !== 'absent' || parseDetail(e).lines.length > 0).map((e, i) => (
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
  const { otherName, lines } = parseDetail(entry);
  const countPrefix = COUNT_PREFIX[entry.symptomType];
  const chips: string[] = [];
  if (otherName) chips.push(otherName);
  if (entry.presence === 'unknown') chips.push('모름');
  if (entry.bodyPart) chips.push(`${locationName(entry.bodyPart, entry.bodySide)}${entry.rawLocationText ? ` · “${entry.rawLocationText}”` : ''}`);
  else if (entry.rawLocationText) chips.push(`“${entry.rawLocationText}”`);
  if (entry.occurrenceCount !== undefined) chips.push(`${countPrefix ? `${countPrefix} ` : ''}${entry.occurrenceCount}회`);
  if (entry.durationMinutes !== undefined) chips.push(`한 번에 ${entry.durationMinutes}분`);
  return (
    <div className={`entry ${targeted ? 'target' : ''}`} data-entry={first ? `${day}:${entry.symptomType}` : undefined}>
      <div className="type">{first && <>{shortMdw(date)}<small>{hm(date)} 통화</small></>}</div>
      <div className="entry-content">
        {chips.length > 0 && (
          <div className="facts">
            {chips.map((c) => <span key={c} className="badge">{c}</span>)}
          </div>
        )}
        <div className="text answer-lines">
          {lines.map((l, i) => (
            <p key={i}>{l.label && <span className="label">{l.label} </span>}{l.text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

type SymptomStateName = 'present' | 'absent' | 'unknown' | 'unrecorded';
function SymptomState({ state }: { state: SymptomStateName }) {
  return <span className={`sym-state sym-state-${state}`} aria-hidden="true">
    {state === 'present' ? <span className="state-dot" /> : <Icon name={state === 'absent' ? 'minus' : state === 'unknown' ? 'question' : 'circleDashed'} size={state === 'absent' ? 12 : 14} />}
  </span>;
}
