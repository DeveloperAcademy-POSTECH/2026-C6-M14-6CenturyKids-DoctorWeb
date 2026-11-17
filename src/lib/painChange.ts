/** "9번 중 5번 낮아졌고 2번 높아졌어요. 2번은 1시간 뒤 점수가 없어요." 0인 항목은 말하지 않는다 */
export function changeSentence(total: number, lower: number, same: number, higher: number, missing: number) {
  const parts = [lower && `${lower}번 낮아졌`, same && `${same}번 그대로였`, higher && `${higher}번 높아졌`].filter(Boolean) as string[];
  const only = [lower, same, higher].filter(Boolean).length === 1 && !missing;
  const first = !parts.length ? '' : only
    ? `${total}번 모두 ${parts[0].replace(/^\d+번 /, '')}어요.`
    : `${total}번 중 ${parts.map((p, i) => (i < parts.length - 1 ? `${p}고` : `${p}어요.`)).join(' ')}`;
  const second = missing ? `${missing}번은 1시간 뒤 점수가 없어요.` : '';
  return [first, second].filter(Boolean).join(' ');
}

/**
 * '라벨 ── 값' 줄용 요약: 값은 가장 앞선 변화 하나("9번 중 5번 낮아짐"), 나머지는 아래 설명 한 줄.
 * 낮아짐 → 그대로 → 높아짐 순으로 처음 0이 아닌 것을 값으로 쓴다.
 */
export function changeSummary(total: number, lower: number, same: number, higher: number, missing: number) {
  const items: [number, string][] = [[lower, '낮아짐'], [same, '그대로'], [higher, '높아짐']];
  const head = items.find(([n]) => n > 0);
  const value = head ? (head[0] === total ? `${total}번 모두 ${head[1]}` : `${total}번 중 ${head[0]}번 ${head[1]}`) : `${total}번 모두 1시간 뒤 기록 없음`;
  const rest = [
    ...items.filter((it) => it !== head && it[0] > 0).map(([n, w]) => `${n}번 ${w}`),
    ...(head && missing ? [`${missing}번은 1시간 뒤 기록 없음`] : []),
  ].join(', ');
  return { value, rest };
}
