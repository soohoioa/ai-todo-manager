# Supabase 클라이언트 사용 가이드

Next.js 15 App Router와 @supabase/ssr을 사용한 Supabase 인증 및 데이터베이스 연동 가이드입니다.

---

## 📦 파일 구조

```
lib/supabase/
├── client.ts        # 클라이언트 컴포넌트용
├── server.ts        # 서버 컴포넌트용
├── middleware.ts    # 미들웨어 헬퍼
├── index.ts         # 통합 export
└── README.md        # 사용 가이드
```

---

## 🔧 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## 🚀 사용 방법

### 1. 클라이언트 컴포넌트에서 사용

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export const MyComponent = () => {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, []);

  return <div>{user?.email}</div>;
};
```

### 2. 서버 컴포넌트에서 사용

```tsx
import { createClient } from '@/lib/supabase/server';

export default async function ServerPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  return <div>{user?.email}</div>;
}
```

### 3. Server Actions에서 사용

```tsx
'use server';

import { createClient } from '@/lib/supabase/server';

export const getTodos = async () => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('todos')
    .select('*');
  
  if (error) throw error;
  return data;
};
```

### 4. Route Handlers에서 사용

```tsx
// app/api/todos/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('todos')
    .select('*');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}
```

---

## 🔐 인증 예시

### 로그인

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export const LoginForm = () => {
  const supabase = createClient();
  
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('로그인 실패:', error.message);
      return;
    }
    
    console.log('로그인 성공:', data.user);
  };
  
  return <form>{/* 폼 UI */}</form>;
};
```

### 회원가입

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export const SignupForm = () => {
  const supabase = createClient();
  
  const handleSignup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: '홍길동',
        },
      },
    });
    
    if (error) {
      console.error('회원가입 실패:', error.message);
      return;
    }
    
    console.log('회원가입 성공:', data.user);
  };
  
  return <form>{/* 폼 UI */}</form>;
};
```

### 로그아웃

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export const LogoutButton = () => {
  const supabase = createClient();
  const router = useRouter();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };
  
  return <button onClick={handleLogout}>로그아웃</button>;
};
```

### 현재 사용자 가져오기

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    // 초기 사용자 가져오기
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    
    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  
  return user;
};
```

---

## 📊 데이터베이스 작업 예시

### 조회 (SELECT)

```tsx
const supabase = await createClient();

// 전체 조회
const { data, error } = await supabase
  .from('todos')
  .select('*');

// 조건부 조회
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', userId)
  .order('created_date', { ascending: false });

// 특정 컬럼만 조회
const { data, error } = await supabase
  .from('todos')
  .select('id, title, completed');
```

### 생성 (INSERT)

```tsx
const supabase = await createClient();

const { data, error } = await supabase
  .from('todos')
  .insert({
    title: '새 할 일',
    description: '설명',
    priority: 'high',
    user_id: userId,
  })
  .select();
```

### 수정 (UPDATE)

```tsx
const supabase = await createClient();

const { data, error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', todoId)
  .select();
```

### 삭제 (DELETE)

```tsx
const supabase = await createClient();

const { error } = await supabase
  .from('todos')
  .delete()
  .eq('id', todoId);
```

---

## 🔒 Row Level Security (RLS) 예시

Supabase 대시보드에서 다음 정책을 추가하세요:

```sql
-- todos 테이블 RLS 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 자신의 할 일만 조회
CREATE POLICY "Users can view their own todos"
ON todos FOR SELECT
USING (auth.uid() = user_id);

-- 자신의 할 일만 생성
CREATE POLICY "Users can insert their own todos"
ON todos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 자신의 할 일만 수정
CREATE POLICY "Users can update their own todos"
ON todos FOR UPDATE
USING (auth.uid() = user_id);

-- 자신의 할 일만 삭제
CREATE POLICY "Users can delete their own todos"
ON todos FOR DELETE
USING (auth.uid() = user_id);
```

---

## 🎯 실시간 구독 예시

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export const RealtimeTodos = () => {
  const [todos, setTodos] = useState([]);
  const supabase = createClient();
  
  useEffect(() => {
    // 초기 데이터 로드
    const loadTodos = async () => {
      const { data } = await supabase
        .from('todos')
        .select('*');
      setTodos(data || []);
    };
    
    loadTodos();
    
    // 실시간 구독
    const channel = supabase
      .channel('todos-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        (payload) => {
          console.log('변경 감지:', payload);
          // 데이터 새로고침
          loadTodos();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
  
  return <div>{/* 할 일 목록 렌더링 */}</div>;
};
```

---

## ⚠️ 주의사항

### 1. Server Components에서 createClient는 async
```tsx
// ❌ 잘못된 사용
const supabase = createClient();

// ✅ 올바른 사용
const supabase = await createClient();
```

### 2. 클라이언트에서는 동기적으로 생성
```tsx
// ✅ 클라이언트 컴포넌트
'use client';
const supabase = createClient();
```

### 3. 미들웨어 설정 필수
세션 관리를 위해 `middleware.ts` 파일이 프로젝트 루트에 있어야 합니다.

### 4. 환경 변수는 NEXT_PUBLIC_ 접두사 필수
브라우저에서도 접근해야 하므로 반드시 `NEXT_PUBLIC_` 접두사를 사용하세요.

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js App Router 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr 문서](https://supabase.com/docs/guides/auth/server-side-rendering)

---

마지막 업데이트: 2026-01-04

