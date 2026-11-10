import { createClient } from '@supabase/supabase-js';
import { isPublicKey } from './keyCheck.ts';

// 키는 코드에 쓰지 않고 .env.local(git 제외)에서만 읽는다. 형식은 .env.example 참고.
// 공개용 키가 아니면 빌드가 먼저 멈춘다 (vite.config.ts). 여기서는 한 번 더 확인만 한다.
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const usable = !!url && !!key && isPublicKey(key);
if (key && !usable) console.error('.env.local의 키가 공개용(publishable/anon) 키가 아니라서 서버에 연결하지 않았어요.');

/** 설정이 없거나 공개용 키가 아니면 null (로그인 화면이 안내함). 로그인 유지·자동 갱신은 기본으로 켜져 있다 */
export const supabase = usable && url && key ? createClient(url, key) : null;
