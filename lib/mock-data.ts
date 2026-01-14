/**
 * Mock 데이터
 * 실제 데이터 연동 전 UI 테스트를 위한 샘플 데이터입니다.
 */

import type { Todo } from '@/types/todo';
import type { User } from '@/types/auth';

/**
 * Mock 사용자 데이터
 */
export const mockUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  name: '홍길동',
  created_at: new Date().toISOString(),
};

/**
 * Mock 할 일 데이터
 */
export const mockTodos: Todo[] = [
  {
    id: 'todo-1',
    user_id: 'user-1',
    title: '프로젝트 기획서 작성',
    description: 'AI Todo 서비스 기획서 초안 작성 및 검토',
    created_date: new Date('2026-01-01').toISOString(),
    due_date: new Date('2026-01-10').toISOString(),
    priority: 'high',
    category: ['업무', '기획'],
    completed: false,
  },
  {
    id: 'todo-2',
    user_id: 'user-1',
    title: 'Next.js 15 학습',
    description: 'App Router와 Server Components 개념 정리',
    created_date: new Date('2026-01-02').toISOString(),
    due_date: new Date('2026-01-08').toISOString(),
    priority: 'medium',
    category: ['학습', '개발'],
    completed: false,
  },
  {
    id: 'todo-3',
    user_id: 'user-1',
    title: '운동하기',
    description: '헬스장 가서 1시간 운동',
    created_date: new Date('2026-01-03').toISOString(),
    due_date: new Date('2026-01-05').toISOString(),
    priority: 'low',
    category: ['건강', '개인'],
    completed: true,
  },
  {
    id: 'todo-4',
    user_id: 'user-1',
    title: 'UI 컴포넌트 디자인',
    description: 'TodoCard, TodoList, TodoForm 컴포넌트 디자인 및 구현',
    created_date: new Date('2026-01-03').toISOString(),
    due_date: new Date('2026-01-06').toISOString(),
    priority: 'high',
    category: ['업무', '디자인'],
    completed: true,
  },
  {
    id: 'todo-5',
    user_id: 'user-1',
    title: '팀 회의 준비',
    description: '주간 스프린트 리뷰 자료 준비',
    created_date: new Date('2026-01-04').toISOString(),
    due_date: new Date('2026-01-07').toISOString(),
    priority: 'medium',
    category: ['업무', '회의'],
    completed: false,
  },
  {
    id: 'todo-6',
    user_id: 'user-1',
    title: '장보기',
    description: '주말 식재료 구매',
    created_date: new Date('2026-01-04').toISOString(),
    priority: 'low',
    category: ['개인', '생활'],
    completed: false,
  },
  {
    id: 'todo-7',
    user_id: 'user-1',
    title: 'Supabase 설정',
    description: '인증 및 데이터베이스 스키마 설정',
    created_date: new Date('2026-01-04').toISOString(),
    due_date: new Date('2026-01-09').toISOString(),
    priority: 'high',
    category: ['업무', '개발'],
    completed: false,
  },
  {
    id: 'todo-8',
    user_id: 'user-1',
    title: '블로그 포스팅',
    description: 'Next.js 15 App Router 사용 후기 작성',
    created_date: new Date('2026-01-04').toISOString(),
    priority: 'low',
    category: ['개인', '블로그'],
    completed: false,
  },
];

