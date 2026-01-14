# Supabase 데이터베이스 스키마

AI Todo 관리 서비스의 Supabase 데이터베이스 스키마입니다.

---

## 📦 테이블 구조

### 1. `public.users` - 사용자 프로필

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | UUID | 사용자 고유 ID | PRIMARY KEY, FK → auth.users(id) |
| `email` | TEXT | 이메일 주소 | NOT NULL, UNIQUE |
| `name` | TEXT | 사용자 이름 | - |
| `avatar_url` | TEXT | 프로필 이미지 URL | - |
| `created_at` | TIMESTAMPTZ | 생성 일시 | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | 수정 일시 | NOT NULL, DEFAULT NOW() |

**특징:**
- `auth.users`와 1:1 관계
- 신규 회원가입 시 자동으로 프로필 생성 (트리거)
- RLS로 본인만 조회/수정 가능

---

### 2. `public.todos` - 할 일 관리

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | UUID | 할 일 고유 ID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `user_id` | UUID | 소유자 사용자 ID | NOT NULL, FK → public.users(id) |
| `title` | TEXT | 할 일 제목 | NOT NULL, 1-200자 |
| `description` | TEXT | 상세 설명 | - |
| `priority` | TEXT | 우선순위 | NOT NULL, DEFAULT 'medium', ENUM(low, medium, high) |
| `category` | TEXT[] | 카테고리 배열 | DEFAULT '{}' |
| `completed` | BOOLEAN | 완료 여부 | NOT NULL, DEFAULT false |
| `created_date` | TIMESTAMPTZ | 생성 일시 | NOT NULL, DEFAULT NOW() |
| `due_date` | TIMESTAMPTZ | 마감 일시 | - |
| `updated_at` | TIMESTAMPTZ | 수정 일시 | NOT NULL, DEFAULT NOW() |

**특징:**
- 사용자별 할 일 관리
- 우선순위 3단계 (low, medium, high)
- 카테고리 배열 지원 (복수 카테고리 가능)
- RLS로 본인 할 일만 CRUD 가능

---

## 🔒 Row Level Security (RLS) 정책

### `public.users`
```sql
✅ SELECT: 본인 프로필만 조회 가능
✅ UPDATE: 본인 프로필만 수정 가능
```

### `public.todos`
```sql
✅ SELECT: 본인 할 일만 조회 가능
✅ INSERT: 본인 할 일만 생성 가능
✅ UPDATE: 본인 할 일만 수정 가능
✅ DELETE: 본인 할 일만 삭제 가능
```

---

## 📊 인덱스

### 성능 최적화를 위한 인덱스

```sql
-- 사용자 테이블
idx_users_email              - 이메일 조회

-- 할 일 테이블
idx_todos_user_id            - 사용자별 조회
idx_todos_completed          - 완료 상태별 조회
idx_todos_priority           - 우선순위별 조회
idx_todos_due_date           - 마감일 정렬
idx_todos_created_date       - 생성일 정렬 (DESC)
idx_todos_user_completed     - 사용자+완료 상태 복합 조회
idx_todos_category           - 카테고리 검색 (GIN)
idx_todos_search             - 전문 검색 (GIN)
```

---

## 🔄 자동화 트리거

### 1. `updated_at` 자동 업데이트
- `users`, `todos` 테이블 수정 시 `updated_at` 자동 갱신

### 2. 신규 사용자 프로필 자동 생성
- `auth.users`에 신규 사용자 생성 시 `public.users`에 프로필 자동 생성
- 이메일과 메타데이터에서 이름 추출

---

## 🚀 스키마 적용 방법

### 방법 1: Supabase 대시보드 (권장)

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New Query** 클릭
5. `schema.sql` 파일 내용 복사 & 붙여넣기
6. **Run** 버튼 클릭

### 방법 2: Supabase CLI

```bash
# Supabase CLI 설치 (없는 경우)
npm install -g supabase

# 프로젝트 초기화
supabase init

# 로컬 Supabase 시작
supabase start

# 스키마 적용
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/schema.sql

# 원격 프로젝트에 적용
supabase db push
```

---

## 📝 사용 예시

### 할 일 생성

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const { data, error } = await supabase
  .from('todos')
  .insert({
    user_id: user.id,
    title: '프로젝트 기획서 작성',
    description: 'AI Todo 서비스 기획',
    priority: 'high',
    category: ['업무', '기획'],
    due_date: '2026-01-10T09:00:00Z',
  })
  .select()
  .single();
```

### 할 일 조회 (필터 + 정렬)

```typescript
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', user.id)
  .eq('completed', false)
  .in('priority', ['high', 'medium'])
  .order('due_date', { ascending: true });
```

### 할 일 수정

```typescript
const { data, error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', todoId)
  .select();
```

### 할 일 삭제

```typescript
const { error } = await supabase
  .from('todos')
  .delete()
  .eq('id', todoId);
```

### 카테고리 검색

```typescript
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .contains('category', ['업무']); // 업무 카테고리 포함
```

### 전문 검색 (제목 + 설명)

```typescript
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .textSearch('title', 'Next.js', {
    type: 'websearch',
    config: 'simple'
  });
```

---

## 🔧 유용한 SQL 쿼리

### 사용자별 통계 조회

```sql
SELECT * FROM public.user_todo_stats
WHERE user_id = 'your-user-id';
```

### 오늘 마감인 할 일

```sql
SELECT *
FROM public.todos
WHERE DATE(due_date) = CURRENT_DATE
  AND completed = false
  AND user_id = auth.uid();
```

### 우선순위 높은 미완료 할 일

```sql
SELECT *
FROM public.todos
WHERE priority = 'high'
  AND completed = false
  AND user_id = auth.uid()
ORDER BY due_date ASC NULLS LAST;
```

---

## 🧪 테스트 데이터 생성

스키마에 포함된 샘플 데이터 생성 함수를 사용할 수 있습니다:

```sql
-- 현재 사용자에게 5개의 샘플 할 일 생성
SELECT public.create_sample_todos(auth.uid(), 5);
```

---

## 📋 마이그레이션 체크리스트

- [x] `public.users` 테이블 생성
- [x] `public.todos` 테이블 생성
- [x] 인덱스 생성
- [x] RLS 활성화
- [x] RLS 정책 설정
- [x] 트리거 함수 생성
- [x] 신규 사용자 자동 프로필 생성 트리거
- [x] `updated_at` 자동 갱신 트리거
- [x] 통계 뷰 생성

---

## ⚠️ 주의사항

### 1. RLS 정책 확인
스키마 적용 후 RLS가 제대로 작동하는지 테스트하세요:

```typescript
// 다른 사용자의 할 일은 조회되지 않아야 함
const { data } = await supabase
  .from('todos')
  .select('*');
// ✅ 본인의 할 일만 반환됨
```

### 2. 외래 키 제약조건
- `todos.user_id`는 `users.id`를 참조
- 사용자 삭제 시 관련 할 일도 자동 삭제 (CASCADE)

### 3. 카테고리 배열 처리
TypeScript에서 배열로 처리:

```typescript
// ✅ 올바른 사용
category: ['업무', '기획']

// ❌ 잘못된 사용
category: '업무' // 문자열 단일 값
```

---

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 데이터 타입](https://www.postgresql.org/docs/current/datatype.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**스키마 버전**: 1.0.0  
**마지막 업데이트**: 2026-01-04

