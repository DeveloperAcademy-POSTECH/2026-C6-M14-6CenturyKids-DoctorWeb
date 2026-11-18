import Icon from './Icon.tsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

/** 화면 스크롤로 옮길 때 고정된 상단 바에 가리지 않게 뺄 높이 */
const topbarHeight = () => document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;

/** 증상 기록: 7일 단위, 위는 한눈에 보는 표, 아래는 증상별 줄글 */
export default function SymptomPanel({ records, days, jump }: Props) {
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  // 증상별 기록에서 볼 증상 (all = 전체)
  const [filter, setFilter] = useState<Filter>('all');
  const { container, scrollTo, toTop } = useScrollTo<HTMLDivElement>();
  const recordsRef = useRef<HTMLDivElement>(null);
  /**
   * 칩을 바꾸면 목록 길이가 달라져 스크롤이 당겨지고 칸 크기가 바뀌던 문제:
   * '증상별 기록' 제목을 늘 같은 자리(칸 맨 위)에 두고, 목록 자리는 최소 높이로 지킨다
   */
  const [alignSeq, setAlignSeq] = useState(0);
  const pickFilter = (v: Filter) => {
    setFilter(v);
    setAlignSeq((n) => n + 1);
  };
  // 새 목록이 그려진 직후(화면에 칠하기 전) 제목 자리를 맞춘다. 탭이 뒤에 있어도 동작하도록 rAF 대신 레이아웃 효과로
  useLayoutEffect(() => {
    if (!alignSeq) return;
    const box = container.current;
    const head = recordsRef.current;
    if (!box || !head) return;
    const inner = getComputedStyle(box).overflowY === 'auto' && box.scrollHeight > box.clientHeight;
    if (inner) box.scrollTop += head.getBoundingClientRect().top - box.getBoundingClientRect().top - 8;
    else window.scrollTo({ top: head.getBoundingClientRect().top + window.scrollY - topbarHeight() - 16 });
  }, [alignSeq]); // eslint-disable-line react-hooks/exhaustive-deps

  // 기간이 바뀌면 강조를 풀고 맨 위로 (날짜로 가기는 아래 효과가 다시 고른다)
  const start = days[0]?.getTime();
  useEffect(() => {
    setFocusDay(null);
    setTarget(null);
    toTop();
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!jump) { setFocusDay(null); return; }
    const day = dayKey(jump.date);
    setFocusDay(day);
    setTarget(null);
    toTop();
  }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps

  // 표의 점을 눌러 아래 답으로 내려갔을 때만 '7일 증상 분포로' 되돌아가는 버튼을 띄운다
  const [atEntry, setAtEntry] = useState(false);
  // 버튼이 사라지면서 목록 높이가 바뀌면 진행 중인 부드러운 스크롤이 멈춰서, 버튼을 먼저 감추고 다 그린 뒤에 올라간다
  const goingBack = useRef(false);
  const backToGrid = () => {
    goingBack.current = true;
    setAtEntry(false);
  };
  useEffect(() => {
    if (atEntry || !goingBack.current) return;
    goingBack.current = false;
    // 칸 안 스크롤과 화면 스크롤 둘 다 표가 보이는 자리로 (점을 누를 때 둘 다 움직였을 수 있어서)
    container.current?.scrollTo({ top: 0, behavior: 'smooth' });
    const section = document.getElementById('symptom-records');
    if (section && section.getBoundingClientRect().top < topbarHeight()) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [atEntry]); // eslint-disable-line react-hooks/exhaustive-deps
  const goToEntry = (day: string, type: SymptomType) => {
    setAtEntry(true);
    // 다른 증상만 보고 있으면 누른 증상으로 바꿔야 그 기록이 보인다
    if (shown !== 'all' && shown !== type) setFilter(type);
    setFocusDay(day);
    setTarget(`${day}:${type}`);
    scrollTo(`[data-entry="${day}:${type}"]`, 'center');
  };

  const byDay = new Map(records.map((r) => [dayKey(r.recordedDate), r]));
  const inWindow = days.map((t) => byDay.get(dayKey(t))).filter((r): r is SymptomRecord => !!r);
  const summaries = summarizeBySymptom(inWindow);
  // 있다고(또는 모른다고) 답한 날이 있는 증상만 고를 수 있다. '없음'만 있는 증상은 칩을 흐리게 두어
  // 누르지 않아도 '이 기간 증상 없었음'을 알 수 있게 (목록에도 넣지 않는다)
  // 진료 전 기록에서 '이 날 기록 보기'로 오면 그 하루 답만 (위 날짜 줄에서 7일 전체로 되돌린다)
  const onlyDay = jump ? dayKey(jump.date) : null;
  const told = summaries
    .map((s) => (onlyDay ? { ...s, days: s.days.filter((d) => d.day === onlyDay) } : s))
    .filter((s) => s.days.some((d) => d.state !== 'absent'));
  const asked = new Set(summaries.map((s) => s.type));
  const available = (f: Filter) => f === 'all' || told.some((s) => s.type === f);
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
        {/* 하루만 보는 중이면 7일 표는 감춘다 (그 날 답만 보여 준다는 안내와 맞게) */}
        {inWindow.length > 0 && !onlyDay && <WeekGrid days={days} byDay={byDay} rows={rows} focusDay={focusDay} onPick={goToEntry} />}
        {records.length > 0 && inWindow.length > 0 && (
          <div className="sym-records" ref={recordsRef}>
            <h3 className="records-heading">{onlyDay && jump ? `${mdw(jump.date)} 증상 기록` : '증상별 기록'}</h3>
            <SymptomFilter value={shown} asked={asked} available={available} onChange={pickFilter} />
            {told.filter((s) => shown === 'all' || s.type === shown)
              .map((s) => <SymptomCard key={s.type} summary={s} target={target} />)}
            {atEntry && (
              <button type="button" className="back-to-grid" onClick={backToGrid}>
                <Icon name="arrowUp" size={16} />7일 증상 분포로
              </button>
            )}
          </div>
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
                <th key={dayKey(t)} scope="col" aria-label={mdw(t)} className={`${byDay.has(dayKey(t)) ? '' : 'off'} ${focusDay === dayKey(t) ? 'focus' : ''}`}>
                  <b><span className="grid-month">{t.getMonth() + 1}/</span>{t.getDate()}</b>{weekday(t)}
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

/** [전체] [오심·구토] … [기타]: 이 기간 물어본 증상만. '없음'만 답한 증상은 흐린 칩(누를 수 없음) */
function SymptomFilter({ value, asked, available, onChange }: {
  value: Filter;
  asked: Set<SymptomType>;
  available: (f: Filter) => boolean;
  onChange: (v: Filter) => void;
}) {
  const options: Filter[] = ['all', ...CARE_CALL_TYPES, 'other'];
  const anyOff = options.some((o) => o !== 'all' && asked.has(o) && !available(o));
  return (
    <div className="sym-filter" role="group" aria-label="증상 고르기">
      {options.filter((o) => o === 'all' || asked.has(o)).map((o) => {
        const off = !available(o);
        return (
          <ToggleButton key={o} size="small" appearance="outline" className={off ? 'none-told' : undefined}
            checked={value === o} disabled={off} onClick={() => onChange(o)}
            title={off ? '이 기간에는 없다고 답했어요' : undefined}
            aria-label={off ? `${SYMPTOM_NAMES[o as SymptomType]}, 이 기간 없다고 답함` : undefined}>
            {o === 'all' ? '전체' : SYMPTOM_NAMES[o]}
          </ToggleButton>
        );
      })}
      {anyOff && <span className="sym-filter-note">흐린 증상은 이 기간에 없다고 답했어요</span>}
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
