import type { BodyPart, BodySide, BodyView, StateOfMind, SymptomType } from './types';

export const SYMPTOM_NAMES: Record<SymptomType, string> = {
  nauseaVomiting: '오심·구토', constipation: '변비', diarrhea: '설사', oralPain: '구내염',
  numbness: '손발 저림', rashItching: '피부 발진·가려움', dehydrationNutrition: '탈수·영양', other: '기타',
};
export const CARE_CALL_TYPES = (Object.keys(SYMPTOM_NAMES) as SymptomType[]).filter((t) => t !== 'other');

// 앱 side_effects.json: 꼬리질문이 둘인 항목만 답 앞에 질문 이름이 붙어 저장된다
export const DETAIL_LABELS: Partial<Record<SymptomType, string[]>> = {
  nauseaVomiting: ['구토 횟수', '메스꺼움 시작'],
};
// 횟수를 물은 질문이 "하루에 몇 번"이라 칩도 그렇게 읽힌다
export const COUNT_PREFIX: Partial<Record<SymptomType, string>> = {
  nauseaVomiting: '구토 하루',
  diarrhea: '하루',
};

export const PART_NAMES: Record<BodyPart, string> = {
  headFace: '머리·얼굴', neck: '목', shoulder: '어깨', chest: '가슴', abdomen: '배',
  backLowerBack: '등·허리', pelvisButtocks: '골반·엉덩이', armHand: '팔·손', legFoot: '다리·발',
};
const SIDE_NAMES: Record<BodySide, string> = { left: '왼쪽', right: '오른쪽', center: '', both: '양쪽', unspecified: '' };
export const locationName = (part: BodyPart, side?: BodySide) =>
  `${side && SIDE_NAMES[side] ? `${SIDE_NAMES[side]} ` : ''}${PART_NAMES[part]}`;

export const MOODS: Record<StateOfMind, { title: string; caption?: string; color: string }> = {
  candid: { title: '숨김없이 이야기 해주세요', caption: '차분히 이야기를 들을 수 있어요', color: 'var(--m-calm)' },
  comfortable: { title: '편하게 이야기 해주세요', caption: '걱정되지만 이야기를 듣고싶어요', color: 'var(--m-worried)' },
  slowly: { title: '천천히 이야기 해주세요', caption: '걱정되는 마음이 커요', color: 'var(--m-anxious)' },
  carefully: { title: '조심스럽게 이야기 해주세요', caption: '마음의 준비가 더 필요해요', color: 'var(--m-notready)' },
  unsure: { title: '아직 잘 모르겠어요', color: 'var(--m-unsure)' },
};

// 앱 PainLocationSelectionView 표시점 좌표 (몸 그림 정사각 이미지 기준 비율)
export const BODY_REGIONS: { part: BodyPart; side: BodySide; view: Exclude<BodyView, 'unspecified'>; x: number; y: number }[] = [
  { part: 'headFace', side: 'center', view: 'front', x: 0.27, y: 0.122 }, { part: 'neck', side: 'center', view: 'front', x: 0.27, y: 0.217 },
  { part: 'shoulder', side: 'right', view: 'front', x: 0.192, y: 0.246 }, { part: 'shoulder', side: 'left', view: 'front', x: 0.348, y: 0.246 },
  { part: 'chest', side: 'center', view: 'front', x: 0.27, y: 0.288 }, { part: 'abdomen', side: 'center', view: 'front', x: 0.27, y: 0.387 },
  { part: 'pelvisButtocks', side: 'center', view: 'front', x: 0.27, y: 0.492 },
  { part: 'armHand', side: 'right', view: 'front', x: 0.1265, y: 0.4365 }, { part: 'armHand', side: 'left', view: 'front', x: 0.4115, y: 0.4365 },
  { part: 'legFoot', side: 'right', view: 'front', x: 0.23, y: 0.748 }, { part: 'legFoot', side: 'left', view: 'front', x: 0.306, y: 0.748 },
  { part: 'headFace', side: 'center', view: 'back', x: 0.727, y: 0.122 }, { part: 'neck', side: 'center', view: 'back', x: 0.727, y: 0.217 },
  { part: 'shoulder', side: 'left', view: 'back', x: 0.649, y: 0.246 }, { part: 'shoulder', side: 'right', view: 'back', x: 0.805, y: 0.246 },
  { part: 'backLowerBack', side: 'center', view: 'back', x: 0.7226, y: 0.38 }, { part: 'pelvisButtocks', side: 'center', view: 'back', x: 0.727, y: 0.507 },
  { part: 'armHand', side: 'left', view: 'back', x: 0.5865, y: 0.4365 }, { part: 'armHand', side: 'right', view: 'back', x: 0.8685, y: 0.4365 },
  { part: 'legFoot', side: 'left', view: 'back', x: 0.689, y: 0.748 }, { part: 'legFoot', side: 'right', view: 'back', x: 0.765, y: 0.748 },
];

export const scoreColor = (v: number) =>
  v <= 1 ? 'var(--s0)' : v <= 3 ? 'var(--s25)' : v <= 6 ? 'var(--s50)' : v <= 8 ? 'var(--s75)' : 'var(--s100)';
