/**
 * Supabase 인증 콜백 라우트
 * 이메일 확인 링크를 클릭했을 때 처리합니다.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * GET 요청 핸들러
 * 이메일 확인 토큰을 교환하고 세션을 생성합니다.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();

    // 토큰 교환하여 세션 생성
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // 에러 발생 시 로그인 페이지로 리다이렉트
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=인증에 실패했습니다`
      );
    }

    // 성공 시 메인 페이지로 리다이렉트
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }

  // code가 없으면 로그인 페이지로
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}

