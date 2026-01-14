import type { Metadata } from 'next';

/**
 * 인증 페이지 메타데이터
 */
export const metadata: Metadata = {
  title: 'AI Todo - 로그인',
  description: 'AI가 도와주는 스마트한 할 일 관리 서비스',
};

/**
 * 인증 페이지 레이아웃
 * 로그인, 회원가입 등 인증 관련 페이지에 적용되는 레이아웃입니다.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

