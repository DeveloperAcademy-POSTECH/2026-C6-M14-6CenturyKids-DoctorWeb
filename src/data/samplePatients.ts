// 예시 데이터. 서버 연결 전까지 화면 확인용이며 실제 환자가 아니다.
// detail은 앱 SymptomRecordConverter가 저장하는 모양 그대로:
//   "[검토 필요] 기타 이름: 유무 답 원문 / 꼬리질문 답" (질문 이름은 꼬리질문이 둘인 오심·구토만)
import { CARE_CALL_TYPES } from '../domain/labels.ts';
import type { BodyLocation, Patient, PainRecord, PrevisitRecord, SymptomEntry, SymptomRecord, SymptomType } from '../domain/types.ts';

export const TODAY = new Date(2026, 10, 9);

const at = (s: string) => {
  const [date, time = '0:0'] = s.split(' ');
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi);
};
const has = (symptomType: SymptomType, detail: string, more: Partial<SymptomEntry> = {}): SymptomEntry =>
  ({ symptomType, presence: 'present', detail, ...more });
const unknown = (symptomType: SymptomType, detail: string): SymptomEntry => ({ symptomType, presence: 'unknown', detail });
const none = (...types: SymptomType[]): SymptomEntry[] => types.map((symptomType) => ({ symptomType, presence: 'absent' }));
/** 끝까지 마친 통화: 말하지 않은 일곱 항목은 '없음' */
const call = (time: string, conditionText: string, entries: SymptomEntry[]): SymptomRecord => ({
  recordedDate: at(time), conditionText,
  symptoms: [...entries, ...none(...CARE_CALL_TYPES.filter((t) => !entries.some((e) => e.symptomType === t)))],
});

const LOC: Record<string, BodyLocation> = {
  abd: { bodyPart: 'abdomen', bodySide: 'center', bodyView: 'front' },
  back: { bodyPart: 'backLowerBack', bodySide: 'center', bodyView: 'back' },
  head: { bodyPart: 'headFace', bodySide: 'center', bodyView: 'front' },
  legL: { bodyPart: 'legFoot', bodySide: 'left', bodyView: 'front' },
  legR: { bodyPart: 'legFoot', bodySide: 'right', bodyView: 'front' },
  chest: { bodyPart: 'chest', bodySide: 'center', bodyView: 'front' },
  shR: { bodyPart: 'shoulder', bodySide: 'right', bodyView: 'back' },
  armL: { bodyPart: 'armHand', bodySide: 'left', bodyView: 'front' },
};
/** [기록 시각, 부위, 먹기 전, 먹고 1시간 뒤] */
const pains = (rows: [string, string[], number, number?][]): PainRecord[] =>
  rows.map(([time, locs, painBefore, painAfter]) => ({ recordedDate: at(time), location: locs.map((k) => LOC[k]), painBefore, painAfter }));
const previsit = (sent: string, day: string, stateOfMind: PrevisitRecord['stateOfMind'], memo?: string): PrevisitRecord =>
  ({ submittedAt: at(sent), selectedDate: at(day), stateOfMind, memo });

const hands = { bodyPart: 'armHand', bodySide: 'both' } as const;
const feet = { bodyPart: 'legFoot', bodySide: 'both' } as const;
const face = { bodyPart: 'headFace', bodySide: 'center' } as const;

export const SAMPLE_PATIENTS: Patient[] = [
  {
    id: 'p1', name: '이정숙', sex: '여', age: 67, cancer: '대장암 3기',
    symptoms: [
      call('2026-11-09 09:12', '어젯밤에 배가 아파서 잠을 좀 설쳤어요. 그래도 아침은 조금 먹었어요.', [
        has('nauseaVomiting', '네, 아직 좀 울렁거려요 / 구토 횟수: 아침에 한 번, 어제 저녁에 한 번이요 / 메스꺼움 시작: 항암 맞고 다음 날부터 계속이에요', { occurrenceCount: 2 }),
        has('diarrhea', '네, 그저께부터 묽게 나와요 / 네 번쯤 봤어요', { occurrenceCount: 4 }),
        has('numbness', '찬물 만지면 손끝이 바로 저려요 / 지난주부터 더 오래가요', { ...hands, rawLocationText: '손끝' }),
        has('dehydrationNutrition', '네, 잘 못 먹었어요 / 물은 두 컵 정도밖에 못 마셨어요'),
      ]),
      call('2026-11-08 20:40', '오늘은 좀 나아요. 낮에 산책도 잠깐 했어요.', [
        has('nauseaVomiting', '냄새 맡으면 울렁거려요 / 메스꺼움 시작: 지난주 화요일부터요'),
        has('diarrhea', '네 / 세 번이요', { occurrenceCount: 3 }),
        has('numbness', '손가락 끝이 계속 찌릿찌릿해요 / 이번 주기 시작하고부터요', { ...hands, rawLocationText: '손가락 끝' }),
        unknown('oralPain', '잘 모르겠어요, 볼 안쪽이 좀 따끔한 것 같기도 하고요'),
      ]),
      call('2026-11-06 22:30', '저녁 먹고 나서부터 배가 너무 아프고 기운이 하나도 없어요.', [
        has('nauseaVomiting', '네, 계속 토했어요 / 구토 횟수: 다섯 번은 한 것 같아요', { occurrenceCount: 5 }),
        has('diarrhea', '[검토 필요] 물 같은 변이 계속 나와요 / 오늘만 여섯 번이요', { occurrenceCount: 6 }),
        has('dehydrationNutrition', '[검토 필요] 하루 종일 물 한 컵도 못 마셨어요 / 거의 못 먹었어요'),
        has('numbness', '발바닥도 저려요 / 어제부터요', { ...feet, rawLocationText: '발바닥' }),
        has('other', '어지러움: 일어날 때 핑 돌아요'),
      ]),
      call('2026-11-05 10:05', '항암 맞고 이틀째인데 속이 계속 울렁거려요.', [
        has('nauseaVomiting', '속이 계속 울렁거려요 / 구토 횟수: 아침에 한 번 / 메스꺼움 시작: 맞은 날 밤부터요', { occurrenceCount: 1 }),
        has('numbness', '찬 거 만지면 손이 저려요 / 맞은 날부터요', { ...hands, rawLocationText: '손' }),
        has('dehydrationNutrition', '네 / 죽 반 그릇 정도요'),
      ]),
      call('2026-11-03 18:00', '오늘 항암 맞고 왔어요. 아직은 괜찮아요.', [
        has('numbness', '손끝이 찌릿해요 / 주사 맞고 나서 바로요', { ...hands, rawLocationText: '손끝' }),
      ]),
      call('2026-11-01 11:20', '많이 좋아졌어요. 밥맛도 조금 돌아왔어요.', [
        has('oralPain', '조금 헐었는데 많이 나았어요 / 지난주부터요'),
        unknown('numbness', '모르겠어요, 가끔 그런 것 같아요'),
      ]),
      call('2026-10-30 19:45', '입안이 헐어서 밥 먹기가 힘들어요.', [
        has('oralPain', '혀 옆이 헐었어요 / 월요일부터요'),
        has('constipation', '네, 화장실을 못 가요 / 사흘째요'),
        has('dehydrationNutrition', '입이 아파서 잘 못 먹어요 / 평소 반 정도요'),
      ]),
      call('2026-10-28 09:00', '입이 따갑고 변을 잘 못 봐요.', [
        has('oralPain', '입이 따가워요 / 어제부터요'),
        has('constipation', '변이 잘 안 나와요 / 그저께부터요'),
        has('numbness', '찬 데 닿으면 잠깐 저려요 / 지난 항암 끝나고부터요', { ...hands, rawLocationText: '손가락' }),
        has('rashItching', '손바닥이 빨갛고 가려워요 / 어제부터요', { ...hands, rawLocationText: '손바닥' }),
      ]),
      call('2026-10-25 14:10', '그럭저럭 지내요.', [
        has('numbness', '아침에 손이 좀 저렸다가 금방 풀려요 / 지난주부터요', { ...hands, rawLocationText: '손' }),
      ]),
      call('2026-10-22 21:00', '속이 메스껍고 냄새만 맡아도 토할 것 같아요.', [
        has('nauseaVomiting', '냄새만 맡아도 토할 것 같아요 / 구토 횟수: 세 번이요 / 메스꺼움 시작: 항암 맞은 날부터요', { occurrenceCount: 3 }),
        has('diarrhea', '네 / 두 번이요', { occurrenceCount: 2 }),
        has('numbness', '손끝이 찌릿해요 / 그저께부터요', { ...hands, rawLocationText: '손끝' }),
        has('dehydrationNutrition', '물만 조금 마셨어요 / 반도 못 먹었어요'),
      ]),
      call('2026-10-20 17:30', '오늘 두 번째 항암 했어요.', [
        has('numbness', '네, 손끝이 좀 저려요 / 맞고 나서 바로요', { ...hands, rawLocationText: '손끝' }),
      ]),
      call('2026-10-17 10:00', '컨디션 괜찮아요.', []),
      call('2026-10-14 20:00', '어제부터 머리가 좀 아파요.', [
        has('nauseaVomiting', '아침에 잠깐 울렁거렸어요 / 메스꺼움 시작: 오늘 아침부터요'),
        has('other', '두통: 어제부터 머리가 지끈거려요'),
      ]),
    ],
    pains: pains([
      ['2026-11-09 08:10', ['abd'], 7, 3], ['2026-11-08 21:30', ['abd', 'back'], 8, 4], ['2026-11-08 13:05', ['abd'], 6],
      ['2026-11-07 09:40', ['back'], 2, 5], ['2026-11-06 22:10', ['abd'], 9, 5], ['2026-11-06 10:00', ['abd'], 6, 7],
      ['2026-11-05 19:20', ['legL', 'legR'], 4, 2], ['2026-11-04 08:30', ['abd'], 5, 2], ['2026-11-03 15:00', ['head'], 4],
      ['2026-11-01 20:00', ['back'], 6, 3], ['2026-10-31 09:00', ['abd'], 5, 2], ['2026-10-29 21:00', ['abd', 'back'], 7, 6],
      ['2026-10-28 12:00', ['abd'], 6, 3], ['2026-10-26 08:00', ['back'], 4, 1], ['2026-10-24 22:00', ['abd'], 8, 4],
      ['2026-10-23 18:00', ['abd'], 7, 5], ['2026-10-22 09:30', ['head'], 5, 2], ['2026-10-21 14:00', ['abd'], 6, 3],
      ['2026-10-18 10:00', ['abd'], 4, 1], ['2026-10-16 20:00', ['back'], 5, 4], ['2026-10-14 09:00', ['abd'], 5, 2],
    ]),
    previsits: [
      previsit('2026-11-09 07:50', '2026-11-06', 'slowly', '선생님, 이번 주기 시작하고 나서 밤에 배가 많이 아팠어요. 6일 밤에는 약을 먹고도 잘 못 잤습니다.\n손끝 저린 것도 지난번보다 오래 가는 것 같아요. 다음 항암을 그대로 해도 되는지 여쭤보고 싶어요.\n결과가 안 좋아도 천천히 말씀해 주시면 잘 들을게요.'),
      previsit('2026-10-27 08:15', '2026-10-24', 'comfortable', '입안이 헐어서 밥을 잘 못 먹었어요. 가글을 하면 조금 나아요. 체중이 2킬로 줄어서 걱정이에요.'),
      previsit('2026-10-15 09:30', '2026-10-14', 'candid'),
    ],
  },
  {
    id: 'p2', name: '박영호', sex: '남', age: 72, cancer: '폐암 4기',
    symptoms: [
      call('2026-11-08 19:30', '숨이 차서 계단을 못 올라가겠어요.', [
        has('diarrhea', '네 / 두 번이요', { occurrenceCount: 2 }),
        has('rashItching', '얼굴에 여드름처럼 올라와요 / 지난주부터요', { ...face, rawLocationText: '얼굴' }),
        has('dehydrationNutrition', '네 / 평소 반 정도요'),
        has('other', '숨참: 조금만 걸어도 숨이 차요 / 사흘 전부터요'),
      ]),
      // 응급 안내로 끝난 통화: 응급 전까지 답한 항목만 남는다
      { recordedDate: at('2026-11-07 21:10'), conditionText: '기침이 심해서 잠을 못 자요.', symptoms: [
        has('rashItching', '얼굴이 계속 가려워요 / 지난주부터요', { ...face, rawLocationText: '얼굴' }),
        ...none('nauseaVomiting', 'constipation'),
        unknown('other', '[검토 필요] 응급 안내로 종료: 가슴이 조이고 숨을 못 쉬겠어요'),
      ] },
      call('2026-11-05 10:00', '그럭저럭이에요. 밥은 반 공기 먹었어요.', [
        has('rashItching', '얼굴이랑 가슴에 올라왔어요 / 지난주부터요', { ...face, rawLocationText: '얼굴이랑 가슴' }),
        has('other', '기침: 아침에 기침이 많이 나요'),
      ]),
      call('2026-11-03 18:20', '얼굴에 뭐가 자꾸 나요.', [
        has('rashItching', '이마에 뭐가 났어요 / 어제부터요', { ...face, rawLocationText: '이마' }),
        has('diarrhea', '네 / 세 번이요', { occurrenceCount: 3 }),
      ]),
      call('2026-10-31 09:40', '괜찮아요.', []),
      call('2026-10-27 20:00', '약 먹기 시작했어요.', [has('diarrhea', '조금요 / 한 번이요', { occurrenceCount: 1 })]),
    ],
    pains: pains([
      ['2026-11-08 08:00', ['chest'], 6, 4], ['2026-11-07 22:00', ['chest', 'back'], 8, 7], ['2026-11-07 09:00', ['chest'], 6],
      ['2026-11-05 20:00', ['back'], 5, 3], ['2026-11-03 21:00', ['shR'], 4, 2], ['2026-10-31 10:00', ['chest'], 5, 3],
      ['2026-10-28 19:00', ['back'], 4, 2], ['2026-10-27 09:00', ['chest'], 3, 1],
    ]),
    previsits: [
      previsit('2026-11-08 07:30', '2026-11-07', 'carefully', '어젯밤에 숨이 막혀서 많이 놀랐습니다. 응급실에 갈 정도는 아니었는데 아직도 무서워요.\n약 때문에 얼굴에 나는 것도 신경이 쓰입니다.\n나쁜 소식이면 아내와 같이 들을 수 있게 해 주세요.'),
    ],
  },
  {
    id: 'p3', name: '최미경', sex: '여', age: 54, cancer: '유방암 2기',
    symptoms: [
      call('2026-11-07 13:00', '손발이 좀 저리고 피곤해요.', [
        has('numbness', '발끝이 저려요 / 이번 주부터요', { ...feet, rawLocationText: '발끝' }),
        has('oralPain', '입안이 따끔해요 / 어제부터요'),
      ]),
      call('2026-11-04 12:30', '오늘은 괜찮아요.', [unknown('numbness', '잘 모르겠어요')]),
      call('2026-11-01 16:00', '머리카락이 많이 빠져서 속상해요.', [
        has('nauseaVomiting', '속이 좀 메스꺼워요 / 메스꺼움 시작: 항암 다음 날부터요'),
        has('other', '탈모: 머리 감을 때 한 움큼씩 빠져요'),
      ]),
      call('2026-10-29 11:00', '속이 좀 울렁거려요.', [
        has('nauseaVomiting', '네 / 구토 횟수: 한 번이요 / 메스꺼움 시작: 어제부터요', { occurrenceCount: 1 }),
      ]),
    ],
    pains: pains([['2026-11-06 21:00', ['armL'], 5, 2], ['2026-11-02 10:00', ['chest'], 3, 1], ['2026-10-30 20:00', ['armL'], 4, 2], ['2026-10-29 09:00', ['armL'], 4]]),
    previsits: [
      previsit('2026-11-07 18:00', '2026-11-07', 'candid', '수술한 쪽 팔이 저녁마다 묵직하게 아파요. 운동을 계속해도 되는지 궁금합니다.\n다음 검사 결과는 있는 그대로 말씀해 주세요.'),
    ],
  },
  {
    id: 'p4', name: '한동수', sex: '남', age: 61, cancer: '위암 3기',
    symptoms: [
      call('2026-11-06 18:00', '밥을 조금만 먹어도 배가 불러요.', [
        has('nauseaVomiting', '밥 먹고 나면 울렁거려요 / 메스꺼움 시작: 수술하고부터요'),
        has('dehydrationNutrition', '네, 조금만 먹어도 배가 불러요 / 평소 반의 반 정도요'),
      ]),
      call('2026-11-02 19:00', '괜찮아요.', []),
      call('2026-10-30 09:00', '변을 며칠째 못 봤어요.', [has('constipation', '네 / 나흘째예요')]),
    ],
    pains: [],
    previsits: [],
  },
  { id: 'p5', name: '정은비', sex: '여', age: 45, cancer: '난소암 3기', symptoms: [], pains: [], previsits: [] },
];
