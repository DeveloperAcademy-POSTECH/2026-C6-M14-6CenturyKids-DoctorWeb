import { useEffect } from 'react';

const INTERVAL_MS = 60_000;
/** 앱으로 돌아올 때 여러 이벤트가 한꺼번에 와도 한 번만 읽는다 */
const MIN_GAP_MS = 5_000;

/** 화면을 보는 동안 1분마다, 앱으로 돌아오거나 인터넷이 다시 연결되면 바로 refresh를 부른다 */
export function useAutoRefresh(refresh: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    const run = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < MIN_GAP_MS) return;
      last = Date.now();
      refresh();
    };
    const timer = setInterval(run, INTERVAL_MS);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('pageshow', run);
    window.addEventListener('online', run);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('pageshow', run);
      window.removeEventListener('online', run);
    };
  }, [refresh, enabled]);
}
