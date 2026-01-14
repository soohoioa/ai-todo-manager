/**
 * 인증 관련 타입 정의
 */

/**
 * 사용자 정보
 */
export interface User {
  /** 사용자 고유 ID */
  id: string;
  /** 이메일 주소 */
  email: string;
  /** 사용자 이름 */
  name?: string;
  /** 프로필 이미지 URL */
  avatar_url?: string;
  /** 계정 생성일 */
  created_at: string;
  /** 마지막 로그인 시간 */
  last_sign_in_at?: string;
}

/**
 * 로그인 요청 데이터
 */
export interface LoginInput {
  /** 이메일 주소 */
  email: string;
  /** 비밀번호 */
  password: string;
}

/**
 * 회원가입 요청 데이터
 */
export interface SignupInput {
  /** 이메일 주소 */
  email: string;
  /** 비밀번호 */
  password: string;
  /** 사용자 이름 */
  name?: string;
}

/**
 * 인증 세션 정보
 */
export interface AuthSession {
  /** 액세스 토큰 */
  access_token: string;
  /** 리프레시 토큰 */
  refresh_token: string;
  /** 토큰 만료 시간 (초) */
  expires_in: number;
  /** 토큰 타입 */
  token_type: string;
  /** 사용자 정보 */
  user: User;
}

/**
 * 인증 상태
 */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

/**
 * 인증 에러 타입
 */
export interface AuthError {
  /** 에러 메시지 */
  message: string;
  /** 에러 코드 */
  code?: string;
  /** HTTP 상태 코드 */
  status?: number;
}

