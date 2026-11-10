/** 웹 코드는 누구나 볼 수 있으므로 공개용 키만 허용. 모든 권한을 무시하는 secret·service_role 키면 연결하지 않는다 */
export function isSecretKey(k: string) {
  if (k.startsWith('sb_secret_')) return true;
  try {
    const payload = JSON.parse(atob(k.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? ''));
    return payload?.role === 'service_role';
  } catch {
    return false; // JWT가 아니면 예전 키 형식이 아님
  }
}
