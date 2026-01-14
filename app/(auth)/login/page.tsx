'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare, Mail, Lock, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';

/**
 * 로그인 폼 컴포넌트
 * Supabase Auth를 사용한 이메일/비밀번호 로그인 기능을 제공합니다.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * 이미 로그인된 사용자는 메인 페이지로 리다이렉트
   * (AuthProvider에서도 처리하지만 추가 안전장치)
   */
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  /**
   * URL 파라미터에서 메시지 표시
   */
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error) {
      setError(decodeURIComponent(error));
    }
    if (message) {
      setSuccessMessage(decodeURIComponent(message));
    }
  }, [searchParams]);

  // 인증 확인 중이거나 이미 로그인된 경우 로딩 표시
  if (isAuthLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  /**
   * 이메일 형식 유효성 검사
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Supabase 에러를 사용자 친화적 메시지로 변환
   */
  const getErrorMessage = (error: any): string => {
    const errorMessage = error?.message || '';

    if (errorMessage.includes('Invalid login credentials')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다';
    }
    if (errorMessage.includes('Email not confirmed')) {
      return '이메일 인증이 필요합니다. 이메일을 확인해주세요';
    }
    if (errorMessage.includes('Invalid email')) {
      return '올바른 이메일 형식을 입력해주세요';
    }
    if (errorMessage.includes('Too many requests')) {
      return '너무 많은 시도를 했습니다. 잠시 후 다시 시도해주세요';
    }
    if (errorMessage.includes('User not found')) {
      return '등록되지 않은 이메일입니다';
    }

    return '로그인에 실패했습니다. 다시 시도해주세요';
  };

  /**
   * 로그인 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // 유효성 검사
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요 (예: user@example.com)');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setIsLoading(true);

    try {
      // Supabase 로그인
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // 개발 환경 로그
      if (process.env.NODE_ENV === 'development') {
        console.log('[Login Success]', data);
      }

      // 로그인 성공 - 메인 페이지로 이동
      router.push('/');
      router.refresh();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      // 개발 환경에서 상세 로그
      if (process.env.NODE_ENV === 'development') {
        console.error('[Login Error]', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 및 서비스 소개 */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative bg-primary text-primary-foreground p-4 rounded-2xl shadow-lg">
                <CheckSquare className="h-12 w-12" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AI Todo
            </h1>
            <p className="text-muted-foreground text-lg">
              AI가 도와주는 스마트한 할 일 관리
            </p>
          </div>

          {/* 주요 기능 소개 */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI 생성</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4 text-accent" />
              <span>스마트 관리</span>
            </div>
          </div>
        </div>

        {/* 로그인 폼 */}
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">로그인</CardTitle>
            <CardDescription>
              이메일과 비밀번호로 로그인하세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 성공 메시지 */}
              {successMessage && (
                <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {/* 오류 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    로그인 중...
                  </span>
                ) : (
                  '로그인'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            
            {/* 회원가입 링크 */}
            <div className="text-center text-sm text-muted-foreground">
              아직 계정이 없으신가요?{' '}
              <Link
                href="/signup"
                className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                회원가입
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* 추가 정보 */}
        <p className="text-center text-xs text-muted-foreground">
          로그인하면{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            이용약관
          </Link>
          {' '}및{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

/**
 * 로그인 페이지 컴포넌트
 * Suspense 경계로 래핑하여 useSearchParams() 사용
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
