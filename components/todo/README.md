# Todo 컴포넌트 사용 가이드

할 일 관리 기능을 위한 재사용 가능한 React 컴포넌트 세트입니다.

## 📦 컴포넌트 목록

### 1. TodoCard
개별 할 일을 표시하는 카드 컴포넌트

### 2. TodoList
할 일 목록을 표시하고 로딩/빈 상태/오류 처리를 제공하는 컴포넌트

### 3. TodoForm
할 일 추가 및 편집을 위한 폼 컴포넌트

---

## 🚀 사용 예시

### TodoCard 사용

```tsx
import { TodoCard } from '@/components/todo';

const MyComponent = () => {
  const handleToggle = async (todoId: string) => {
    // 할 일 완료 상태 토글 로직
    await updateTodo(todoId, { completed: !todo.completed });
  };

  const handleEdit = (todo: Todo) => {
    // 편집 모달 열기 등
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const handleDelete = async (todoId: string) => {
    // 삭제 확인 후 삭제
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteTodo(todoId);
    }
  };

  return (
    <TodoCard
      todo={todo}
      onToggle={handleToggle}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
```

### TodoList 사용

```tsx
import { TodoList } from '@/components/todo';
import { Button } from '@/components/ui/button';

const TodoPage = () => {
  const { todos, isLoading, error } = useTodos();

  return (
    <TodoList
      todos={todos}
      isLoading={isLoading}
      error={error}
      onToggle={handleToggle}
      onEdit={handleEdit}
      onDelete={handleDelete}
      emptyAction={
        <Button onClick={() => setIsFormOpen(true)}>
          할 일 추가
        </Button>
      }
    />
  );
};
```

### TodoForm 사용

```tsx
import { TodoForm } from '@/components/todo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TodoFormDialog = ({ isOpen, onClose, editingTodo }) => {
  const handleSubmit = async (data: CreateTodoInput | UpdateTodoInput) => {
    if (editingTodo) {
      // 수정
      await updateTodo(editingTodo.id, data);
    } else {
      // 생성
      await createTodo(data);
    }
    onClose();
  };

  const handleAIGenerate = () => {
    // AI 생성 로직
    setIsAIDialogOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTodo ? '할 일 수정' : '새 할 일 추가'}
          </DialogTitle>
        </DialogHeader>
        <TodoForm
          initialData={editingTodo}
          onSubmit={handleSubmit}
          onCancel={onClose}
          onAIGenerate={!editingTodo ? handleAIGenerate : undefined}
        />
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🎨 컴포넌트 기능

### TodoCard

**기능:**
- ✅ 완료/미완료 토글 체크박스
- ✏️ 편집 버튼
- 🗑️ 삭제 버튼
- 🎯 우선순위 배지 (높음/보통/낮음)
- 🏷️ 카테고리 태그
- 📅 마감일 표시 (오늘/내일/D-day)
- ⚠️ 마감일 경과 시 경고 표시

**Props:**
```typescript
interface TodoCardProps {
  todo: Todo;
  onToggle?: (todoId: string) => Promise<void>;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todoId: string) => Promise<void>;
}
```

### TodoList

**기능:**
- 📋 진행 중 / 완료됨 섹션 자동 분리
- ⏳ 로딩 상태 UI
- 📭 빈 상태 UI (커스텀 액션 지원)
- ❌ 오류 상태 UI
- 📊 전체 통계 표시

**Props:**
```typescript
interface TodoListProps {
  todos: Todo[];
  isLoading?: boolean;
  error?: string | null;
  onToggle?: (todoId: string) => Promise<void>;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todoId: string) => Promise<void>;
  emptyAction?: React.ReactNode;
}
```

### TodoForm

**기능:**
- 📝 제목 입력 (최대 200자)
- 📄 설명 입력 (선택사항)
- 🎯 우선순위 선택 (낮음/보통/높음)
- 📅 마감일 선택 (캘린더 UI)
- 🏷️ 카테고리 추가/제거
- ✨ AI 생성 버튼 (추가 모드)
- ✅ 실시간 유효성 검사
- ❌ 오류 메시지 표시

**Props:**
```typescript
interface TodoFormProps {
  initialData?: Todo;
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => Promise<void>;
  onCancel?: () => void;
  onAIGenerate?: () => void;
  isSubmitting?: boolean;
}
```

---

## 🎯 우선순위 컬러

브랜드 컬러를 활용한 우선순위 시스템:

- 🔴 **높음** (high): `bg-priority-high` - 긴급한 작업
- 🟡 **보통** (medium): `bg-priority-medium` - 일반적인 작업
- 🟢 **낮음** (low): `bg-priority-low` - 여유있는 작업

---

## 🔧 커스터마이징

### 스타일 수정

모든 컴포넌트는 Tailwind CSS를 사용하므로 className을 통해 쉽게 커스터마이징 가능합니다.

```tsx
<TodoCard 
  todo={todo}
  className="shadow-lg border-2" // 커스텀 스타일
/>
```

### 기능 확장

각 컴포넌트는 독립적이므로 필요한 부분만 선택해서 사용하거나 확장할 수 있습니다.

---

## 📚 타입 정의

모든 타입은 `@/types/todo`에서 import 가능합니다:

```typescript
import type { 
  Todo, 
  TodoPriority, 
  CreateTodoInput, 
  UpdateTodoInput,
  TodoFilterOptions,
  TodoSortBy
} from '@/types/todo';
```

---

## ✅ 프로젝트 규칙 준수

이 컴포넌트들은 다음 프로젝트 규칙을 따릅니다:

- ✅ 화살표 함수로 작성
- ✅ 한글 JSDoc 주석 필수
- ✅ TypeScript strict mode
- ✅ 로딩/빈 상태/오류 상태 UI 제공
- ✅ Shadcn/ui 컴포넌트 사용
- ✅ 브랜드 컬러 시스템 적용
- ✅ 접근성 고려 (ARIA 레이블)
- ✅ 반응형 디자인 (Mobile-First)

---

마지막 업데이트: 2026-01-04

