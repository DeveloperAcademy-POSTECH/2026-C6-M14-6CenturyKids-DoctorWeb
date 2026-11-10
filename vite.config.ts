import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { isPublicKey } from './src/lib/keyCheck.ts';

export default defineConfig(({ mode }) => {
  // VITE_ 값은 빌드 결과에 그대로 들어가므로, 공개용 키가 아니면 개발 서버·빌드를 시작하지 않는다
  const key = loadEnv(mode, process.cwd(), 'VITE_').VITE_SUPABASE_ANON_KEY;
  if (key && !isPublicKey(key)) {
    throw new Error('VITE_SUPABASE_ANON_KEY가 공개용(publishable/anon) 키가 아니에요. secret·service_role 키는 웹에 넣을 수 없어요.');
  }
  return { plugins: [react()] };
});
