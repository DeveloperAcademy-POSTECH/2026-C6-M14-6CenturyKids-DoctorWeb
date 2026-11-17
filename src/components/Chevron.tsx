/**
 * 화면의 모든 꺾쇠 (뒤로 ‹, 넘기기 ‹ ›, 자세히 ›). 글자 꺾쇠는 글꼴마다 굵기와 높이가 달라 한 모양으로 그린다.
 * 크기는 놓인 자리의 CSS가, 색은 글자색(currentColor)이 정한다.
 */
export default function Chevron({ dir = 'right' }: { dir?: 'left' | 'right' }) {
  return (
    <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
