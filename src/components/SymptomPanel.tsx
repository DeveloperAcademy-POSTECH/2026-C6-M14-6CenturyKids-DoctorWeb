import { useEffect, useRef } from 'react';
import { SYMPTOM_NAMES, symVars } from '../domain/labels.ts';
import type { SymptomEntry, SymptomRecord, SymptomType } from '../domain/types.ts';
import { dayKey, hm, mdw, shortMdw } from '../lib/dates.ts';
import { entryFacts, isReview, parseDetail } from '../lib/symptomDetail.ts';
import { summarizeBySymptom, type SymptomSummary } from '../lib/symptomSummary.ts';
import { prefersReducedMotion } from '../lib/useMedia.ts';

interface Props {
  records: SymptomRecord[];
  /** 증상·통증이 함께 보는 7일 */
  days: Date[];
  /** 한눈에 보기에서 고른 날 · 증상 */
  focusDay: string | null;
  focusType: SymptomType | null;
  onClearFocus: () => void;
}

/** 증상 기록 자세히: 맨 위 '컨디션 어떠세요?' 답, 아래 증상별 카드 2열(있음이 많은 순). 날짜 표·필터는 두지 않는다 */
export default function SymptomPanel({ records, days, focusDay, focusType, onClearFocus }: Props) {
  const page = useRef<HTMLElement>(null);
  const byDay = new Map(records.map((r) => [dayKey(r.recordedDate), r]));
  const inWindow = days.map((t) => byDay.get(dayKey(t))).filter((r): r is SymptomRecord => !!r);
  const summaries = summarizeBySymptom(inWindow).filter((s) => s.days.some((d) => d.state !== 'absent'));
  const answers = inWindow.filter((r) => r.conditionText).sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime());
  const focused = focusDay ? byDay.get(focusDay) : undefined;

  // 고른 증상 카드, 또는 고른 날 첫 기록으로
  useEffect(() => {
    const el = focusType ? page.current?.querySelector(`[data-type="${focusType}"]`)
      : focusDay ? page.current?.querySelector(`.sym-card [data-day="${focusDay}"]`) : null;
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: focusType ? 'start' : 'center' });
  }, [focusDay, focusType]);

  return (
    <section className="detail" aria-labelledby="h-symptom" ref={page}>
      <div className="detail-head">
        <h2 id="h-symptom" className="detail-title">증상 기록</h2>
        <span className="hint">환자가 매일 앱에서 말로 답한 증상</span>
        {focused && (
          <span className="scope end">
            <span className="swatch hit-swatch" /><b>{mdw(focused.recordedDate)}</b> 기록에 표시했어요
            <button type="button" className="soft-btn" onClick={onClearFocus}>표시 지우기</button>
          </span>
        )}
      </div>
      {!records.length ? <p className="card empty-note">아직 증상 기록이 없어요</p>
        : !inWindow.length ? <p className="card empty-note">이 기간에는 증상 기록이 없어요</p> : (
          <>
            {answers.length > 0 && (
              <section className="card">
                <div className="card-head">
                  <h3 className="card-title">컨디션 어떠세요?</h3>
                  <span className="hint">매일 첫 질문에 환자가 한 답</span>
                </div>
                <div className="rows cols-2">
                  {answers.map((r) => (
                    <div key={r.recordedDate.getTime()} className={`row ${focusDay === dayKey(r.recordedDate) ? 'hit' : ''}`}>
                      <div className="when"><b>{shortMdw(r.recordedDate)}</b> {hm(r.recordedDate)}</div>
                      <p className="text">“{r.conditionText}”</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {summaries.length === 0 ? <p className="card empty-note">이 기간에는 있다고 답한 증상이 없어요</p> : (
              <div className="masonry">
                {summaries.map((s) => <SymptomCard key={s.type} summary={s} focusDay={focusDay} picked={focusType === s.type} />)}
              </div>
            )}
          </>
        )}
    </section>
  );
}

/** 환자 앱 하루 기록 목록과 같은 모양: 색 점 + 이름 + 있음 날 수, 아래 날짜별 원문 */
function SymptomCard({ summary, focusDay, picked }: { summary: SymptomSummary; focusDay: string | null; picked: boolean }) {
  const { type, days, count, review } = summary;
  const told = days.filter((d) => d.state !== 'absent');
  const absent = days.filter((d) => d.state === 'absent');
  const unknown = days.filter((d) => d.state === 'unknown').length;
  return (
    <article className={`card sym-card ${picked ? 'picked' : ''}`} data-type={type}>
      <div className="card-head">
        <span className="sym-dot" style={symVars(type)} aria-hidden="true" />
        <h3 className="card-title">{SYMPTOM_NAMES[type]}</h3>
        {review > 0 && <span className="badge">확인 요청 {review}</span>}
        <span className="count end"><span>있음 <b>{count}일</b></span>{absent.length > 0 && <span>없음 {absent.length}일</span>}{unknown > 0 && <span>모름 {unknown}일</span>}</span>
      </div>
      <div className="rows">
        {told.map((d) => (
          <div key={d.day} className={`row ${focusDay === d.day ? 'hit' : ''}`} data-day={d.day}>
            <div className="when"><b>{shortMdw(d.recordedDate)}</b> {hm(d.recordedDate)}</div>
            {d.entries.filter((e) => e.presence !== 'absent' || isReview(e)).map((e, i) => <Entry key={i} entry={e} />)}
          </div>
        ))}
        {absent.length > 0 && <p className="rest"><b>없다고 답한 날</b> {absent.map((d) => shortMdw(d.recordedDate)).join(', ')}</p>}
      </div>
    </article>
  );
}

function Entry({ entry }: { entry: SymptomEntry }) {
  const { needsReview, lines } = parseDetail(entry);
  const chips = entryFacts(entry);
  return (
    <>
      {(chips.length > 0 || needsReview) && (
        <div className="chips">
          {chips.map((c) => <span key={c} className="chip">{c}</span>)}
          {needsReview && <span className="badge">앱 확인 요청</span>}
        </div>
      )}
      <p className="text">
        {lines.map((l, i) => (
          <span key={i}>{i > 0 && <br />}{l.label && <span className="label">{l.label} </span>}{l.text}</span>
        ))}
      </p>
    </>
  );
}
