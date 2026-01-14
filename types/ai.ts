/**
 * AI 할 일 생성 관련 타입 정의
 */

/**
 * AI 생성 할 일 입력 타입
 */
export interface GenerateTodoInput {
  /** 자연어로 입력된 할 일 내용 */
  prompt: string;
}

/**
 * AI 생성 할 일 출력 타입
 */
export interface GeneratedTodo {
  /** 할 일 제목 */
  title: string;
  /** 할 일 설명 (선택사항) */
  description?: string;
  /** 마감일 (YYYY-MM-DD) */
  due_date?: string;
  /** 마감 시간 (HH:mm) */
  due_time?: string;
  /** 우선순위 */
  priority: 'low' | 'medium' | 'high';
  /** 카테고리 목록 */
  category: string[];
}

/**
 * API 응답 타입
 */
export interface GenerateTodoResponse {
  success: boolean;
  data?: GeneratedTodo;
  error?: string;
}

/**
 * API 에러 타입
 */
export interface GenerateTodoError {
  message: string;
  code?: string;
}

/**
 * AI 분석 요청 타입
 */
export interface AnalyzeTodosInput {
  /** 할 일 목록 */
  todos: Array<{
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    priority: 'low' | 'medium' | 'high';
    category: string[];
    completed: boolean;
    created_date: string;
  }>;
  /** 분석 기간 */
  period: 'today' | 'week';
}

/**
 * AI 분석 결과 타입
 */
export interface TodoAnalysis {
  /** 전체 요약 */
  summary: string;
  /** 긴급 작업 목록 */
  urgentTasks: string[];
  /** 인사이트 */
  insights: string[];
  /** 추천 사항 */
  recommendations: string[];
}

/**
 * AI 분석 응답 타입
 */
export interface AnalyzeTodosResponse {
  success: boolean;
  data?: TodoAnalysis;
  error?: string;
}
