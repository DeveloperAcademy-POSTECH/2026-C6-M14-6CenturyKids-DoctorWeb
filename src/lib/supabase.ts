import { createClient } from '@supabase/supabase-js';
import { isSecretKey } from './keyCheck.ts';

// 키는 코드에 쓰지 않고 .env.local(git 제외)에서만 읽는다. 형식은 .env.example 참고.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

const secret = !!key && isSecretKey(key);
if (secret) console.error('.env.local에 secret·service_role 키가 들어 있어 서버에 연결하지 않았어요. 공개용(publishable/anon) 키로 바꿔 주세요.');

/** 설정이 없거나 secret 키면 null (로그인 화면이 안내함). 로그인 유지·자동 갱신은 기본으로 켜져 있다 */
export const supabase = url && key && !secret ? createClient(url, key) : null;
