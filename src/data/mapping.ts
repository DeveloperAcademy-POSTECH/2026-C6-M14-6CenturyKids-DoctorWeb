// 서버 행 → 화면 타입. 앱 DTO(ToDoc/Data/DTOs)의 toDomain과 같은 규칙.
import type {
  BodyLocation, BodyPart, BodySide, BodyView, Patient, PainRecord, PrevisitRecord,
  StateOfMind, SymptomEntry, SymptomPresence, SymptomRecord, SymptomType,
} from '../domain/types.ts';

export interface UserRow { id: string; name: string; birthday: string; sex: string }
export interface PatientRow {
  user_id: string;
  carcinoma_type: string | null;
  carcinoma_stage: string | null;
  user: UserRow | null;
}
export interface SymptomEntryRow {
  type: string; part: string | null; side: string | null; raw_location: string | null;
  presence: string; duration: number | null; count: number | null; detail: string | null;
}
export interface SymptomRecordRow { patient_id: string; recorded_at: string; condition: string | null; entries: SymptomEntryRow[] }
export interface PainLocationRow { part: string; side: string; view: string }
export interface PainRecordRow { patient_id: string; occurred_at: string; pain_before: number; pain_after: number | null; locations: PainLocationRow[] }
export interface PrevisitRow { patient_id: string; selected_date: string; memo: string | null; state_of_mind: string; submitted_at: string }

const CARCINOMA_NAMES: Record<string, string> = {
  liver: '간암', thyroid: '갑상선암', gallbladderAndBileDuct: '담낭 및 담도암', colorectal: '대장암', kidney: '신장암',
  stomach: '위암', breast: '유방암', prostate: '전립선암', pancreas: '췌장암', lung: '폐암', larynx: '후두암',
  thymus: '흉선암', esophagus: '식도암', smallIntestine: '소장암', anus: '항문암',
};
const STAGE_NAMES: Record<string, string> = { stage0: '0기', stage1: '1기', stage2: '2기', stage3: '3기', stage4: '4기' };

/** 'YYYY-MM-DD'(날짜만 저장한 칸)를 그 날 0시로. new Date('YYYY-MM-DD')는 UTC로 읽어 하루가 밀릴 수 있다 */
export const dateOnly = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const ageOn = (birthday: Date, today: Date) => {
  const had = today.getMonth() > birthday.getMonth()
    || (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());
  return today.getFullYear() - birthday.getFullYear() - (had ? 0 : 1);
};

export const cancerName = (type: string | null, stage: string | null) => {
  if (!type || type === 'unknown') return stage && STAGE_NAMES[stage] ? `암종 모름 ${STAGE_NAMES[stage]}` : undefined;
  const name = CARCINOMA_NAMES[type] ?? type; // 목록에 없으면 환자가 직접 쓴 이름
  return stage && STAGE_NAMES[stage] ? `${name} ${STAGE_NAMES[stage]}` : name;
};

const location = (row: PainLocationRow): BodyLocation =>
  ({ bodyPart: row.part as BodyPart, bodySide: row.side as BodySide, bodyView: row.view as BodyView });

const entry = (row: SymptomEntryRow): SymptomEntry => ({
  symptomType: row.type as SymptomType,
  presence: row.presence as SymptomPresence,
  bodyPart: (row.part ?? undefined) as BodyPart | undefined,
  bodySide: (row.side ?? undefined) as BodySide | undefined,
  rawLocationText: row.raw_location ?? undefined,
  durationMinutes: row.duration ?? undefined,
  occurrenceCount: row.count ?? undefined,
  detail: row.detail ?? undefined,
});

export function toPatients(
  rows: { patients: PatientRow[]; symptoms: SymptomRecordRow[]; pains: PainRecordRow[]; previsits: PrevisitRow[] },
  today: Date,
): Patient[] {
  return rows.patients.map((p): Patient => {
    const user = p.user;
    return {
      id: p.user_id,
      name: user?.name,
      sex: user?.sex === 'male' ? '남' : user?.sex === 'female' ? '여' : undefined,
      age: user?.birthday ? ageOn(dateOnly(user.birthday), today) : undefined,
      cancer: cancerName(p.carcinoma_type, p.carcinoma_stage),
      symptoms: rows.symptoms.filter((r) => r.patient_id === p.user_id).map((r): SymptomRecord => ({
        recordedDate: new Date(r.recorded_at),
        conditionText: r.condition ?? undefined,
        symptoms: r.entries.map(entry),
      })),
      pains: rows.pains.filter((r) => r.patient_id === p.user_id).map((r): PainRecord => ({
        recordedDate: new Date(r.occurred_at),
        location: r.locations.map(location),
        painBefore: r.pain_before,
        painAfter: r.pain_after ?? undefined,
      })),
      previsits: rows.previsits.filter((r) => r.patient_id === p.user_id)
        .map((r): PrevisitRecord => ({
          selectedDate: dateOnly(r.selected_date),
          memo: r.memo ?? undefined,
          stateOfMind: r.state_of_mind as StateOfMind,
          submittedAt: new Date(r.submitted_at),
        }))
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()),
    };
  });
}
