import type { StateOfMind } from '../domain/types.ts';
import { MOODS } from '../domain/labels.ts';
import calm from '../assets/avatar/calm.png';
import worried from '../assets/avatar/worried.png';
import anxious from '../assets/avatar/anxious.png';
import notready from '../assets/avatar/notready.png';
import unsure from '../assets/avatar/unsure.png';

// 피그마 디자인 시스템 Avatar (주치의 캐릭터 얼굴, Mood=Calm·Worried·Anxious·NotReady·Unsure)
const FACES: Record<StateOfMind, string> = { candid: calm, comfortable: worried, slowly: anxious, carefully: notready, unsure };

/** 진료 전 기록 마음 얼굴. 마음이 없으면 같은 크기 빈 자리 */
export default function Avatar({ mood, size = 40 }: { mood?: StateOfMind; size?: 40 | 48 }) {
  if (!mood) return <span className="avatar-slot" style={{ width: size, height: size }} aria-hidden="true" />;
  return <img className="avatar" src={FACES[mood]} width={size} height={size} alt={MOODS[mood].title} />;
}
