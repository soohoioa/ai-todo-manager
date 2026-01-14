"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  CheckCircle2,
  Target,
  Clock,
  Calendar,
  BarChart3,
  Zap,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";
import type { AnalyzeTodosResponse, TodoAnalysis } from "@/types/ai";

/**
 * AI 요약 컴포넌트 Props
 */
interface TodoSummaryProps {
  /** 전체 할 일 목록 */
  todos: Todo[];
}

/**
 * AI 요약 및 분석 컴포넌트
 * 오늘/이번 주 할 일을 분석하여 인사이트 제공
 */
export const TodoSummary = ({ todos }: TodoSummaryProps) => {
  const [period, setPeriod] = useState<"today" | "week">("today");
  const [analysis, setAnalysis] = useState<TodoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 오늘 할 일 필터링
   */
  const getTodayTodos = (): Todo[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    return todos.filter((todo) => {
      // 생성일이 오늘이거나, 마감일이 오늘인 경우
      const createdDate = todo.created_date?.split("T")[0];
      const dueDate = todo.due_date?.split("T")[0];
      return createdDate === todayStr || dueDate === todayStr;
    });
  };

  /**
   * 이번 주 할 일 필터링
   */
  const getWeekTodos = (): Todo[] => {
    const today = new Date();
    const currentDay = today.getDay(); // 0(일) ~ 6(토)
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // 월요일까지의 거리
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return todos.filter((todo) => {
      const createdDate = todo.created_date ? new Date(todo.created_date) : null;
      const dueDate = todo.due_date ? new Date(todo.due_date) : null;

      // 생성일이나 마감일이 이번 주에 속하는 경우
      const isCreatedThisWeek = createdDate && createdDate >= monday && createdDate <= sunday;
      const isDueThisWeek = dueDate && dueDate >= monday && dueDate <= sunday;

      return isCreatedThisWeek || isDueThisWeek;
    });
  };

  /**
   * 통계 계산
   */
  const getStats = (targetTodos: Todo[]) => {
    const total = targetTodos.length;
    const completed = targetTodos.filter((t) => t.completed).length;
    const incomplete = targetTodos.filter((t) => !t.completed);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 우선순위별 미완료 작업
    const highPriority = incomplete.filter((t) => t.priority === "high");
    const mediumPriority = incomplete.filter((t) => t.priority === "medium");
    const lowPriority = incomplete.filter((t) => t.priority === "low");

    // 긴급 작업 (오늘 마감 또는 기한 초과)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const urgent = incomplete.filter((t) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today;
    });

    return {
      total,
      completed,
      incomplete: incomplete.length,
      completionRate,
      highPriority,
      mediumPriority,
      lowPriority,
      urgent,
    };
  };

  /**
   * AI 분석 요청
   */
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const targetTodos = period === "today" ? getTodayTodos() : getWeekTodos();

      const response = await fetch("/api/ai/analyze-todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          todos: targetTodos.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            due_date: t.due_date,
            priority: t.priority,
            category: t.category,
            completed: t.completed,
            created_date: t.created_date,
          })),
          period,
        }),
      });

      const data: AnalyzeTodosResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "AI 분석에 실패했습니다.");
      }

      setAnalysis(data.data);
    } catch (err) {
      console.error("[TodoSummary] AI 분석 실패:", err);
      const message = err instanceof Error ? err.message : "AI 분석 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 탭 변경 시 분석 결과 초기화
   */
  const handleTabChange = (value: string) => {
    setPeriod(value as "today" | "week");
    setAnalysis(null);
    setError(null);
  };

  const todayTodos = getTodayTodos();
  const weekTodos = getWeekTodos();
  const todayStats = getStats(todayTodos);
  const weekStats = getStats(weekTodos);

  const currentStats = period === "today" ? todayStats : weekStats;
  const currentTodos = period === "today" ? todayTodos : weekTodos;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI 요약 및 분석
        </CardTitle>
        <CardDescription>
          할 일 목록을 분석하여 인사이트와 추천 사항을 제공합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={period} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today" className="gap-2">
              <Calendar className="h-4 w-4" />
              오늘의 요약
              {todayTodos.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {todayTodos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              이번 주 요약
              {weekTodos.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {weekTodos.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 오늘의 요약 탭 */}
          <TabsContent value="today" className="space-y-6 mt-6">
            {currentTodos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  오늘 등록된 할 일이 없습니다.
                </p>
              </div>
            ) : (
              <>
                {/* 완료율 섹션 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {currentStats.completionRate}%
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        완료율 ({currentStats.completed}/{currentStats.total})
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <Progress value={currentStats.completionRate} className="h-3" />
                </div>

                <Separator />

                {/* 남은 할 일 섹션 */}
                {currentStats.incomplete > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-muted-foreground" />
                      <h4 className="font-semibold">
                        남은 할 일 ({currentStats.incomplete}개)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 높음 우선순위 */}
                      {currentStats.highPriority.length > 0 && (
                        <Card className="border-destructive/50 bg-destructive/5">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                높음
                              </Badge>
                              <span className="text-lg font-bold">
                                {currentStats.highPriority.length}
                              </span>
                            </div>
                            <ul className="space-y-1 text-xs">
                              {currentStats.highPriority.slice(0, 3).map((todo) => (
                                <li key={todo.id} className="truncate text-muted-foreground">
                                  • {todo.title}
                                </li>
                              ))}
                              {currentStats.highPriority.length > 3 && (
                                <li className="text-muted-foreground">
                                  +{currentStats.highPriority.length - 3}개 더
                                </li>
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* 보통 우선순위 */}
                      {currentStats.mediumPriority.length > 0 && (
                        <Card className="border-orange-500/50 bg-orange-500/5">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge 
                                variant="secondary" 
                                className="gap-1 bg-orange-500/20 text-orange-700 dark:text-orange-300"
                              >
                                <Clock className="h-3 w-3" />
                                보통
                              </Badge>
                              <span className="text-lg font-bold">
                                {currentStats.mediumPriority.length}
                              </span>
                            </div>
                            <ul className="space-y-1 text-xs">
                              {currentStats.mediumPriority.slice(0, 3).map((todo) => (
                                <li key={todo.id} className="truncate text-muted-foreground">
                                  • {todo.title}
                                </li>
                              ))}
                              {currentStats.mediumPriority.length > 3 && (
                                <li className="text-muted-foreground">
                                  +{currentStats.mediumPriority.length - 3}개 더
                                </li>
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* 낮음 우선순위 */}
                      {currentStats.lowPriority.length > 0 && (
                        <Card className="border-green-500/50 bg-green-500/5">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge 
                                variant="secondary"
                                className="gap-1 bg-green-500/20 text-green-700 dark:text-green-300"
                              >
                                <Zap className="h-3 w-3" />
                                낮음
                              </Badge>
                              <span className="text-lg font-bold">
                                {currentStats.lowPriority.length}
                              </span>
                            </div>
                            <ul className="space-y-1 text-xs">
                              {currentStats.lowPriority.slice(0, 3).map((todo) => (
                                <li key={todo.id} className="truncate text-muted-foreground">
                                  • {todo.title}
                                </li>
                              ))}
                              {currentStats.lowPriority.length > 3 && (
                                <li className="text-muted-foreground">
                                  +{currentStats.lowPriority.length - 3}개 더
                                </li>
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* 긴급 작업 하이라이트 */}
                    {currentStats.urgent.length > 0 && (
                      <Alert variant="destructive" className="border-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-medium">
                          ⚠️ 긴급: {currentStats.urgent.length}개의 작업이 마감일이 지났거나 오늘 마감입니다!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <Separator />

                {/* AI 분석 버튼 */}
                {!analysis && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full gap-2 h-12 text-base"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        AI 분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        AI 요약 보기
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          {/* 이번 주 요약 탭 */}
          <TabsContent value="week" className="space-y-6 mt-6">
            {currentTodos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  이번 주 등록된 할 일이 없습니다.
                </p>
              </div>
            ) : (
              <>
                {/* 주간 완료율 섹션 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {currentStats.completionRate}%
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        주간 완료율 ({currentStats.completed}/{currentStats.total})
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <Progress value={currentStats.completionRate} className="h-3" />
                </div>

                <Separator />

                {/* 주간 통계 그리드 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {currentStats.total}
                      </p>
                      <p className="text-xs text-muted-foreground">전체 작업</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {currentStats.completed}
                      </p>
                      <p className="text-xs text-muted-foreground">완료</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {currentStats.incomplete}
                      </p>
                      <p className="text-xs text-muted-foreground">미완료</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-destructive">
                        {currentStats.urgent.length}
                      </p>
                      <p className="text-xs text-muted-foreground">긴급</p>
                    </CardContent>
                  </Card>
                </div>

                {/* 우선순위별 분포 */}
                {currentStats.incomplete > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      <h4 className="font-semibold">우선순위별 남은 작업</h4>
                    </div>

                    <div className="space-y-3">
                      {currentStats.highPriority.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="destructive">높음</Badge>
                            <span className="font-medium">
                              {currentStats.highPriority.length}개
                            </span>
                          </div>
                          <Progress 
                            value={(currentStats.highPriority.length / currentStats.incomplete) * 100} 
                            className="h-2 bg-destructive/20"
                          />
                        </div>
                      )}
                      {currentStats.mediumPriority.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-700">
                              보통
                            </Badge>
                            <span className="font-medium">
                              {currentStats.mediumPriority.length}개
                            </span>
                          </div>
                          <Progress 
                            value={(currentStats.mediumPriority.length / currentStats.incomplete) * 100} 
                            className="h-2 bg-orange-500/20"
                          />
                        </div>
                      )}
                      {currentStats.lowPriority.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                              낮음
                            </Badge>
                            <span className="font-medium">
                              {currentStats.lowPriority.length}개
                            </span>
                          </div>
                          <Progress 
                            value={(currentStats.lowPriority.length / currentStats.incomplete) * 100} 
                            className="h-2 bg-green-500/20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* AI 분석 버튼 */}
                {!analysis && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full gap-2 h-12 text-base"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        AI 분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        AI 요약 보기
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* AI 분석 결과 */}
        {analysis && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Separator />

            {/* 전체 요약 */}
            <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">전체 요약</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {analysis.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* 긴급 작업 */}
            {analysis.urgentTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <h4 className="font-semibold text-lg">⚠️ 긴급 작업</h4>
                </div>
                <div className="grid gap-2">
                  {analysis.urgentTasks.map((task, idx) => (
                    <Card
                      key={idx}
                      className="border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-sm font-medium pt-0.5">{task}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 인사이트 */}
            {analysis.insights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <h4 className="font-semibold text-lg">📈 인사이트</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.insights.map((insight, idx) => (
                    <Card
                      key={idx}
                      className="border-accent/30 bg-accent/5 hover:shadow-md transition-all"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {insight}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 추천 사항 */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Lightbulb className="h-5 w-5 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-lg">💡 추천 사항</h4>
                </div>
                <div className="space-y-2">
                  {analysis.recommendations.map((recommendation, idx) => (
                    <Card
                      key={idx}
                      className="border-secondary/30 bg-secondary/5 hover:border-secondary/50 transition-colors group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/20 text-secondary flex-shrink-0 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                          <p className="text-sm leading-relaxed pt-0.5">
                            {recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 다시 분석 버튼 */}
            <div className="pt-4">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                다시 분석하기
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
