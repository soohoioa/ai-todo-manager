"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";

/**
 * 할 일 카드 컴포넌트의 Props
 */
interface TodoCardProps {
  /** 표시할 할 일 데이터 */
  todo: Todo;
  /** 체크박스 토글 핸들러 */
  onToggle?: (todoId: string) => Promise<void>;
  /** 편집 버튼 클릭 핸들러 */
  onEdit?: (todo: Todo) => void;
  /** 삭제 버튼 클릭 핸들러 */
  onDelete?: (todoId: string) => Promise<void>;
}

/**
 * 우선순위에 따른 배지 스타일을 반환하는 헬퍼 함수
 */
const getPriorityConfig = (priority: Todo["priority"]) => {
  const configs = {
    high: {
      label: "높음",
      className: "bg-priority-high text-white",
    },
    medium: {
      label: "보통",
      className: "bg-priority-medium text-white",
    },
    low: {
      label: "낮음",
      className: "bg-priority-low text-white",
    },
  };
  return configs[priority];
};

/**
 * 날짜 포맷팅 헬퍼 함수 (YYYY.MM.DD)
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
};

/**
 * D-day 계산 헬퍼 함수
 */
const calculateDday = (dateString?: string): string | null => {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
  return `D-${diffDays}`;
};

/**
 * 개별 할 일을 표시하는 카드 컴포넌트
 * 체크박스, 제목, 설명, 우선순위, 카테고리, 마감일 등을 표시하고
 * 편집, 삭제 기능을 제공합니다.
 */
export const TodoCard = ({
  todo,
  onToggle,
  onEdit,
  onDelete,
}: TodoCardProps) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const priorityConfig = getPriorityConfig(todo.priority);
  const dday = calculateDday(todo.due_date);
  const isOverdue = dday?.startsWith("D+") && !todo.completed;

  /**
   * 체크박스 토글 처리
   */
  const handleToggle = async () => {
    if (!onToggle || isToggling) return;

    setIsToggling(true);
    try {
      await onToggle(todo.id);
    } catch (error) {
      console.error("[TodoCard] 토글 실패:", error);
    } finally {
      setIsToggling(false);
    }
  };

  /**
   * 삭제 버튼 클릭 처리
   */
  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(todo.id);
    } catch (error) {
      console.error("[TodoCard] 삭제 실패:", error);
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        todo.completed && "opacity-60",
        isDeleting && "opacity-40 pointer-events-none"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* 완료 체크박스 */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label={
              todo.completed ? "할 일 미완료로 표시" : "할 일 완료로 표시"
            }
          >
            {todo.completed ? (
              <CheckCircle2 className="h-5 w-5 text-accent" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </button>

          {/* 제목 및 메타 정보 */}
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-semibold text-lg leading-tight",
                todo.completed && "line-through text-muted-foreground"
              )}
            >
              {todo.title}
            </h3>

            {/* 우선순위 및 카테고리 */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={priorityConfig.className} variant="secondary">
                {priorityConfig.label}
              </Badge>

              {todo.category.map((cat) => (
                <Badge key={cat} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(todo)}
                className="h-8 w-8"
                aria-label="할 일 편집"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="할 일 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* 설명 및 날짜 정보 */}
      <CardContent className="pt-0 space-y-3">
        {/* 설명 */}
        {todo.description && (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              todo.completed && "line-through"
            )}
          >
            {todo.description}
          </p>
        )}

        {/* 날짜 정보 */}
        <div className="flex flex-col gap-2 text-sm">
          {/* 생성일 */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>생성일: {formatDate(todo.created_date)}</span>
          </div>

          {/* 마감일 */}
          {todo.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span
                className={cn(
                  "text-muted-foreground",
                  isOverdue && "text-destructive font-medium"
                )}
              >
                마감일: {formatDate(todo.due_date)}
              </span>
              {dday && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1",
                    isOverdue && "bg-destructive/10 text-destructive"
                  )}
                >
                  {dday}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
