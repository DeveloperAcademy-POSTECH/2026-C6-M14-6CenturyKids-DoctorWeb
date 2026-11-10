import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDetail } from './symptomDetail.ts';

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
