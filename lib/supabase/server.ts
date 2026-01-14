/**
 * Supabase 서버 컴포넌트용 클라이언트
 * 서버에서 실행되는 Server Components, Server Actions, Route Handlers에서 사용합니다.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 서버 컴포넌트용 Supabase 클라이언트 생성
 * @returns Supabase 클라이언트 인스턴스
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // 서버 컴포넌트에서 쿠키 설정 시 발생할 수 있는 에러 무시
            // Server Actions나 Route Handlers에서는 정상적으로 동작
          }
        },
      },
    }
  );
};

