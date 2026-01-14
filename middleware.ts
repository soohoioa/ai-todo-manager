/**
 * Next.js 미들웨어
 * Supabase 인증 세션을 관리하고 보호된 라우트를 처리합니다.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * 미들웨어 함수
 * 모든 요청에서 Supabase 세션을 갱신합니다.
 */
export async function middleware(request: NextRequest) {
  // 정적 파일과 이미지 요청은 건너뛰기
  const path = request.nextUrl.pathname;
  
  if (
    path.startsWith('/_next/static') ||
    path.startsWith('/_next/image') ||
    path === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp)$/.test(path)
  ) {
    return NextResponse.next();
  }

  // Supabase 세션 갱신
  return await updateSession(request);
}

/**
 * 미들웨어가 실행될 경로 설정
 * Next.js 15 호환 방식
 */
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에서 실행:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

