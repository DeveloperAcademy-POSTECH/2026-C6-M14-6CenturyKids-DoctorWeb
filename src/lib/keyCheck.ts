/**
 * 웹 코드는 누구나 볼 수 있으므로 공개용 키만 허용한다.
 * 모양을 알 수 없는 키는 secret일 수 있어 통과시키지 않는다 (공개용 모양만 허용).
 * - 새 형식: sb_publishable_…
 * - 예전 형식: role이 anon인 JWT
 */
export function isPublicKey(raw: string) {
  const k = raw.trim();
  if (k.startsWith('sb_publishable_')) return true;
  try {
    const part = k.split('.')[1];
    if (!part) return false;
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role === 'anon';
  } catch {
    return false;
  }
}
