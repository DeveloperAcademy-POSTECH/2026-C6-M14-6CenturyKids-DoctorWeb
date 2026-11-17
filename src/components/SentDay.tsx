import type { Patient } from '../domain/types.ts';
import { dayKey, mdw } from '../lib/dates.ts';
import Chevron from './Chevron.tsx';

interface Props {
  patient: Patient;
  /** 환자가 진료 전 기록에 함께 보낸 날 */
  date: Date;
  onOpenSymptom: () => void;
  onOpenPain: () => void;
}

/** 진료 때 이야기하고 싶은 날 (진료 전 기록 자세히): 날짜, 그날 한 문장, 그날 기록으로 가는 버튼 (버튼 이름에 어느 기록으로 가는지 밝힌다) */
export default function SentDay({ patient, date, onOpenSymptom, onOpenPain }: Props) {
  const day = dayKey(date);
  const symptom = patient.symptoms.find((s) => dayKey(s.recordedDate) === day);
  const pains = patient.pains.filter((p) => dayKey(p.recordedDate) === day);
  const presentCount = symptom?.symptoms.filter((e) => e.presence === 'present').length ?? 0;
  const maxPain = pains.length ? Math.max(...pains.map((p) => p.painBefore)) : undefined;
  const has = !!symptom || maxPain !== undefined;
  return (
    <div className="sent-day">
      <p className="sent-date">{mdw(date)}</p>
      {!has ? <p className="t-body muted">이날 남긴 증상과 통증 기록이 없어요</p> : (
        <p className="t-body">
          {symptom && <>증상 <b>{presentCount}개</b>를 말했{maxPain !== undefined ? '고 ' : '어요.'}</>}
          {maxPain !== undefined && <>통증은 최고 <b>{maxPain}점</b>이었어요.</>}
        </p>
      )}
      {has && <button type="button" className="more" onClick={symptom ? onOpenSymptom : onOpenPain}>{symptom ? '이날 증상 기록 보기' : '이날 통증 기록 보기'}<Chevron /></button>}
    </div>
  );
}
