import { MOODS } from '../domain/labels.ts';
import type { StateOfMind } from '../domain/types.ts';

/** 진료 전 기록 기분 얼굴 (앱 AppFeedback.Avatar 색). 기분이 없으면 회색 */
export default function Avatar({ mood }: { mood?: StateOfMind }) {
  return (
    <span className={`avatar ${mood ? '' : 'none'}`} style={mood ? { background: MOODS[mood].color } : undefined}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="7" cy="8.5" r="1.3" fill="#2B282B" />
        <circle cx="13" cy="8.5" r="1.3" fill="#2B282B" />
        <path d="M6.5 13c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5" stroke="#2B282B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}
