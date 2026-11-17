import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entryFacts, parseDetail, peakFacts } from './symptomDetail.ts';

test('오심·구토는 앱 설정의 질문 이름만 떼어 낸다', () => {
  const d = parseDetail({ symptomType: 'nauseaVomiting', presence: 'present',
    detail: '네, 울렁거려요 / 구토 횟수: 두 번이요 / 메스꺼움 시작: 어제부터요' });
  assert.deepEqual(d.lines, [
    { text: '네, 울렁거려요' },
    { label: '구토 횟수', text: '두 번이요' },
    { label: '메스꺼움 시작', text: '어제부터요' },
  ]);
});

test('다른 증상은 콜론이 있어도 이름으로 읽지 않는다', () => {
  const d = parseDetail({ symptomType: 'oralPain', presence: 'present', detail: '시작: 어제부터요' });
  assert.deepEqual(d.lines, [{ text: '시작: 어제부터요' }]);
});

test('검토 필요 표시와 기타 증상 이름을 떼어 낸다', () => {
  const d = parseDetail({ symptomType: 'other', presence: 'unknown',
    detail: '[검토 필요] 응급 안내로 종료: 가슴이 조이고 숨을 못 쉬겠어요' });
  assert.equal(d.needsReview, true);
  assert.equal(d.otherName, '응급 안내로 종료');
  assert.deepEqual(d.lines, [{ text: '가슴이 조이고 숨을 못 쉬겠어요' }]);
});

test('detail이 없으면 줄도 없다', () => {
  assert.deepEqual(parseDetail({ symptomType: 'diarrhea', presence: 'absent' }).lines, []);
});

test('칩 사실: 부위와 환자가 말한 자리, 횟수 앞말, 지속 시간 순', () => {
  assert.deepEqual(entryFacts({ symptomType: 'diarrhea', presence: 'present', bodyPart: 'abdomen', rawLocationText: '아랫배',
    occurrenceCount: 4, durationMinutes: 10 }), ['배 “아랫배”', '하루 4회', '한 번에 10분']);
  assert.deepEqual(entryFacts({ symptomType: 'other', presence: 'unknown', detail: '어지러움: 잘 모르겠어요' }), ['어지러움', '모름']);
  assert.deepEqual(entryFacts({ symptomType: 'constipation', presence: 'present' }), []);
});

test('7일 모음: 부위는 겹침 없이, 횟수·시간은 가장 큰 값, 없음 답은 뺀다', () => {
  assert.deepEqual(peakFacts([
    { symptomType: 'diarrhea', presence: 'present', occurrenceCount: 3, bodyPart: 'abdomen' },
    { symptomType: 'diarrhea', presence: 'present', occurrenceCount: 6, bodyPart: 'abdomen', durationMinutes: 5 },
    { symptomType: 'diarrhea', presence: 'absent', occurrenceCount: 9 },
  ]), ['배', '하루 최대 6회', '한 번에 최대 5분']);
  assert.deepEqual(peakFacts([{ symptomType: 'constipation', presence: 'absent' }]), []);
});
