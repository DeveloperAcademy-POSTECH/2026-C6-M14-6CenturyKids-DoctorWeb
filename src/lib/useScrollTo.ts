import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './useMedia.ts';

/**
 * 다음 화면 그리기가 끝난 뒤 container 안의 selector로 스크롤한다.
 * (상태를 바꾸면서 바로 찾으면 아직 새 카드가 없어서)
 */
export function useScrollTo<T extends HTMLElement>() {
  const container = useRef<T>(null);
  const pending = useRef<{ selector: string; block: ScrollLogicalPosition } | null>(null);
  useEffect(() => {
    if (!pending.current) return;
    const { selector, block } = pending.current;
    pending.current = null;
    container.current?.querySelector(selector)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
  });
  const scrollTo = (selector: string, block: ScrollLogicalPosition = 'start') => {
    pending.current = { selector, block };
  };
  const toTop = () => {
    if (container.current) container.current.scrollTop = 0;
  };
  return { container, scrollTo, toTop };
}
