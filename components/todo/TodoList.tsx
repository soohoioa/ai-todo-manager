'use client';

import { CheckSquare } from 'lucide-react';
import { TodoCard } from './TodoCard';
import { Empty } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Todo } from '@/types/todo';

/**
 * 할 일 목록 컴포넌트의 Props
 */
interface TodoListProps {
  /** 표시할 할 일 목록 */
  todos: Todo[];
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 오류 메시지 */
  error?: string | null;
  /** 할 일 토글 핸들러 */
  onToggle?: (todoId: string) => Promise<void>;
  /** 할 일 편집 핸들러 */
  onEdit?: (todo: Todo) => void;
  /** 할 일 삭제 핸들러 */
  onDelete?: (todoId: string) => Promise<void>;
  /** 빈 상태일 때 표시할 액션 */
  emptyAction?: React.ReactNode;
}

/**
 * 할 일 목록을 표시하는 컴포넌트
 * 로딩, 빈 상태, 오류 상태를 모두 처리하며
 * TodoCard 컴포넌트를 사용하여 각 할 일을 렌더링합니다.
 */
export const TodoList = ({
  todos,
  isLoading = false,
  error = null,
  onToggle,
  onEdit,
  onDelete,
  emptyAction,
}: TodoListProps) => {
  // 오류 상태
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          <AlertDescription>
            {error || '할 일을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-sm text-muted-foreground">할 일을 불러오는 중...</p>
      </div>
    );
  }

  // 빈 상태
  if (todos.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-8">
        <Empty
          icon={<CheckSquare className="h-16 w-16 text-muted-foreground" />}
          title="등록된 할 일이 없습니다"
          description="새로운 할 일을 추가하거나 AI로 생성해보세요"
        >
          {emptyAction}
        </Empty>
      </div>
    );
  }

  // 완료된 할 일과 미완료 할 일 분리
  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-4">
      {/* 미완료 할 일 섹션 */}
      {activeTodos.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-foreground">
            진행 중 ({activeTodos.length})
          </h2>
          <div className="space-y-3">
            {activeTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* 완료된 할 일 섹션 */}
      {completedTodos.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
            완료됨 ({completedTodos.length})
          </h2>
          <div className="space-y-3">
            {completedTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* 전체 통계 */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        총 {todos.length}개 · 완료 {completedTodos.length}개 · 진행 중{' '}
        {activeTodos.length}개
      </div>
    </div>
  );
};

