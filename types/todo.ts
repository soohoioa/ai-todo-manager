/**
 * 할 일 관련 타입 정의
 */

/**
 * 할 일 우선순위 타입
 */
export type TodoPriority = 'low' | 'medium' | 'high';

/**
 * 할 일 상태 타입
 */
export type TodoStatus = 'active' | 'completed';

/**
 * 할 일 데이터 구조
 */
export interface Todo {
  /** 고유 ID */
  id: string;
  /** 사용자 ID */
  user_id: string;
  /** 제목 (필수) */
  title: string;
  /** 상세 설명 */
  description?: string;
  /** 생성 날짜 */
  created_date: string;
  /** 마감 날짜 */
  due_date?: string;
  /** 우선순위 */
  priority: TodoPriority;
  /** 카테고리 목록 */
  category: string[];
  /** 완료 여부 */
  completed: boolean;
}

/**
 * 할 일 생성 요청 데이터
 */
export interface CreateTodoInput {
  title: string;
  description?: string;
  due_date?: string;
  priority?: TodoPriority;
  category?: string[];
}

/**
 * 할 일 수정 요청 데이터
 */
export interface UpdateTodoInput {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: TodoPriority;
  category?: string[];
  completed?: boolean;
}

/**
 * 할 일 필터 옵션
 */
export interface TodoFilterOptions {
  /** 우선순위 필터 */
  priority?: TodoPriority[];
  /** 카테고리 필터 */
  category?: string[];
  /** 상태 필터 */
  status?: TodoStatus;
  /** 검색 키워드 */
  search?: string;
}

/**
 * 할 일 정렬 옵션
 */
export type TodoSortBy = 'priority' | 'due_date' | 'created_date';

/**
 * 정렬 방향
 */
export type SortDirection = 'asc' | 'desc';

