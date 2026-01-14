-- ============================================
-- AI Todo 관리 서비스 - Supabase 스키마
-- ============================================
-- 작성일: 2026-01-04
-- 설명: 사용자 프로필 및 할 일 관리를 위한 데이터베이스 스키마
-- ============================================

-- ============================================
-- 1. 사용자 프로필 테이블 (public.users)
-- ============================================
-- auth.users와 1:1 관계를 가지는 사용자 프로필 테이블

CREATE TABLE IF NOT EXISTS public.users (
  -- 기본 키: auth.users.id와 동일한 UUID 사용
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 사용자 정보
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 사용자 프로필 테이블 코멘트
COMMENT ON TABLE public.users IS '사용자 프로필 정보 (auth.users와 1:1)';
COMMENT ON COLUMN public.users.id IS 'auth.users.id와 동일한 사용자 고유 ID';
COMMENT ON COLUMN public.users.email IS '사용자 이메일 주소';
COMMENT ON COLUMN public.users.name IS '사용자 이름';
COMMENT ON COLUMN public.users.avatar_url IS '프로필 이미지 URL';

-- ============================================
-- 2. 할 일 관리 테이블 (public.todos)
-- ============================================
-- 각 사용자별 할 일을 관리하는 테이블

CREATE TABLE IF NOT EXISTS public.todos (
  -- 기본 키
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 외래 키: 사용자 ID
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- 할 일 정보
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  description TEXT,
  
  -- 우선순위 (low, medium, high)
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- 카테고리 배열
  category TEXT[] DEFAULT '{}',
  
  -- 완료 여부
  completed BOOLEAN NOT NULL DEFAULT false,
  
  -- 타임스탬프
  created_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 할 일 테이블 코멘트
COMMENT ON TABLE public.todos IS '사용자별 할 일 관리 테이블';
COMMENT ON COLUMN public.todos.id IS '할 일 고유 ID';
COMMENT ON COLUMN public.todos.user_id IS '소유자 사용자 ID';
COMMENT ON COLUMN public.todos.title IS '할 일 제목 (필수, 1-200자)';
COMMENT ON COLUMN public.todos.description IS '할 일 상세 설명';
COMMENT ON COLUMN public.todos.priority IS '우선순위 (low, medium, high)';
COMMENT ON COLUMN public.todos.category IS '카테고리 배열';
COMMENT ON COLUMN public.todos.completed IS '완료 여부';
COMMENT ON COLUMN public.todos.created_date IS '생성 일시';
COMMENT ON COLUMN public.todos.due_date IS '마감 일시';

-- ============================================
-- 3. 인덱스 생성
-- ============================================

-- 사용자 이메일 인덱스 (로그인 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 할 일 테이블 인덱스 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_created_date ON public.todos(created_date DESC);

-- 복합 인덱스: 사용자별 완료 상태 조회
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON public.todos(user_id, completed);

-- GIN 인덱스: 카테고리 배열 검색
CREATE INDEX IF NOT EXISTS idx_todos_category ON public.todos USING GIN(category);

-- 전문 검색 인덱스: 제목과 설명 검색
CREATE INDEX IF NOT EXISTS idx_todos_search ON public.todos USING GIN(
  to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- ============================================
-- 4. RLS (Row Level Security) 활성화
-- ============================================

-- users 테이블 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- todos 테이블 RLS 활성화
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS 정책 - public.users
-- ============================================

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 6. RLS 정책 - public.todos
-- ============================================

-- 사용자는 자신의 할 일만 조회 가능
CREATE POLICY "Users can view their own todos"
  ON public.todos
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 생성 가능
CREATE POLICY "Users can create their own todos"
  ON public.todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 수정 가능
CREATE POLICY "Users can update their own todos"
  ON public.todos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 삭제 가능
CREATE POLICY "Users can delete their own todos"
  ON public.todos
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. 트리거 함수 - updated_at 자동 업데이트
-- ============================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블 updated_at 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- todos 테이블 updated_at 트리거
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. 트리거 함수 - 신규 사용자 프로필 자동 생성
-- ============================================

-- 신규 사용자 가입 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 신규 사용자 생성 시 트리거 실행
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 9. 샘플 데이터 삽입 함수 (선택사항)
-- ============================================

-- 개발 및 테스트를 위한 샘플 데이터 생성 함수
CREATE OR REPLACE FUNCTION public.create_sample_todos(
  p_user_id UUID,
  p_count INTEGER DEFAULT 5
)
RETURNS VOID AS $$
DECLARE
  i INTEGER;
  priorities TEXT[] := ARRAY['low', 'medium', 'high'];
  categories TEXT[][] := ARRAY[
    ARRAY['업무', '기획'],
    ARRAY['개발', '학습'],
    ARRAY['개인', '건강'],
    ARRAY['업무', '회의']
  ];
BEGIN
  FOR i IN 1..p_count LOOP
    INSERT INTO public.todos (
      user_id,
      title,
      description,
      priority,
      category,
      completed,
      due_date
    ) VALUES (
      p_user_id,
      '샘플 할 일 ' || i,
      '이것은 샘플 할 일 설명입니다.',
      priorities[1 + (i % 3)],
      categories[1 + (i % 4)],
      (i % 3 = 0),
      CASE WHEN i % 2 = 0 THEN NOW() + (i || ' days')::INTERVAL ELSE NULL END
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. 유용한 뷰 (선택사항)
-- ============================================

-- 사용자별 할 일 통계 뷰
CREATE OR REPLACE VIEW public.user_todo_stats AS
SELECT
  user_id,
  COUNT(*) AS total_todos,
  COUNT(*) FILTER (WHERE completed = true) AS completed_todos,
  COUNT(*) FILTER (WHERE completed = false) AS active_todos,
  COUNT(*) FILTER (WHERE priority = 'high' AND completed = false) AS high_priority_todos,
  COUNT(*) FILTER (WHERE due_date < NOW() AND completed = false) AS overdue_todos
FROM public.todos
GROUP BY user_id;

-- 뷰 코멘트
COMMENT ON VIEW public.user_todo_stats IS '사용자별 할 일 통계';

-- ============================================
-- 실행 완료
-- ============================================

-- 스키마 버전 정보 저장 (선택사항)
CREATE TABLE IF NOT EXISTS public.schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  description TEXT
);

INSERT INTO public.schema_version (version, description)
VALUES ('1.0.0', 'AI Todo 관리 서비스 초기 스키마')
ON CONFLICT (version) DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ AI Todo 관리 서비스 스키마가 성공적으로 생성되었습니다.';
  RAISE NOTICE '📋 생성된 테이블: public.users, public.todos';
  RAISE NOTICE '🔒 RLS 정책이 활성화되었습니다.';
  RAISE NOTICE '🚀 이제 애플리케이션에서 사용할 수 있습니다.';
END $$;

