import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { GenerateTodoResponse, GeneratedTodo } from '@/types/ai';

/**
 * 입력 텍스트 검증 헬퍼 함수
 */
function validateInput(text: string): { valid: boolean; error?: string } {
  // 빈 문자열 체크
  if (!text || typeof text !== 'string') {
    return { valid: false, error: '유효한 할 일 내용을 입력해주세요.' };
  }

  const trimmed = text.trim();

  // 최소 길이 체크
  if (trimmed.length < 2) {
    return { valid: false, error: '할 일 내용이 너무 짧습니다. 최소 2자 이상 입력해주세요.' };
  }

  // 최대 길이 체크
  if (text.length > 500) {
    return { valid: false, error: '할 일 내용이 너무 깁니다. 최대 500자까지 입력 가능합니다.' };
  }

  // 특수 문자만 있는지 체크 (공백, 특수문자, 이모지만 있는 경우)
  const hasValidContent = /[가-힣a-zA-Z0-9]/.test(trimmed);
  if (!hasValidContent) {
    return { valid: false, error: '할 일 내용에 유효한 문자가 포함되어야 합니다.' };
  }

  return { valid: true };
}

/**
 * 입력 텍스트 전처리 헬퍼 함수
 */
function preprocessInput(text: string): string {
  // 앞뒤 공백 제거
  let processed = text.trim();

  // 연속된 공백을 하나로 통합
  processed = processed.replace(/\s+/g, ' ');

  // 연속된 줄바꿈을 하나로 통합
  processed = processed.replace(/\n+/g, '\n');

  // 대소문자 정규화 (한국어는 영향 없음, 영어의 경우 일관성 유지)
  // 단, 고유명사를 고려하여 첫 글자만 대문자로 변환하지 않고 그대로 유지

  return processed;
}

/**
 * 생성된 할 일 데이터 후처리 헬퍼 함수
 */
function postprocessTodo(todo: GeneratedTodo, currentDate: string): GeneratedTodo {
  const processed = { ...todo };

  // 1. 제목 길이 조정
  if (processed.title) {
    processed.title = processed.title.trim();
    
    // 너무 긴 제목 자르기 (100자 초과)
    if (processed.title.length > 100) {
      processed.title = processed.title.substring(0, 97) + '...';
    }
    
    // 너무 짧은 제목 (1자) 처리
    if (processed.title.length < 2) {
      processed.title = '할 일';
    }
  } else {
    // 제목 누락 시 기본값
    processed.title = '할 일';
  }

  // 2. 설명 정리
  if (processed.description) {
    processed.description = processed.description.trim();
    // 빈 문자열이면 undefined로 변경
    if (processed.description.length === 0) {
      processed.description = undefined;
    }
  }

  // 3. 과거 날짜 체크 및 수정
  if (processed.due_date) {
    const dueDate = new Date(processed.due_date);
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    // 과거 날짜인 경우 오늘로 설정
    if (dueDate < today) {
      console.warn('[AI API] 생성된 마감일이 과거입니다. 오늘로 변경합니다:', processed.due_date);
      processed.due_date = currentDate;
    }
  }

  // 4. 우선순위 기본값 설정
  if (!processed.priority || !['low', 'medium', 'high'].includes(processed.priority)) {
    processed.priority = 'medium';
  }

  // 5. 카테고리 기본값 설정
  if (!processed.category || processed.category.length === 0) {
    processed.category = ['개인'];
  }

  // 6. 시간 형식 검증
  if (processed.due_time) {
    // HH:mm 형식 검증
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(processed.due_time)) {
      console.warn('[AI API] 잘못된 시간 형식:', processed.due_time);
      processed.due_time = '09:00'; // 기본값
    }
  }

  return processed;
}

/**
 * Gemini API를 사용하여 자연어를 구조화된 할 일 데이터로 변환하는 스키마
 */
const todoSchema = z.object({
  title: z.string().describe('할 일의 간결한 제목 (최대 100자)'),
  description: z.string().optional().describe('할 일에 대한 추가 설명이나 메모'),
  due_date: z
    .string()
    .optional()
    .describe('마감일 (YYYY-MM-DD 형식). 날짜가 언급되지 않으면 생략'),
  due_time: z
    .string()
    .optional()
    .describe('마감 시간 (HH:mm 형식, 24시간제). 시간이 명시되지 않으면 09:00 사용'),
  priority: z
    .enum(['low', 'medium', 'high'])
    .describe(
      '우선순위: high="급하게,중요한,빨리,꼭,반드시", medium="보통,적당히,키워드없음", low="여유롭게,천천히,언젠가"'
    ),
  category: z
    .array(z.enum(['업무', '개인', '건강', '학습']))
    .describe(
      '카테고리 배열: 업무="회의,보고서,프로젝트", 개인="쇼핑,친구,가족", 건강="운동,병원,요가", 학습="공부,책,강의". 여러 개 가능'
    ),
});

/**
 * POST /api/ai/generate-todo
 * 자연어 입력을 구조화된 할 일 데이터로 변환
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 본문 파싱
    const body = await request.json();
    const { prompt } = body;

    // 2. 입력 검증
    const validation = validateInput(prompt);
    if (!validation.valid) {
      return NextResponse.json<GenerateTodoResponse>(
        {
          success: false,
          error: validation.error || '잘못된 입력입니다.',
        },
        { status: 400 }
      );
    }

    // 3. 입력 전처리
    const processedPrompt = preprocessInput(prompt);

    console.log('[AI API] 입력 처리:', {
      original: prompt.substring(0, 50),
      processed: processedPrompt.substring(0, 50),
      originalLength: prompt.length,
      processedLength: processedPrompt.length,
    });

    // 4. API 키 확인
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('[AI API] GOOGLE_GENERATIVE_AI_API_KEY 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json<GenerateTodoResponse>(
        {
          success: false,
          error: 'AI 서비스 설정이 완료되지 않았습니다.',
        },
        { status: 500 }
      );
    }

    // 5. 현재 날짜/시간 정보 (한국 시간)
    const now = new Date();
    const kstOffset = 9 * 60; // UTC+9
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
    const currentDate = kstTime.toISOString().split('T')[0];
    const currentTime = kstTime.toTimeString().split(' ')[0].slice(0, 5);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayNames[kstTime.getUTCDay()];
    
    // 날짜 계산을 위한 헬퍼
    const tomorrow = new Date(kstTime);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    const dayAfterTomorrow = new Date(kstTime);
    dayAfterTomorrow.setUTCDate(dayAfterTomorrow.getUTCDate() + 2);
    const dayAfterTomorrowDate = dayAfterTomorrow.toISOString().split('T')[0];
    
    // 이번 주 금요일 계산
    const thisFriday = new Date(kstTime);
    const currentDay = thisFriday.getUTCDay();
    const daysUntilFriday = (5 - currentDay + 7) % 7;
    thisFriday.setUTCDate(thisFriday.getUTCDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    const thisFridayDate = thisFriday.toISOString().split('T')[0];
    
    // 다음 주 월요일 계산
    const nextMonday = new Date(kstTime);
    const daysUntilNextMonday = (8 - currentDay) % 7 || 7;
    nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilNextMonday);
    const nextMondayDate = nextMonday.toISOString().split('T')[0];

    // 6. Gemini API 호출
    const model = google('gemini-2.0-flash-exp', {
      apiKey,
    });

    const result = await generateObject({
      model,
      schema: todoSchema,
      prompt: `당신은 할 일 관리 전문 AI 어시스턴트입니다.
사용자가 자연어로 입력한 할 일을 분석하여 구조화된 JSON 데이터로 변환해주세요.

📅 현재 시간 정보:
- 오늘: ${currentDate} (${dayOfWeek}요일)
- 현재 시각: ${currentTime}
- 내일: ${tomorrowDate}
- 모레: ${dayAfterTomorrowDate}
- 이번 주 금요일: ${thisFridayDate}
- 다음 주 월요일: ${nextMondayDate}

📝 사용자 입력:
"${processedPrompt}"

🎯 변환 규칙 (반드시 준수):

1️⃣ 제목(title)
- 핵심 내용만 간결하게 추출
- 동사형 선호 (예: "회의 준비", "보고서 작성")

2️⃣ 설명(description)
- 추가 세부사항이나 메모가 있으면 포함
- 없으면 생략

3️⃣ 마감일(due_date) - YYYY-MM-DD 형식
날짜 표현 → 실제 날짜 변환:
- "오늘" → ${currentDate}
- "내일" → ${tomorrowDate}
- "모레" → ${dayAfterTomorrowDate}
- "이번 주 금요일" → ${thisFridayDate}
- "다음 주 월요일" → ${nextMondayDate}
- 구체적 날짜 언급 없으면 생략

4️⃣ 마감시간(due_time) - HH:mm 형식 (24시간제)
시간 표현 → 실제 시간 변환:
- "아침" → 09:00
- "점심" → 12:00
- "오후" → 14:00
- "저녁" → 18:00
- "밤" → 21:00
- "오후 3시", "15시" 등 구체적 시간은 그대로 변환
- 시간 언급 없으면 09:00 사용

5️⃣ 우선순위(priority)
키워드 기반 판단:
- high: "급하게", "중요한", "빨리", "꼭", "반드시"
- low: "여유롭게", "천천히", "언젠가"
- medium: 위 키워드 없음 또는 "보통", "적당히"

6️⃣ 카테고리(category) - 배열 형식
키워드 기반 분류 (여러 개 가능):
- 업무: "회의", "보고서", "프로젝트", "업무", "미팅", "발표"
- 개인: "쇼핑", "친구", "가족", "개인", "약속", "생일"
- 건강: "운동", "병원", "건강", "요가", "헬스", "진료"
- 학습: "공부", "책", "강의", "학습", "수업", "시험"
- 키워드 없으면 ["개인"] 기본값

📋 출력 예시:

입력: "내일 오후 3시까지 중요한 팀 회의 준비하기"
출력:
{
  "title": "팀 회의 준비",
  "due_date": "${tomorrowDate}",
  "due_time": "15:00",
  "priority": "high",
  "category": ["업무"]
}

입력: "이번 주 금요일 저녁에 친구랑 저녁 약속"
출력:
{
  "title": "친구 저녁 약속",
  "due_date": "${thisFridayDate}",
  "due_time": "18:00",
  "priority": "medium",
  "category": ["개인"]
}

입력: "언젠가 천천히 요가 강의 듣기"
출력:
{
  "title": "요가 강의 수강",
  "priority": "low",
  "category": ["건강", "학습"]
}

⚠️ 주의사항:
- 반드시 JSON 형식으로 응답
- 모든 필드는 스키마를 정확히 준수
- 날짜/시간 형식 반드시 준수 (YYYY-MM-DD, HH:mm)
- 카테고리는 배열 형식 (["업무"] 형태)`,
    });

    // 7. 결과 후처리
    const processedTodo = postprocessTodo(result.object, currentDate);

    console.log('[AI API] 생성 완료:', {
      title: processedTodo.title,
      priority: processedTodo.priority,
      category: processedTodo.category,
      due_date: processedTodo.due_date,
    });

    // 8. 결과 반환
    return NextResponse.json<GenerateTodoResponse>({
      success: true,
      data: processedTodo,
    });
  } catch (error: any) {
    console.error('[AI API] 할 일 생성 실패:', error);

    // JSON 파싱 오류
    if (error?.name === 'SyntaxError' || error?.message?.includes('JSON')) {
      return NextResponse.json<GenerateTodoResponse>(
        {
          success: false,
          error: '요청 데이터 형식이 올바르지 않습니다.',
        },
        { status: 400 }
      );
    }

    // API 키 인증 오류
    if (error?.message?.includes('API key') || error?.message?.includes('authentication')) {
      return NextResponse.json<GenerateTodoResponse>(
        {
          success: false,
          error: 'AI 서비스 인증에 실패했습니다. 관리자에게 문의해주세요.',
        },
        { status: 401 }
      );
    }

    // API 호출 한도 초과
    if (
      error?.message?.includes('quota') ||
      error?.message?.includes('rate limit') ||
      error?.message?.includes('429')
    ) {
      return NextResponse.json<GenerateTodoResponse>(
        {
          success: false,
          error: 'AI 서비스 사용량을 초과했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 429 }
      );
    }

    // 타임아웃 오류
    if (error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT') {
      return NextResponse.json<GenerateTodoResponse>(
        {
          success: false,
          error: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        },
        { status: 504 }
      );
    }

    // 네트워크 오류
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      return NextResponse.json<GenerateTodoResponse>(
        {
          success: false,
          error: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
        },
        { status: 503 }
      );
    }

    // AI 모델 오류
    if (error?.message?.includes('model') || error?.message?.includes('gemini')) {
      return NextResponse.json<GenerateTodoResponse>(
        {
          success: false,
          error: 'AI 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        },
        { status: 500 }
      );
    }

    // 기타 서버 오류
    return NextResponse.json<GenerateTodoResponse>(
      {
        success: false,
        error: '할 일 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
