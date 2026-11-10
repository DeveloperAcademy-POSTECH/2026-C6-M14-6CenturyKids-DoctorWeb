import type { SupabaseClient } from '@supabase/supabase-js';
import type { Patient } from '../domain/types.ts';
import { toPatients, type PainRecordRow, type PatientRow, type PrevisitRow, type SymptomRecordRow } from './mapping.ts';

export interface DoctorData {
  doctorName: string;
  patients: Patient[];
  /** 읽지 못한 부분 ("진료 전 기록") — 권한이 아직 없을 때 화면은 나머지로 그린다 */
  failed: string[];
}

export class NotDoctorError extends Error {}

/**
 * 로그인한 의사의 담당 환자와 기록을 한 번에 읽는다. 읽기 권한은 서버 RLS가 막는다.
 * 환자가 적다는 전제로 전부 읽음 — 환자·기록이 많아지면 고른 환자만 읽도록 바꾼다.
 */
export async function loadDoctorData(client: SupabaseClient, userId: string, today: Date): Promise<DoctorData> {
  const doctor = await client.from('doctors').select('user_id').eq('user_id', userId).maybeSingle();
  if (doctor.error) throw doctor.error;
  if (!doctor.data) throw new NotDoctorError();

  const [me, patients] = await Promise.all([
    client.from('users').select('name').eq('id', userId).maybeSingle(),
    client.from('patients')
      .select('user_id, carcinoma_type, carcinoma_stage, user:users(id, name, birthday, sex)')
      .eq('doctor_id', userId)
      .returns<PatientRow[]>(),
  ]);
  if (patients.error) throw patients.error;
  const ids = patients.data.map((p) => p.user_id);

  const [symptoms, pains, previsits] = ids.length
    ? await Promise.all([
      client.from('symptom_records')
        .select('patient_id, recorded_at, condition, entries:symptom_entries(type, part, side, raw_location, presence, duration, count, detail)')
        .in('patient_id', ids).returns<SymptomRecordRow[]>(),
      client.from('pain_records')
        .select('patient_id, occurred_at, pain_before, pain_after, locations:pain_locations(part, side, view)')
        .in('patient_id', ids).returns<PainRecordRow[]>(),
      client.from('previsit_records')
        .select('patient_id, selected_date, memo, state_of_mind, submitted_at')
        .in('patient_id', ids).returns<PrevisitRow[]>(),
    ])
    : [null, null, null];

  const failed: string[] = [];
  const rows = <T,>(result: { data: T[] | null; error: unknown } | null, name: string): T[] => {
    if (result?.error) {
      console.warn(`${name} 읽기 실패`, result.error);
      failed.push(name);
    }
    return result?.data ?? [];
  };

  return {
    doctorName: me.data?.name ?? '',
    patients: toPatients({
      patients: patients.data,
      symptoms: rows(symptoms, '증상 기록'),
      pains: rows(pains, '통증 기록'),
      previsits: rows(previsits, '진료 전 기록'),
    }, today),
    failed,
  };
}
