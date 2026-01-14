'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TodoPriority, TodoSortBy } from '@/types/todo';

/**
 * 툴바 컴포넌트의 Props
 */
interface ToolbarProps {
  /** 검색 키워드 */
  searchQuery: string;
  /** 검색 키워드 변경 핸들러 */
  onSearchChange: (query: string) => void;
  /** 선택된 상태 필터 */
  statusFilter: 'all' | 'active' | 'completed';
  /** 상태 필터 변경 핸들러 */
  onStatusFilterChange: (status: 'all' | 'active' | 'completed') => void;
  /** 선택된 우선순위 필터 */
  priorityFilters: TodoPriority[];
  /** 우선순위 필터 변경 핸들러 */
  onPriorityFiltersChange: (priorities: TodoPriority[]) => void;
  /** 정렬 기준 */
  sortBy: TodoSortBy;
  /** 정렬 기준 변경 핸들러 */
  onSortByChange: (sortBy: TodoSortBy) => void;
  /** 전체 할 일 개수 */
  totalCount?: number;
}

/**
 * 할 일 검색, 필터, 정렬 기능을 제공하는 툴바 컴포넌트
 */
export const Toolbar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilters,
  onPriorityFiltersChange,
  sortBy,
  onSortByChange,
  totalCount = 0,
}: ToolbarProps) => {
  /**
   * 우선순위 필터 토글 핸들러
   */
  const handlePriorityToggle = (priority: TodoPriority) => {
    if (priorityFilters.includes(priority)) {
      onPriorityFiltersChange(priorityFilters.filter((p) => p !== priority));
    } else {
      onPriorityFiltersChange([...priorityFilters, priority]);
    }
  };

  /**
   * 활성화된 필터 개수 계산
   */
  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) + priorityFilters.length;

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* 검색 입력 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="할 일 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 필터 및 정렬 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 전체 개수 표시 */}
            {totalCount > 0 && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                전체 {totalCount}개
              </Badge>
            )}

            {/* 상태 필터 */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">진행 중</SelectItem>
                <SelectItem value="completed">완료됨</SelectItem>
              </SelectContent>
            </Select>

            {/* 우선순위 필터 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>필터</span>
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>우선순위</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={priorityFilters.includes('high')}
                  onCheckedChange={() => handlePriorityToggle('high')}
                >
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-priority-high" />
                    높음
                  </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={priorityFilters.includes('medium')}
                  onCheckedChange={() => handlePriorityToggle('medium')}
                >
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-priority-medium" />
                    보통
                  </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={priorityFilters.includes('low')}
                  onCheckedChange={() => handlePriorityToggle('low')}
                >
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-priority-low" />
                    낮음
                  </span>
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 정렬 기준 */}
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_date">생성일순</SelectItem>
                <SelectItem value="due_date">마감일순</SelectItem>
                <SelectItem value="priority">우선순위순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

