'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckSquare, Mail, Lock, User, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';

/**
 * 회원가입 페이지 컴포넌트
 * Supabase Auth를 사용한 이메일/비밀번호 회원가입 기능을 제공합니다.
 */
export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * 이미 로그인된 사용자는 메인 페이지로 리다이렉트
   * (AuthProvider에서도 처리하지만 추가 안전장치)
   */
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

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
   * 비밀번호 유효성 검사
   */
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다';
    }
    if (!/[A-Za-z]/.test(pwd)) {
      return '비밀번호에 영문자를 포함해야 합니다';
    }
    if (!/[0-9]/.test(pwd)) {
      return '비밀번호에 숫자를 포함해야 합니다';
    }
    return null;
  };

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

    if (errorMessage.includes('already registered')) {
      return '이미 사용 중인 이메일입니다';
    }
    if (errorMessage.includes('Invalid email')) {
      return '올바른 이메일 형식을 입력해주세요';
    }
    if (errorMessage.includes('Password should be at least')) {
      return '비밀번호는 최소 8자 이상이어야 합니다';
    }
    if (errorMessage.includes('Unable to validate email')) {
      return '이메일 형식이 올바르지 않습니다';
    }
    if (errorMessage.includes('Email rate limit exceeded')) {
      return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요';
    }

    return '회원가입에 실패했습니다. 다시 시도해주세요';
  };

  /**
   * 회원가입 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 유효성 검사
    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }

    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요 (예: user@example.com)');
      return;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (!agreedToTerms) {
      setError('이용약관 및 개인정보처리방침에 동의해주세요');
      return;
    }

    setIsLoading(true);

    try {
      // Supabase 회원가입
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
          // 이메일 확인 링크 리다이렉트 URL
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // 개발 환경 로그
      if (process.env.NODE_ENV === 'development') {
        console.log('[Signup Success]', data);
      }

      // 회원가입 성공
      // Supabase 설정에 따라 두 가지 케이스 처리
      if (data.user && !data.session) {
        // 케이스 1: 이메일 확인 필요
        setSuccess(true);
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else if (data.session) {
        // 케이스 2: 즉시 로그인 (이메일 확인 비활성화된 경우)
        router.push('/');
        router.refresh();
      } else {
        // 예상치 못한 케이스
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      // 개발 환경에서 상세 로그
      if (process.env.NODE_ENV === 'development') {
        console.error('[Signup Error]', err);
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

        {/* 회원가입 폼 */}
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
            <CardDescription>
              새로운 계정을 만들어 시작하세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 성공 메시지 */}
              {success && (
                <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>회원가입 완료!</AlertTitle>
                  <AlertDescription>
                    이메일로 발송된 확인 링크를 클릭해주세요.
                    <br />
                    <span className="text-xs text-muted-foreground">
                      (잠시 후 로그인 페이지로 이동합니다)
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* 오류 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 이름 입력 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>

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
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  영문, 숫자 포함 8자 이상
                </p>
              </div>

              {/* 비밀번호 확인 입력 */}
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* 약관 동의 */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <Link href="/terms" className="underline hover:text-foreground">
                    이용약관
                  </Link>
                  {' '}및{' '}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    개인정보처리방침
                  </Link>
                  에 동의합니다
                </label>
              </div>

              {/* 회원가입 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || success}
                size="lg"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    가입 중...
                  </span>
                ) : success ? (
                  '회원가입 완료'
                ) : (
                  '회원가입'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            
            {/* 로그인 링크 */}
            <div className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                로그인
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

