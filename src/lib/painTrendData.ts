import type { PainRecord } from '../domain/types.ts';
import { dayKey, mdw } from './dates.ts';

export interface PainTrendDay { key: string; label: string; fullDate: string; before: number | null; after: number | null; }
/** One event per day. Follow-up must belong to that exact event; missing stays null. */
export function painTrendData(records: PainRecord[], days: Date[]): PainTrendDay[] {
  return days.map(day => {
    const event = records.filter(r => dayKey(r.recordedDate) === dayKey(day))
      .sort((a,b) => b.recordedDate.getTime() - a.recordedDate.getTime())[0];
    return { key: dayKey(day), label: `${day.getMonth()+1}/${day.getDate()}`, fullDate: mdw(day), before: event?.painBefore ?? null, after: event?.painAfter ?? null };
  });
}
