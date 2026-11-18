import type { DoctorData } from './server.ts';

/**
 * 다시 읽은 기록을 화면에 반영할 모습으로 만든다.
 * 전에 읽었던 부분을 이번에 못 읽었으면 null: 빈 기록으로 덮어쓰지 않고 보던 기록을 유지한다.
 * 내용이 같으면 환자 목록을 그대로 둬서 화면과 그래프가 다시 그려지지 않게 한다.
 */
export function mergeRefreshed(previous: DoctorData, next: DoctorData): DoctorData | null {
  if (next.failed.some((name) => !previous.failed.includes(name))) return null;
  const same = JSON.stringify(next.patients) === JSON.stringify(previous.patients);
  return {
    doctorName: next.doctorName || previous.doctorName,
    patients: same ? previous.patients : next.patients,
    failed: next.failed,
  };
}
