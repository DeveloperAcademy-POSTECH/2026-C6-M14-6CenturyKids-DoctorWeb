const PUBLISHABLE = /^sb_publishable_[A-Za-z0-9_-]{20,}$/;
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * 웹 코드는 누구나 볼 수 있으므로 공개용 키만 허용한다.
 * 문자열 전체가 공개용 키 모양일 때만 통과 (앞부분만 맞추고 뒤에 다른 키를 붙인 값은 막는다).
 * - 새 형식: sb_publishable_…
 * - 예전 형식: role이 anon인 JWT
 */
export function isPublicKey(raw: string) {
  const k = raw.trim();
  if (k.includes('sb_secret_') || k.includes('service_role')) return false;
  if (PUBLISHABLE.test(k)) return true;
  if (!JWT.test(k)) return false;
  try {
    const payload = JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role === 'anon';
  } catch {
    return false;
  }
}
