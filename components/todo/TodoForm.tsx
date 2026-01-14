"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Todo,
  TodoPriority,
  CreateTodoInput,
  UpdateTodoInput,
} from "@/types/todo";
import type { GenerateTodoResponse } from "@/types/ai";

/**
 * 할 일 폼 컴포넌트의 Props
 */
interface TodoFormProps {
  /** 편집 모드일 때 전달되는 기존 할 일 데이터 */
  initialData?: Todo;
  /** 폼 제출 핸들러 */
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => Promise<void>;
  /** 취소 버튼 클릭 핸들러 */
  onCancel?: () => void;
  /** 제출 중 상태 */
  isSubmitting?: boolean;
  /** AI 생성 다이얼로그 열기 핸들러 */
  onAIGenerate?: () => void;
}

/**
 * 할 일 추가 및 편집을 위한 폼 컴포넌트
 * 제목, 설명, 마감일, 우선순위, 카테고리를 입력받고
 * AI 생성 기능도 제공합니다.
 */
export const TodoForm = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TodoFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData?.due_date ? new Date(initialData.due_date) : undefined
  );
  const [priority, setPriority] = useState<TodoPriority>(
    initialData?.priority || "medium"
  );
  const [categories, setCategories] = useState<string[]>(
    initialData?.category || []
  );
  const [error, setError] = useState<string | null>(null);

  // AI 생성 관련 상태
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const isEditMode = !!initialData;

  // 사전 정의된 카테고리 목록
  const predefinedCategories = ["업무", "개인", "건강", "학습"];

  /**
   * 초기 데이터 변경 시 폼 상태 업데이트
   */
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setDueDate(
        initialData.due_date ? new Date(initialData.due_date) : undefined
      );
      setPriority(initialData.priority);
      setCategories(initialData.category);
    }
  }, [initialData]);

  /**
   * 카테고리 토글 처리
   */
  const handleToggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((cat) => cat !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  /**
   * AI 다이얼로그 열기
   */
  const handleOpenAIDialog = () => {
    setIsAIDialogOpen(true);
    setAiPrompt("");
    setAiError(null);
  };

  /**
   * AI 다이얼로그 닫기
   */
  const handleCloseAIDialog = () => {
    setIsAIDialogOpen(false);
    setAiPrompt("");
    setAiError(null);
  };

  /**
   * AI로 할 일 생성
   */
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setAiError("할 일 내용을 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch("/api/ai/generate-todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
        }),
      });

      const data: GenerateTodoResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "AI 생성에 실패했습니다.");
      }

      // 생성된 데이터로 폼 필드 채우기
      const generated = data.data;
      setTitle(generated.title);
      setDescription(generated.description || "");
      setPriority(generated.priority);
      setCategories(generated.category);

      // 마감일 설정
      if (generated.due_date) {
        const dueDateTime = new Date(generated.due_date);

        // 시간이 있으면 설정
        if (generated.due_time) {
          const [hours, minutes] = generated.due_time.split(":");
          dueDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        }

        setDueDate(dueDateTime);
      }

      // 성공 시 다이얼로그 닫기
      handleCloseAIDialog();
    } catch (err) {
      console.error("[TodoForm] AI 생성 실패:", err);
      const message =
        err instanceof Error ? err.message : "AI 생성 중 오류가 발생했습니다.";
      setAiError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 폼 제출 처리
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!title.trim()) {
      setError("제목을 입력해주세요");
      return;
    }

    if (title.length > 200) {
      setError("제목은 200자 이하여야 합니다");
      return;
    }

    try {
      const formData: CreateTodoInput | UpdateTodoInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate?.toISOString(),
        priority,
        category: categories,
      };

      await onSubmit(formData);

      // 성공 시 폼 초기화 (편집 모드가 아닐 때만)
      if (!isEditMode) {
        setTitle("");
        setDescription("");
        setDueDate(undefined);
        setPriority("medium");
        setCategories([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "할 일 저장에 실패했습니다";
      setError(message);

      // 개발 환경에서 상세 로그
      if (process.env.NODE_ENV === "development") {
        console.error("[TodoForm] 제출 실패:", err);
      }
    }
  };

  /**
   * 날짜 포맷팅 헬퍼
   */
  const formatDate = (date?: Date): string => {
    if (!date) return "마감일 선택";
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * D-day 계산 헬퍼
   */
  const calculateDday = (date?: Date): string | null => {
    if (!date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "내일";
    if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
    return `D-${diffDays}`;
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 오류 메시지 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 제목 */}
        <div className="space-y-2">
          <Label htmlFor="title" className="required">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="할 일을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            disabled={isSubmitting}
            className="text-base"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {title.length} / 200자
          </p>
        </div>

        {/* 설명 */}
        <div className="space-y-2">
          <Label htmlFor="description">상세 설명</Label>
          <Textarea
            id="description"
            placeholder="상세 내용을 입력하세요 (선택사항)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* 우선순위 */}
        <div className="space-y-2">
          <Label htmlFor="priority">우선순위</Label>
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as TodoPriority)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">낮음</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="high">높음</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 마감일 */}
        <div className="space-y-2">
          <Label>마감일</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={isSubmitting}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="flex-1">{formatDate(dueDate)}</span>
                {dueDate && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-2",
                      calculateDday(dueDate)?.startsWith("D+") &&
                        "bg-destructive/10 text-destructive"
                    )}
                  >
                    {calculateDday(dueDate)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
              {dueDate && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDueDate(undefined)}
                    className="w-full"
                  >
                    마감일 제거
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* 카테고리 */}
        <div className="space-y-2">
          <Label>카테고리</Label>
          <div className="flex flex-wrap gap-2">
            {predefinedCategories.map((category) => (
              <Button
                key={category}
                type="button"
                variant={categories.includes(category) ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleCategory(category)}
                disabled={isSubmitting}
                className={cn(
                  "transition-all",
                  categories.includes(category) && "shadow-sm"
                )}
              >
                {category}
                {categories.includes(category) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Button>
            ))}
          </div>

          {/* 선택된 카테고리 표시 */}
          {categories.length > 0 && (
            <p className="text-xs text-muted-foreground">
              선택됨: {categories.join(", ")}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
          {/* AI 생성 버튼 (추가 모드에서만) */}
          {!isEditMode && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleOpenAIDialog}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI로 생성
            </Button>
          )}

          {/* 취소 버튼 */}
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="sm:ml-auto"
          >
            {isSubmitting ? "저장 중..." : isEditMode ? "수정하기" : "추가하기"}
          </Button>
        </div>
      </form>

      {/* AI 생성 다이얼로그 */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI로 할 일 생성
            </DialogTitle>
            <DialogDescription>
              자연어로 할 일을 입력하면 AI가 자동으로 구조화된 데이터로
              변환해드립니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 자연어 입력 */}
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">할 일 입력</Label>
              <Textarea
                id="ai-prompt"
                placeholder="예: 내일 오후 3시까지 중요한 팀 회의 준비하기"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isGenerating}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                💡 날짜, 시간, 우선순위를 자연스럽게 입력해주세요.
              </p>
            </div>

            {/* AI 에러 메시지 */}
            {aiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAIDialog}
              disabled={isGenerating}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleAIGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  생성하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
