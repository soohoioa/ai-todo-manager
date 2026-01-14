import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { AnalyzeTodosResponse, TodoAnalysis } from '@/types/ai';

/**
 * AI 분석 결과 스키마
 */
const analysisSchema = z.object({
  summary: z.string().describe('전체 할 일에 대한 간결한 요약 (완료율, 전체 개수 등)'),
  urgentTasks: z
    .array(z.string())
    .describe('긴급하게 처리해야 할 작업 제목 목록 (최대 5개)'),
  insights: z
    .array(z.string())
    .describe('할 일 패턴과 현황에 대한 인사이트 (3-5개, 구체적이고 실행 가능한 내용)'),
  recommendations: z
    .array(z.string())
    .describe('생산성 향상을 위한 구체적인 추천 사항 (3-5개, 실행 가능한 조언)'),
});

/**
 * POST /api/ai/analyze-todos
 * 사용자의 할 일 목록을 분석하여 요약과 인사이트 제공
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 본문 파싱
    const body = await request.json();
    const { todos, period } = body;

    // 2. 입력 검증
    if (!todos || !Array.isArray(todos)) {
      return NextResponse.json<AnalyzeTodosResponse>(
        {
          success: false,
          error: '유효한 할 일 목록이 필요합니다.',
        },
        { status: 400 }
      );
    }

    if (!period || !['today', 'week'].includes(period)) {
      return NextResponse.json<AnalyzeTodosResponse>(
        {
          success: false,
          error: "분석 기간은 'today' 또는 'week'이어야 합니다.",
        },
        { status: 400 }
      );
    }

    // 할 일이 없는 경우
    if (todos.length === 0) {
      return NextResponse.json<AnalyzeTodosResponse>({
        success: true,
        data: {
          summary: period === 'today' ? '오늘 등록된 할 일이 없습니다.' : '이번 주 등록된 할 일이 없습니다.',
          urgentTasks: [],
          insights: ['아직 할 일을 추가하지 않으셨네요.', '새로운 할 일을 추가해보세요!'],
          recommendations: ['할 일을 추가하여 체계적으로 관리해보세요.', 'AI 생성 기능을 활용하면 더 쉽게 할 일을 만들 수 있습니다.'],
        },
      });
    }

    // 3. API 키 확인
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('[AI Analyze] GOOGLE_GENERATIVE_AI_API_KEY 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json<AnalyzeTodosResponse>(
        {
          success: false,
          error: 'AI 서비스 설정이 완료되지 않았습니다.',
        },
        { status: 500 }
      );
    }

    // 4. 현재 날짜/시간 정보 (한국 시간)
    const now = new Date();
    const kstOffset = 9 * 60; // UTC+9
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
    const currentDate = kstTime.toISOString().split('T')[0];
    const currentTime = kstTime.toTimeString().split(' ')[0].slice(0, 5);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayNames[kstTime.getUTCDay()];

    // 5. 상세 통계 계산
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t) => t.completed).length;
    const incompleteTodos = totalTodos - completedTodos;
    const completionRate = totalTodos > 0 ? ((completedTodos / totalTodos) * 100).toFixed(1) : '0.0';
    
    // 우선순위별 통계
    const highPriority = todos.filter((t) => t.priority === 'high').length;
    const mediumPriority = todos.filter((t) => t.priority === 'medium').length;
    const lowPriority = todos.filter((t) => t.priority === 'low').length;
    
    const highCompleted = todos.filter((t) => t.priority === 'high' && t.completed).length;
    const mediumCompleted = todos.filter((t) => t.priority === 'medium' && t.completed).length;
    const lowCompleted = todos.filter((t) => t.priority === 'low' && t.completed).length;
    
    const highCompletionRate = highPriority > 0 ? ((highCompleted / highPriority) * 100).toFixed(1) : '0.0';
    const mediumCompletionRate = mediumPriority > 0 ? ((mediumCompleted / mediumPriority) * 100).toFixed(1) : '0.0';
    const lowCompletionRate = lowPriority > 0 ? ((lowCompleted / lowPriority) * 100).toFixed(1) : '0.0';

    // 마감일 관련 통계
    const todosWithDueDate = todos.filter((t) => t.due_date).length;
    const overdueTodos = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      return new Date(t.due_date) < new Date(currentDate);
    });
    const overdueCount = overdueTodos.length;
    
    const dueTodayCount = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      return t.due_date.split('T')[0] === currentDate;
    }).length;
    
    const dueThisWeekCount = todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      const dueDate = new Date(t.due_date);
      const weekEnd = new Date(kstTime);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return dueDate >= new Date(currentDate) && dueDate <= weekEnd;
    }).length;

    // 카테고리별 통계
    const categoryCount: Record<string, number> = {};
    const categoryCompleted: Record<string, number> = {};
    todos.forEach((t) => {
      t.category.forEach((cat) => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        if (t.completed) {
          categoryCompleted[cat] = (categoryCompleted[cat] || 0) + 1;
        }
      });
    });
    
    const categoryStats = Object.entries(categoryCount).map(([cat, count]) => {
      const completed = categoryCompleted[cat] || 0;
      const rate = ((completed / count) * 100).toFixed(1);
      return `${cat} ${count}개 (완료 ${completed}개, ${rate}%)`;
    }).join(', ');

    // 요일별 분포 (생성일 기준)
    const dayDistribution: Record<string, number> = {};
    todos.forEach((t) => {
      if (t.created_date) {
        const created = new Date(t.created_date);
        const day = dayNames[created.getDay()];
        dayDistribution[day] = (dayDistribution[day] || 0) + 1;
      }
    });

    // 시간대별 분포 (마감 시간 기준)
    const morningCount = todos.filter((t) => {
      if (!t.due_date) return false;
      const hour = new Date(t.due_date).getHours();
      return hour >= 6 && hour < 12;
    }).length;
    
    const afternoonCount = todos.filter((t) => {
      if (!t.due_date) return false;
      const hour = new Date(t.due_date).getHours();
      return hour >= 12 && hour < 18;
    }).length;
    
    const eveningCount = todos.filter((t) => {
      if (!t.due_date) return false;
      const hour = new Date(t.due_date).getHours();
      return hour >= 18 && hour < 24;
    }).length;

    // 6. 할 일 목록을 텍스트로 변환
    const todosText = todos
      .map((todo, idx) => {
        const status = todo.completed ? '✅ 완료' : '⏳ 미완료';
        const priority = todo.priority === 'high' ? '🔴 높음' : todo.priority === 'medium' ? '🟡 보통' : '🟢 낮음';
        const dueDate = todo.due_date ? `마감: ${todo.due_date}` : '마감일 없음';
        const categories = todo.category.length > 0 ? `[${todo.category.join(', ')}]` : '';
        
        return `${idx + 1}. ${status} | ${priority} | ${todo.title} ${categories} | ${dueDate}`;
      })
      .join('\n');

    // 7. Gemini API 호출
    const model = google('gemini-2.0-flash-exp', {
      apiKey,
    });

    const periodText = period === 'today' ? '오늘' : '이번 주';
    const isToday = period === 'today';

    const result = await generateObject({
      model,
      schema: analysisSchema,
      prompt: `당신은 세계적인 생산성 코치이자 시간 관리 전문가입니다.
사용자의 ${periodText} 할 일 목록을 깊이 있게 분석하여 실행 가능한 인사이트와 개인 맞춤형 추천 사항을 제공해주세요.

📅 현재 시간 정보:
- 오늘: ${currentDate} (${dayOfWeek}요일)
- 현재 시각: ${currentTime}
- 분석 기간: ${periodText}

📊 완료율 분석:
- 전체: ${totalTodos}개 중 ${completedTodos}개 완료 (${completionRate}%)
- 미완료: ${incompleteTodos}개 남음
- 우선순위별 완료율:
  * 높음: ${highPriority}개 중 ${highCompleted}개 완료 (${highCompletionRate}%)
  * 보통: ${mediumPriority}개 중 ${mediumCompleted}개 완료 (${mediumCompletionRate}%)
  * 낮음: ${lowPriority}개 중 ${lowCompleted}개 완료 (${lowCompletionRate}%)

⏰ 시간 관리 분석:
- 마감일 설정: ${todosWithDueDate}개 (전체의 ${totalTodos > 0 ? ((todosWithDueDate / totalTodos) * 100).toFixed(1) : '0'}%)
- 기한 초과: ${overdueCount}개 ${overdueCount > 0 ? '⚠️' : '✅'}
- 오늘 마감: ${dueTodayCount}개
- 이번 주 마감: ${dueThisWeekCount}개
- 시간대별 분포: 오전 ${morningCount}개, 오후 ${afternoonCount}개, 저녁 ${eveningCount}개

📁 카테고리별 분석:
${categoryStats || '카테고리 미지정'}

📝 할 일 상세 목록:
${todosText}

🎯 정교한 분석 요구사항:

${isToday ? `
📌 **오늘의 요약 특화 분석**:

1. **summary** (오늘의 진행 상황):
   - 오늘의 완료율과 진행 상황을 구체적으로
   - 현재 시각(${currentTime})을 고려한 남은 시간 활용 방안 언급
   - "오늘 하루도 수고하셨어요" 등 격려 메시지 포함
   - 예: "오늘 ${dueTodayCount}개 중 X개를 완료하셨네요! 오후 시간을 활용해 나머지도 해낼 수 있어요."

2. **urgentTasks** (오늘 우선 처리 작업):
   - 오늘 마감인 작업 최우선
   - 기한 초과된 작업 포함
   - 높은 우선순위 작업 선정
   - 최대 5개, 없으면 빈 배열

3. **insights** (오늘의 집중 인사이트 4-6개):
   
   **✅ 긍정적 피드백 (1-2개 필수)**:
   - 잘하고 있는 부분 구체적으로 칭찬
   - 완료한 작업의 의미 강조
   - 예: "높은 우선순위 작업을 ${highCompleted}개나 완료하셨어요. 중요한 일을 먼저 처리하는 능력이 뛰어나시네요!"
   
   **📊 당일 패턴 분석 (2-3개)**:
   - 시간대별 작업 분포의 균형성
   - 카테고리별 작업 분포와 업무 다양성
   - 마감일이 있는 작업 vs 없는 작업 비율
   - 예: "오후에 ${afternoonCount}개 작업이 집중되어 있어 시간 관리가 중요해 보입니다."
   
   **⚠️ 주의 필요 사항 (1-2개, 있을 경우만)**:
   - 기한 초과 작업 언급
   - 높은 우선순위인데 미완료된 작업
   - 업무 과부하 징후
   - 긍정적 톤으로 개선 가능성 제시

4. **recommendations** (오늘을 위한 실행 가능한 조언 4-6개):
   
   **🎯 우선순위 관리 (1-2개)**:
   - 남은 시간 동안 집중할 작업 순서 제안
   - 긴급-중요 매트릭스 기반 재배치 조언
   - 예: "오늘 마감인 '프로젝트 발표 준비'를 가장 먼저 완료하세요. 예상 소요 시간을 정해두면 더 효율적입니다."
   
   **⏰ 시간 관리 팁 (1-2개)**:
   - 구체적인 시간대 활용 전략
   - 집중 시간 확보 방법
   - 휴식 타이밍 제안
   - 예: "오후 2-4시는 집중력이 높은 시간대입니다. 이 시간에 중요한 작업을 배치해보세요."
   
   **💪 동기부여 및 실천 전략 (1-2개)**:
   - 작은 성취를 통한 동력 확보
   - 번아웃 방지 전략
   - 자기 보상 제안
   - 예: "한 가지 완료할 때마다 짧은 휴식을 가져보세요. 완료의 기쁨을 느끼며 다음 작업으로 넘어가면 더 즐겁게 일할 수 있어요."
   
   **🔄 업무 분산 및 균형 (0-1개, 필요시)**:
   - 과부하된 시간대 분산
   - 카테고리 간 균형 조정
   - 예: "업무 작업이 많네요. 개인 시간도 챙기는 것을 잊지 마세요."

` : `
📊 **이번 주 요약 특화 분석**:

1. **summary** (이번 주 전체 평가):
   - 주간 완료율과 전반적 진행 상황
   - 이번 주의 생산성 수준 평가
   - 다음 주를 위한 희망적 메시지
   - 예: "이번 주 ${totalTodos}개의 할 일 중 ${completedTodos}개를 완료하셨네요! ${completionRate}%의 완료율은 ${parseFloat(completionRate) >= 70 ? '매우 훌륭한' : parseFloat(completionRate) >= 50 ? '좋은' : '개선 가능한'} 수준입니다."

2. **urgentTasks** (이번 주 내 긴급 작업):
   - 이번 주 내 마감 작업
   - 기한 초과된 작업
   - 다음 주로 넘어가면 안 되는 중요 작업
   - 최대 5개, 없으면 빈 배열

3. **insights** (주간 패턴 및 생산성 인사이트 5-7개):
   
   **🎉 주간 성과 및 강점 (2개 필수)**:
   - 이번 주에 잘한 부분 구체적으로 칭찬
   - 완료율이 높은 카테고리나 우선순위 강조
   - 일관성 있게 완료한 부분 인정
   - 예: "높은 우선순위 작업을 ${highCompletionRate}% 완료하셨어요. 중요한 일을 놓치지 않는 능력이 탁월하시네요!"
   
   **📈 주간 생산성 패턴 (2-3개)**:
   - 요일별 작업 생성/완료 패턴 (데이터 있을 경우)
   - 주중 vs 주말 작업 분포
   - 완료하기 쉬운 작업과 어려운 작업의 특징
   - 시간대별 업무 집중도 분석
   - 예: "업무 카테고리 작업이 주간 활동의 ${categoryCount['업무'] ? ((categoryCount['업무'] / totalTodos) * 100).toFixed(0) : '0'}%를 차지합니다. 일과 삶의 균형을 고려해보세요."
   
   **⏱️ 마감일 관리 및 시간 패턴 (1-2개)**:
   - 마감일 준수율 평가
   - 기한 초과 작업의 공통 특징 파악
   - 미루는 작업 유형 식별
   - 예: "마감일이 있는 작업의 완료율이 상대적으로 높네요. 시한을 정하는 것이 동기부여가 되는 것 같아요."
   
   **🔍 개선 가능 영역 (1개, 긍정적 톤)**:
   - 낮은 완료율 카테고리
   - 자주 미루는 작업 유형
   - 시간 관리에서 개선 가능한 부분
   - 반드시 격려와 함께 제시
   - 예: "낮은 우선순위 작업은 ${lowCompletionRate}% 완료되었어요. 중요도가 낮더라도 쌓이면 부담이 되니, 짬짬이 처리하는 습관을 들여보세요."

4. **recommendations** (다음 주를 위한 전략적 조언 5-7개):
   
   **📅 다음 주 계획 수립 (2개)**:
   - 이번 주 패턴을 바탕으로 한 다음 주 전략
   - 미완료 작업 처리 계획
   - 주간 목표 설정 조언
   - 예: "다음 주에는 ${incompleteTodos}개의 미완료 작업을 우선 정리하고, 새로운 작업을 추가하는 것을 추천합니다."
   
   **⚡ 생산성 향상 전략 (2개)**:
   - 가장 생산적인 시간대 활용법
   - 집중 시간 확보 방법
   - 작업 묶음 처리 (배칭) 전략
   - 예: "오후 시간대에 업무가 집중되는 패턴이 보입니다. 오전에 중요한 작업을 배치하면 더 여유로운 하루가 될 거예요."
   
   **🎯 우선순위 및 분산 전략 (1-2개)**:
   - 과부하된 카테고리 분산 방법
   - 우선순위 재조정 필요성
   - 업무-개인 균형 맞추기
   - 예: "업무 외에 개인 시간과 건강 관련 할 일도 균형있게 배치해보세요. 지속 가능한 생산성이 더 중요합니다."
   
   **💡 실천 가능한 습관 (1-2개)**:
   - 작은 습관 형성 팁
   - 꾸준함 유지 전략
   - 자기 보상 시스템
   - 예: "매일 저녁 10분씩 다음 날 할 일을 미리 정리해두세요. 아침에 무엇을 할지 고민하는 시간을 줄일 수 있어요."
   
   **🌟 동기부여 및 마인드셋 (1개)**:
   - 긍정적 마인드 유지 방법
   - 완벽주의 탈피 조언
   - 성장 마인드셋 격려
   - 예: "${completionRate}%의 완료율, 정말 대단하세요! 완벽을 추구하기보다 꾸준함을 목표로 하면 스트레스가 줄어들 거예요."
`}

💬 **문체 가이드라인** (반드시 준수):
- 자연스럽고 친근한 한국어 사용
- "~하세요", "~해보세요", "~할 수 있어요" 등 격려하는 표현
- 전문적이면서도 편안한 톤 유지
- 이모지는 절대 사용하지 말 것
- 구체적인 숫자와 데이터 언급으로 신뢰성 확보
- 사용자를 판단하지 않고 항상 긍정적으로 지원
- 실천 가능한 구체적 행동 제시
- "해야 한다" 대신 "~하면 좋아요", "~해보는 건 어떨까요" 사용

🎯 **핵심 원칙**:
1. 항상 긍정적 피드백으로 시작하기
2. 데이터 기반의 구체적인 분석 제공
3. 실행 가능하고 현실적인 조언만 제시
4. 사용자의 노력과 성취 인정하기
5. 완벽보다는 개선과 성장 강조하기
6. 동기부여와 격려를 잊지 않기`,
    });

    console.log('[AI Analyze] 분석 완료:', {
      period,
      totalTodos,
      completedTodos,
      completionRate,
    });

    // 8. 결과 반환
    return NextResponse.json<AnalyzeTodosResponse>({
      success: true,
      data: result.object as TodoAnalysis,
    });
  } catch (error: any) {
    console.error('[AI Analyze] 분석 실패:', error);

    // 에러 타입에 따른 상세 처리
    if (error?.message?.includes('API key') || error?.message?.includes('authentication')) {
      return NextResponse.json<AnalyzeTodosResponse>(
        {
          success: false,
          error: 'AI 서비스 인증에 실패했습니다.',
        },
        { status: 401 }
      );
    }

    if (
      error?.message?.includes('quota') ||
      error?.message?.includes('rate limit') ||
      error?.message?.includes('429')
    ) {
      return NextResponse.json<AnalyzeTodosResponse>(
        {
          success: false,
          error: 'AI 서비스 사용량을 초과했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json<AnalyzeTodosResponse>(
      {
        success: false,
        error: '할 일 분석 중 오류가 발생했습니다. 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
