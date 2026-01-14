# AI Todo 관리 서비스 PRD

## 1. 프로젝트 개요

본 프로젝트는 AI 기반 할 일(Todo) 관리 서비스로, 사용자가 자연어로 할 일을 입력하고 AI의 도움을 받아 효율적으로 작업을 관리할 수 있도록 한다.
Supabase를 활용한 인증 및 데이터 관리, AI 요약·분석 기능을 통해 생산성을 향상시키는 것을 목표로 한다.

---

## 2. 주요 기능

### 2.1 이메일/비밀번호 로그인 및 회원가입

- Supabase Auth 기반 Email/Password 인증
- 로그인 성공 시 JWT 세션 발급
- 인증된 사용자만 서비스 접근 가능
- Row Level Security(RLS)로 사용자 데이터 분리

### 2.2 할 일 관리 (CRUD)

- 할 일 생성(Create), 조회(Read), 수정(Update), 삭제(Delete)

**Todo 필드**

- id (uuid)
- user_id (uuid)
- title (string, 필수)
- description (text)
- created_date (timestamp)
- due_date (timestamp)
- priority (low / medium / high)
- category (string[])
- completed (boolean)

### 2.3 검색, 필터, 정렬

- 검색: title, description
- 필터: priority, category, status
- 정렬: priority, due_date, created_date

### 2.4 AI 할 일 생성 기능

- 자연어 입력을 구조화된 Todo JSON으로 변환
- Google Gemini API 활용
- 생성 전 사용자 수정 가능

### 2.5 AI 요약 및 분석

- 일일 요약: 오늘 완료/미완료 작업
- 주간 요약: 완료율, 카테고리별 통계

---

## 3. 화면 구성

1. 로그인/회원가입 화면
2. 할 일 관리 메인 화면
3. 통계 및 분석 화면 (확장)

---

## 4. 기술 스택

- Next.js
- Tailwind CSS
- Shadcn/ui
- Supabase
- Google Gemini API

---

## 5. 데이터 구조 (Supabase)

### users

- Supabase Auth 연동 사용자 테이블

### todos

- 사용자별 할 일 관리 테이블
- users 테이블과 FK 관계

---

## 6. 향후 확장

- 알림(Reminder) 기능
- 캘린더 연동
- 팀/공유 Todo 기능
