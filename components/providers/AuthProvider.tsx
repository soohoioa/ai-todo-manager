'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * 인증 컨텍스트 타입
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

/**
 * 인증 컨텍스트
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

/**
 * 인증 컨텍스트 훅
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * 인증 상태를 관리하는 Provider 컴포넌트
 * 전역적으로 사용자 인증 상태를 관리하고 자동 리다이렉트를 처리합니다.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 인증이 필요한 라우트인지 확인
   */
  const isProtectedRoute = (path: string): boolean => {
    const publicRoutes = ['/login', '/signup', '/auth'];
    return !publicRoutes.some(route => path.startsWith(route));
  };

  /**
   * 인증 페이지인지 확인 (로그인, 회원가입)
   */
  const isAuthRoute = (path: string): boolean => {
    return path === '/login' || path === '/signup';
  };

  /**
   * 로그아웃 함수
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('[SignOut Error]', error);
      throw error;
    }
  };

  /**
   * 초기 사용자 정보 로드 및 인증 상태 구독
   */
  useEffect(() => {
    // 초기 사용자 정보 가져오기
    const initializeAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // 라우트 보호 로직
        if (user && isAuthRoute(pathname)) {
          // 로그인된 사용자가 로그인/회원가입 페이지 접근 시 메인 페이지로
          router.replace('/');
        } else if (!user && isProtectedRoute(pathname)) {
          // 로그인하지 않은 사용자가 보호된 페이지 접근 시 로그인 페이지로
          router.replace('/login');
        }
      } catch (error) {
        console.error('[Auth Initialize Error]', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // 로그인/로그아웃 이벤트에 따른 리다이렉트
        if (event === 'SIGNED_IN') {
          // 로그인 성공 시
          if (isAuthRoute(pathname)) {
            router.replace('/');
          }
        } else if (event === 'SIGNED_OUT') {
          // 로그아웃 시
          router.replace('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, pathname]);

  const value = {
    user,
    isLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

