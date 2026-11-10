// 앱 Domain 모델(ToDoc/Domain)과 같은 모양. 서버 연결 때 DTO → 이 타입으로 바꾼다.

export type SymptomType =
  | 'nauseaVomiting' | 'constipation' | 'diarrhea' | 'oralPain'
  | 'numbness' | 'rashItching' | 'dehydrationNutrition' | 'other';
export type SymptomPresence = 'present' | 'absent' | 'unknown';
export type BodyPart =
  | 'headFace' | 'neck' | 'shoulder' | 'chest' | 'abdomen'
  | 'backLowerBack' | 'pelvisButtocks' | 'armHand' | 'legFoot';
export type BodySide = 'left' | 'right' | 'center' | 'both' | 'unspecified';
export type BodyView = 'front' | 'back' | 'unspecified';
export type StateOfMind = 'candid' | 'comfortable' | 'slowly' | 'carefully' | 'unsure';

export interface SymptomEntry {
  symptomType: SymptomType;
  presence: SymptomPresence;
  bodyPart?: BodyPart;
  bodySide?: BodySide;
  rawLocationText?: string;
  durationMinutes?: number;
  occurrenceCount?: number;
  /** "[검토 필요] 기타 이름: 유무 답 원문 / 꼬리질문 답 / 모르겠다는 답" (SymptomRecordConverter.detailText) */
  detail?: string;
}

export interface SymptomRecord {
  recordedDate: Date;
  /** 첫 질문(오늘 몸 상태)에 한 답 원문 */
  conditionText?: string;
  symptoms: SymptomEntry[];
}

export interface BodyLocation {
  bodyPart: BodyPart;
  bodySide: BodySide;
  bodyView: BodyView;
}

export interface PainRecord {
  recordedDate: Date;
  location: BodyLocation[];
  painBefore: number;
  /** 먹고 1시간 뒤 점수. 아직 안 남겼으면 없음 */
  painAfter?: number;
}

export interface PrevisitRecord {
  /** 함께 보낸 기록의 날 */
  selectedDate: Date;
  memo?: string;
  stateOfMind: StateOfMind;
  submittedAt: Date;
}

export interface Patient {
  id: string;
  /** 환자 users 행을 읽을 권한이 없으면 비어 있음 */
  name?: string;
  sex?: '남' | '여';
  age?: number;
  /** "대장암 3기" */
  cancer?: string;
  symptoms: SymptomRecord[];
  pains: PainRecord[];
  previsits: PrevisitRecord[];
}
