import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SAMPLE_PATIENTS, TODAY } from './data/samplePatients.ts';
import { loadDoctorData, NotDoctorError, type DoctorData } from './data/server.ts';
import { supabase } from './lib/supabase.ts';
import LoginPage from './components/LoginPage.tsx';
import Workspace from './components/Workspace.tsx';

type State =
  | { kind: 'checking' }
  | { kind: 'signedOut'; message?: string }
  | { kind: 'loading' }
  | { kind: 'error'; session: Session }
  | { kind: 'ready'; data: DoctorData }
  | { kind: 'sample' };

export default function App() {
  const [state, setState] = useState<State>({ kind: supabase ? 'checking' : 'signedOut' });

  /** 로그인된 사람이 의사인지 확인하고 담당 환자 기록을 읽는다 */
  const open = useCallback(async (session: Session) => {
    if (!supabase) return;
    setState({ kind: 'loading' });
    try {
      setState({ kind: 'ready', data: await loadDoctorData(supabase, session.user.id, new Date()) });
    } catch (e) {
      if (e instanceof NotDoctorError) {
        await supabase.auth.signOut();
        setState({ kind: 'signedOut', message: '의사 계정으로만 들어올 수 있어요' });
      } else {
        console.error(e);
        setState({ kind: 'error', session });
      }
    }
  }, []);

  // 자동 로그인: 저장된 로그인이 있으면 로그인 화면을 건너뛴다
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) open(data.session);
      else setState({ kind: 'signedOut' });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // 다른 탭에서 로그아웃했거나 로그인 갱신이 끝났을 때
      if (event === 'SIGNED_OUT') setState((s) => (s.kind === 'sample' || s.kind === 'signedOut' ? s : { kind: 'signedOut' }));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [open]);

  const signOut = async () => {
    if (state.kind === 'sample') return setState({ kind: 'signedOut' });
    await supabase?.auth.signOut();
    setState({ kind: 'signedOut' });
  };

  switch (state.kind) {
    case 'checking':
      return null; // 저장된 로그인을 확인하는 잠깐 동안 로그인 화면이 깜빡이지 않게
    case 'loading':
      return <div className="center-note"><p>기록을 불러오고 있어요</p></div>;
    case 'error':
      return (
        <div className="center-note">
          <p>기록을 불러오지 못했어요.<br />인터넷 연결을 확인하고 다시 시도해 주세요.</p>
          <div className="row-btns">
            <button type="button" className="icon-btn" onClick={() => open(state.session)}>다시 시도</button>
            <button type="button" className="icon-btn" onClick={signOut}>로그아웃</button>
          </div>
        </div>
      );
    case 'signedOut':
      return <LoginPage message={state.message} onSignedIn={open} onSample={() => setState({ kind: 'sample' })} />;
    case 'ready':
      return <Workspace patients={state.data.patients} doctorName={state.data.doctorName} today={new Date()}
        sample={false} failed={state.data.failed} onSignOut={signOut} />;
    case 'sample':
      return <Workspace patients={SAMPLE_PATIENTS} doctorName="김도윤" today={TODAY} sample failed={[]} onSignOut={signOut} />;
  }
}
