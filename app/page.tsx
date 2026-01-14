'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Toolbar } from '@/components/layout/Toolbar';
import { TodoSummary } from '@/components/layout/TodoSummary';
import { TodoList } from '@/components/todo/TodoList';
import { TodoForm } from '@/components/todo/TodoForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Todo, TodoPriority, TodoSortBy, CreateTodoInput, UpdateTodoInput } from '@/types/todo';

/**
 * 메인 페이지 컴포넌트
 * 할 일 관리의 모든 기능을 제공하는 메인 화면입니다.
 */
export default function HomePage() {
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const supabase = createClient();
  
  // 상태 관리
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilters, setPriorityFilters] = useState<TodoPriority[]>([]);
  const [sortBy, setSortBy] = useState<TodoSortBy>('created_date');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  /**
   * 할 일 목록 조회
   */
  const fetchTodos = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_date', { ascending: false });

      if (fetchError) throw fetchError;

      setTodos(data || []);
    } catch (err) {
      console.error('[Fetch Todos Error]', err);
      setError('할 일 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  /**
   * 할 일 필터링 및 정렬
   */
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = [...todos];

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.description?.toLowerCase().includes(query)
      );
    }

    // 상태 필터
    if (statusFilter === 'active') {
      filtered = filtered.filter((todo) => !todo.completed);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((todo) => todo.completed);
    }

    // 우선순위 필터
    if (priorityFilters.length > 0) {
      filtered = filtered.filter((todo) => priorityFilters.includes(todo.priority));
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'due_date': {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        case 'created_date':
        default:
          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      }
    });

    return filtered;
  }, [todos, searchQuery, statusFilter, priorityFilters, sortBy]);

  /**
   * 할 일 토글 핸들러
   */
  const handleToggle = async (todoId: string) => {
    try {
      const todo = todos.find((t) => t.id === todoId);
      if (!todo) return;

      // 낙관적 업데이트
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todoId ? { ...t, completed: !t.completed } : t
        )
      );

      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', todoId)
        .eq('user_id', user!.id);

      if (error) throw error;
    } catch (err) {
      console.error('[Toggle Todo Error]', err);
      alert('할 일 상태 변경에 실패했습니다.');
      // 실패 시 롤백
      await fetchTodos();
    }
  };

  /**
   * 할 일 편집 핸들러
   */
  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  /**
   * 할 일 삭제 핸들러
   */
  const handleDelete = async (todoId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      // 낙관적 업데이트
      setTodos((prev) => prev.filter((todo) => todo.id !== todoId));

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId)
        .eq('user_id', user!.id);

      if (error) throw error;
    } catch (err) {
      console.error('[Delete Todo Error]', err);
      alert('할 일 삭제에 실패했습니다.');
      // 실패 시 목록 다시 로드
      await fetchTodos();
    }
  };

  /**
   * 할 일 추가/수정 제출 핸들러
   */
  const handleSubmit = async (data: CreateTodoInput | UpdateTodoInput) => {
    try {
      if (editingTodo) {
        // 수정
        const { error } = await supabase
          .from('todos')
          .update({
            title: data.title,
            description: data.description,
            priority: data.priority,
            due_date: data.due_date,
            category: data.category || [],
          })
          .eq('id', editingTodo.id)
          .eq('user_id', user!.id);

        if (error) throw error;

        // 목록 갱신
        await fetchTodos();
      } else {
        // 추가
        const { error } = await supabase
          .from('todos')
          .insert({
            user_id: user!.id,
            title: (data as CreateTodoInput).title,
            description: data.description,
            priority: data.priority || 'medium',
            due_date: data.due_date,
            category: data.category || [],
            completed: false,
          });

        if (error) throw error;

        // 목록 갱신
        await fetchTodos();
      }

      // 폼 닫기 및 초기화
      setIsFormOpen(false);
      setEditingTodo(null);
    } catch (err) {
      console.error('[Submit Todo Error]', err);
      alert(editingTodo ? '할 일 수정에 실패했습니다.' : '할 일 추가에 실패했습니다.');
    }
  };

  /**
   * 폼 취소 핸들러
   */
  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingTodo(null);
  };

  /**
   * AI 생성 핸들러 (추후 구현)
   */
  const handleAIGenerate = () => {
    alert('AI 생성 기능은 추후 구현 예정입니다.');
  };

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = async () => {
    try {
      await signOut();
      // AuthProvider에서 자동으로 로그인 페이지로 리다이렉트됨
    } catch (error) {
      console.error('[Logout Error]', error);
      alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 사용자 정보 로딩 중
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 렌더링하지 않음 (AuthProvider에서 리다이렉트 처리)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* 헤더 */}
      <Header 
        user={{
          name: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
          email: user.email || '',
        }}
        onLogout={handleLogout}
      />

      {/* 툴바 */}
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilters={priorityFilters}
        onPriorityFiltersChange={setPriorityFilters}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalCount={todos.length}
      />

      {/* 메인 영역 */}
      <main className="flex-1 container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 할 일 추가 폼 */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">새 할 일</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsFormOpen(true)}
                    className="lg:hidden"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                {/* 데스크톱: 인라인 폼 */}
                <div className="hidden lg:block">
                  <TodoForm
                    onSubmit={handleSubmit}
                    onAIGenerate={handleAIGenerate}
                  />
                </div>

                {/* 모바일: 버튼만 표시 */}
                <div className="lg:hidden">
                  <Button
                    onClick={() => setIsFormOpen(true)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Plus className="h-5 w-5" />
                    할 일 추가
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* 우측: AI 요약 및 할 일 목록 */}
          <section className="lg:col-span-2 space-y-6">
            {/* AI 요약 및 분석 */}
            <TodoSummary todos={todos} />

            {/* 할 일 목록 */}
            <TodoList
              todos={filteredAndSortedTodos}
              isLoading={isLoading}
              error={error}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyAction={
                <Button onClick={() => setIsFormOpen(true)} size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  첫 할 일 추가하기
                </Button>
              }
            />
          </section>
        </div>
      </main>

      {/* 할 일 추가/수정 다이얼로그 (모바일) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTodo ? '할 일 수정' : '새 할 일 추가'}
            </DialogTitle>
            <DialogDescription>
              {editingTodo
                ? '할 일 정보를 수정하세요'
                : '새로운 할 일을 추가하세요'}
            </DialogDescription>
          </DialogHeader>
          <TodoForm
            initialData={editingTodo || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onAIGenerate={!editingTodo ? handleAIGenerate : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
