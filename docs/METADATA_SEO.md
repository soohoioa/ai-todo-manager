# 메타데이터 및 SEO 설정

## 개요

AI 할 일 관리 서비스는 검색 엔진 최적화(SEO)와 소셜 미디어 공유 최적화를 위해 Next.js 15의 Metadata API를 활용합니다.

## 메타데이터 구성

### 1. 기본 메타데이터

```typescript
title: {
  default: "AI 할 일 관리 서비스",
  template: "%s | AI 할 일 관리 서비스",
}
description: "AI가 도와주는 똑똑한 할 일 관리 서비스"
```

**특징:**
- **동적 타이틀**: 페이지별로 타이틀을 설정할 수 있으며, 템플릿에 따라 자동으로 포맷됩니다.
- **명확한 설명**: 서비스의 핵심 가치를 간결하게 전달합니다.

### 2. 검색 엔진 최적화 (SEO)

#### 키워드
```typescript
keywords: [
  "AI 할 일 관리",
  "todo 앱",
  "할일 관리",
  "생산성 도구",
  "AI 어시스턴트",
  "스마트 플래너",
  "일정 관리",
  "태스크 관리",
]
```

**목적:**
- 검색 엔진이 페이지의 주제를 이해하는 데 도움
- 관련 검색어로 유입 증가

#### 로봇 크롤링 설정
```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
}
```

**설정 의미:**
- `index: true`: 검색 결과에 표시 허용
- `follow: true`: 페이지 내 링크 크롤링 허용
- `max-image-preview: "large"`: 큰 이미지 미리보기 허용
- `max-snippet: -1`: 텍스트 스니펫 길이 제한 없음

#### Canonical URL
```typescript
alternates: {
  canonical: "/",
  languages: {
    "ko-KR": "/",
  },
}
```

**목적:**
- 중복 콘텐츠 방지
- 기본 URL 명시

### 3. Open Graph (OG) 태그

Facebook, LinkedIn, KakaoTalk 등에서 링크 공유 시 사용됩니다.

```typescript
openGraph: {
  type: "website",
  locale: "ko_KR",
  url: "/",
  siteName: "AI 할 일 관리 서비스",
  title: "AI 할 일 관리 서비스",
  description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "AI 할 일 관리 서비스",
    },
  ],
}
```

**권장 이미지 사양:**
- 크기: 1200 × 630 픽셀
- 형식: PNG 또는 JPG
- 파일명: `og-image.png`
- 위치: `public/og-image.png`

### 4. Twitter Card

Twitter/X에서 링크 공유 시 사용됩니다.

```typescript
twitter: {
  card: "summary_large_image",
  title: "AI 할 일 관리 서비스",
  description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
  images: ["/og-image.png"],
  creator: "@aitodomanager",
}
```

**카드 타입:**
- `summary_large_image`: 큰 이미지와 함께 표시
- `summary`: 작은 이미지와 함께 표시

### 5. 파비콘 및 아이콘

```typescript
icons: {
  icon: [
    { url: "/favicon.ico", sizes: "any" },
    { url: "/icon.svg", type: "image/svg+xml" },
  ],
  apple: [
    { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  ],
}
```

**필요한 아이콘 파일:**
- `public/favicon.ico`: 기본 파비콘 (16×16, 32×32)
- `public/icon.svg`: SVG 파비콘 (모든 크기 지원)
- `public/apple-icon.png`: iOS 홈 화면 아이콘 (180×180)

### 6. PWA (Progressive Web App) 설정

```typescript
manifest: "/manifest.json"
applicationName: "AI 할 일 관리 서비스"
appleWebApp: {
  capable: true,
  statusBarStyle: "default",
  title: "AI Todo",
}
```

**manifest.json 위치:** `public/manifest.json`

## PWA Manifest 설정

### manifest.json 구조

```json
{
  "name": "AI 할 일 관리 서비스",
  "short_name": "AI Todo",
  "description": "AI가 도와주는 똑똑한 할 일 관리 서비스",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8B5CF6",
  "orientation": "portrait",
  "categories": ["productivity", "lifestyle"],
  "lang": "ko-KR"
}
```

### PWA 아이콘

**필요한 아이콘 크기:**
- `icon-192.png`: 192 × 192 픽셀
- `icon-512.png`: 512 × 512 픽셀

**아이콘 생성 팁:**
- 단순하고 명확한 디자인
- 브랜드 컬러 사용 (#8B5CF6 - Vibrant Purple)
- 투명 배경 또는 흰색 배경

### PWA 단축키 (Shortcuts)

```json
"shortcuts": [
  {
    "name": "새 할 일 추가",
    "short_name": "추가",
    "url": "/?action=new"
  },
  {
    "name": "오늘의 할 일",
    "short_name": "오늘",
    "url": "/?filter=today"
  }
]
```

**기능:**
- 앱 아이콘 길게 누르면 표시되는 빠른 실행 메뉴
- 자주 사용하는 기능에 빠르게 접근

## 이미지 에셋 체크리스트

### 필수 이미지 파일

- [ ] `/public/favicon.ico` - 기본 파비콘
- [ ] `/public/icon.svg` - SVG 파비콘
- [ ] `/public/apple-icon.png` - iOS 아이콘 (180×180)
- [ ] `/public/og-image.png` - OG 이미지 (1200×630)
- [ ] `/public/icon-192.png` - PWA 아이콘 (192×192)
- [ ] `/public/icon-512.png` - PWA 아이콘 (512×512)

### 선택 이미지 파일

- [ ] `/public/screenshot-mobile.png` - 모바일 스크린샷 (390×844)
- [ ] `/public/screenshot-desktop.png` - 데스크톱 스크린샷 (1920×1080)
- [ ] `/public/icon-add.png` - 추가 단축키 아이콘 (96×96)
- [ ] `/public/icon-today.png` - 오늘 단축키 아이콘 (96×96)

## 페이지별 메타데이터 설정

### 동적 페이지 메타데이터 예시

```typescript
// app/login/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "AI 할 일 관리 서비스에 로그인하세요",
  openGraph: {
    title: "로그인 | AI 할 일 관리 서비스",
    description: "AI 할 일 관리 서비스에 로그인하세요",
  },
};
```

### 메타데이터 우선순위

1. **페이지 레벨 메타데이터** (가장 높은 우선순위)
2. **레이아웃 메타데이터** (현재 설정)
3. **상위 레이아웃 메타데이터**

## SEO 모범 사례

### 1. 타이틀 최적화
- **길이**: 50-60자 이내
- **키워드**: 핵심 키워드를 앞쪽에 배치
- **브랜드**: 브랜드 이름 포함

### 2. 설명(Description) 최적화
- **길이**: 150-160자 이내
- **행동 유도**: 사용자가 클릭하고 싶게 만드는 문구
- **키워드**: 자연스럽게 키워드 포함

### 3. 이미지 최적화
- **alt 텍스트**: 모든 이미지에 의미 있는 alt 텍스트 추가
- **파일명**: 설명적인 파일명 사용
- **압축**: 이미지 파일 크기 최소화

### 4. 구조화된 데이터 (JSON-LD)

향후 추가 예정:
- WebApplication Schema
- Organization Schema
- BreadcrumbList Schema

## 검증 도구

### 1. Google Search Console
- 사이트맵 제출
- 색인 생성 요청
- 검색 성능 모니터링

### 2. 소셜 미디어 검증
- **Facebook**: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter**: [Card Validator](https://cards-dev.twitter.com/validator)
- **LinkedIn**: [Post Inspector](https://www.linkedin.com/post-inspector/)

### 3. PWA 검증
- Chrome DevTools > Application > Manifest
- Lighthouse 감사 실행

### 4. 메타 태그 검증
```bash
# 메타 태그 확인
curl -s https://your-domain.com | grep -i meta

# Open Graph 태그 확인
curl -s https://your-domain.com | grep -i "og:"
```

## 성능 최적화

### Next.js 15 자동 최적화
- 메타데이터는 서버에서 렌더링
- 중복 태그 자동 제거
- 자동 viewport 설정

### 추가 최적화 팁
1. **동적 Import**: 메타데이터는 정적으로 유지
2. **캐싱**: CDN을 통한 이미지 에셋 캐싱
3. **지연 로딩**: OG 이미지는 필요시에만 생성

## 문제 해결

### 메타 태그가 표시되지 않을 때
1. 브라우저 캐시 삭제
2. 개발 서버 재시작
3. 빌드 후 프로덕션 모드에서 확인

### OG 이미지가 표시되지 않을 때
1. 이미지 파일 경로 확인
2. 이미지 크기 및 형식 확인
3. 소셜 미디어 캐시 초기화

### PWA가 설치되지 않을 때
1. HTTPS 연결 확인
2. manifest.json 유효성 검사
3. 모든 필수 아이콘 파일 존재 확인

## 참고 자료

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Google Search Central](https://developers.google.com/search)

## 다음 단계

- [ ] OG 이미지 디자인 및 생성
- [ ] PWA 아이콘 디자인 및 생성
- [ ] 페이지별 메타데이터 추가
- [ ] 구조화된 데이터 (Schema.org) 추가
- [ ] 사이트맵 (sitemap.xml) 생성
- [ ] robots.txt 설정
- [ ] Google Analytics 연동
- [ ] Google Search Console 등록
