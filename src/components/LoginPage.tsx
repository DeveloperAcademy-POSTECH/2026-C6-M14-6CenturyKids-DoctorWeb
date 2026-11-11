import { useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.ts';

interface Props {
  /** 의사 계정이 아니어서 내보낸 경우 등 */
  message?: string;
  onSignedIn: (session: Session) => void;
  onSample: () => void;
}

/** 의사 계정은 따로 만들어 드리므로 회원가입·비밀번호 찾기는 없다 */
export default function LoginPage({ message, onSignedIn, onSample }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(message);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    if (!email.trim() || !password) return setError('이메일과 비밀번호를 모두 넣어 주세요');
    setBusy(true);
    setError(undefined);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (authError || !data.session) {
      // 400대: 이메일·비밀번호가 틀림, 0·500대: 연결 문제
      const wrong = authError?.status !== undefined && authError.status >= 400 && authError.status < 500;
      return setError(wrong ? '이메일이나 비밀번호가 맞지 않아요' : '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요');
    }
    onSignedIn(data.session);
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit} noValidate>
        <h1>SocDoc 환자 기록</h1>
        <p className="sub">의사 선생님 계정으로 로그인해 주세요.</p>
        {supabase ? (
          <>
            <label htmlFor="login-email">이메일
              <input id="login-email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label htmlFor="login-password">비밀번호
              <input id="login-password" type="password" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="primary-btn" disabled={busy}>{busy ? '로그인하는 중' : '로그인'}</button>
            <p className="help">비밀번호를 잊으셨으면 담당자에게 알려 주세요.</p>
          </>
        ) : (
          <p className="form-error">서버 설정(.env.local)이 없어 로그인할 수 없어요.</p>
        )}
        {(import.meta.env.DEV || !supabase) && (
          <button type="button" className="text-btn" onClick={onSample}>예시 데이터로 보기</button>
        )}
      </form>
    </div>
  );
}
