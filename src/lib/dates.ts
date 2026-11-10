const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const DAY = 86_400_000;

export const startOfDay = (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate());
export const dayKey = (t: Date) => `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;
export const weekday = (t: Date) => WEEK[t.getDay()];
export const md = (t: Date) => `${t.getMonth() + 1}월 ${t.getDate()}일`;
export const mdw = (t: Date) => `${md(t)} (${weekday(t)})`;
export const shortMdw = (t: Date) => `${t.getMonth() + 1}/${t.getDate()} (${weekday(t)})`;
export const hm = (t: Date) => {
  const h = t.getHours();
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(t.getMinutes()).padStart(2, '0')}`;
};
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);

/** 오늘 기준 "오늘 오전 9:12" / "어제" / "11/6" */
export const relative = (t: Date, today: Date) => {
  const n = daysBetween(t, today);
  return n === 0 ? `오늘 ${hm(t)}` : n === 1 ? '어제' : `${t.getMonth() + 1}/${t.getDate()}`;
};

/**
 * 기록을 7일 창으로 나눈다. k = 0이 가장 최근 창(끝 = 최신 기록일), k가 커질수록 7일씩 과거.
 * 기록이 없으면 null.
 */
export function weekWindows(dates: Date[]) {
  if (!dates.length) return null;
  const latest = startOfDay(new Date(Math.max(...dates.map((t) => t.getTime()))));
  const earliest = startOfDay(new Date(Math.min(...dates.map((t) => t.getTime()))));
  const max = Math.floor(daysBetween(earliest, latest) / 7);
  return {
    max,
    days(k: number) {
      const end = latest.getTime() - k * 7 * DAY;
      return Array.from({ length: 7 }, (_, i) => new Date(end - (6 - i) * DAY));
    },
    indexOf(t: Date) {
      return Math.min(max, Math.max(0, Math.floor(daysBetween(t, latest) / 7)));
    },
  };
}
