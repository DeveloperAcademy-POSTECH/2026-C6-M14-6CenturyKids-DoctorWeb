import { useCallback, useEffect, useRef, useState } from 'react';
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

  /** 지금 화면에 띄운(또는 읽는 중인) 기록의 주인. 로그인한 사람이 바뀌면 다시 읽는다 */
  const openedFor = useRef<string | null>(null);

  /** 로그인된 사람이 의사인지 확인하고 담당 환자 기록을 읽는다. 같은 사람이면 다시 읽지 않는다 (force: 다시 시도) */
  const open = useCallback(async (session: Session, force = false) => {
    if (!supabase) return;
    if (!force && openedFor.current === session.user.id) return;
    openedFor.current = session.user.id;
    setState({ kind: 'loading' });
    try {
      const data = await loadDoctorData(supabase, session.user.id, new Date());
      // 읽는 사이에 다른 계정으로 바뀌었으면 이 결과는 버린다
      if (openedFor.current === session.user.id) setState({ kind: 'ready', data });
    } catch (e) {
      if (openedFor.current !== session.user.id) return;
      if (e instanceof NotDoctorError) {
        openedFor.current = null;
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
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // 다른 탭에서 로그아웃했을 때
        openedFor.current = null;
        setState((s) => (s.kind === 'sample' || s.kind === 'signedOut' ? s : { kind: 'signedOut' }));
      } else if (session && session.user.id !== openedFor.current && openedFor.current !== null) {
        // 다른 탭에서 다른 계정으로 로그인하면 이전 의사의 기록을 남기지 않고 새 계정으로 다시 읽는다.
        // 콜백 안에서 바로 서버를 부르면 supabase-js가 멈출 수 있어 다음 차례로 미룬다
        setTimeout(() => open(session));
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [open]);

  const signOut = async () => {
    if (state.kind === 'sample') return setState({ kind: 'signedOut' });
    openedFor.current = null;
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
            <button type="button" className="icon-btn" onClick={() => open(state.session, true)}>다시 시도</button>
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
