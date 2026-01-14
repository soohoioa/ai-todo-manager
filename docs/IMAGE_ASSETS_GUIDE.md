# 이미지 에셋 생성 가이드

## 개요

AI 할 일 관리 서비스에 필요한 이미지 에셋을 생성하는 방법을 안내합니다.

## 필수 이미지 파일

### 1. 파비콘 (Favicon)

#### `favicon.ico`
- **위치**: `public/favicon.ico`
- **크기**: 16×16, 32×32 (멀티 사이즈 ICO)
- **용도**: 브라우저 탭, 북마크에 표시되는 아이콘

**생성 방법:**
```bash
# ImageMagick 사용 (설치 필요)
convert icon-512.png -resize 32x32 -define icon:auto-resize=32,16 favicon.ico
```

**온라인 도구:**
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

#### `icon.svg`
- **위치**: `public/icon.svg`
- **크기**: 벡터 (스케일 가능)
- **용도**: 모던 브라우저의 확장 가능한 파비콘

**디자인 가이드:**
- 단순하고 명확한 형태
- 브랜드 컬러 사용: `#8B5CF6` (Vibrant Purple)
- 흰색 또는 투명 배경

**예시 SVG 템플릿:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#8B5CF6"/>
  <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### 2. Apple Touch Icon

#### `apple-icon.png`
- **위치**: `public/apple-icon.png`
- **크기**: 180×180 픽셀
- **형식**: PNG
- **용도**: iOS 홈 화면에 추가할 때 표시되는 아이콘

**디자인 가이드:**
- 모서리를 둥글게 처리하지 않음 (iOS가 자동으로 처리)
- 패딩 없이 전체 영역 사용
- 고해상도 디스플레이 대응

### 3. Open Graph 이미지

#### `og-image.png`
- **위치**: `public/og-image.png`
- **크기**: 1200×630 픽셀
- **형식**: PNG 또는 JPG
- **용도**: Facebook, LinkedIn, KakaoTalk 등 소셜 미디어 공유 시 표시

**디자인 가이드:**
- **안전 영역**: 중앙 1200×600 영역에 주요 콘텐츠 배치
- **텍스트 크기**: 최소 60px 이상 (가독성)
- **브랜딩**: 로고 및 서비스명 포함
- **배경**: 브랜드 컬러 그라디언트 또는 패턴

**권장 레이아웃:**
```
┌─────────────────────────────────┐
│                                 │
│         [로고/아이콘]             │
│                                 │
│    AI 할 일 관리 서비스          │
│                                 │
│  AI가 도와주는 똑똑한 할 일 관리  │
│                                 │
│         [주요 기능 아이콘]        │
│                                 │
└─────────────────────────────────┘
```

**생성 도구:**
- [Canva](https://www.canva.com/) - OG 이미지 템플릿
- [Figma](https://www.figma.com/) - 전문 디자인
- [Adobe Express](https://www.adobe.com/express/) - 빠른 생성

### 4. PWA 아이콘

#### `icon-192.png`
- **위치**: `public/icon-192.png`
- **크기**: 192×192 픽셀
- **형식**: PNG
- **용도**: Android 홈 화면 아이콘 (저해상도)

#### `icon-512.png`
- **위치**: `public/icon-512.png`
- **크기**: 512×512 픽셀
- **형식**: PNG
- **용도**: Android 홈 화면 아이콘 (고해상도), 스플래시 스크린

**디자인 가이드:**
- **패딩**: 상하좌우 10% 여백 권장
- **배경**: 흰색 또는 브랜드 컬러
- **심볼**: 명확하고 단순한 형태
- **마스킹**: Android의 다양한 아이콘 모양에 대응

**Maskable Icon 테스트:**
- [Maskable.app](https://maskable.app/)

## 선택 이미지 파일

### 5. 스크린샷

#### `screenshot-mobile.png`
- **위치**: `public/screenshot-mobile.png`
- **크기**: 390×844 픽셀 (iPhone 13 기준)
- **형식**: PNG
- **용도**: PWA 설치 프롬프트, 앱 스토어 미리보기

#### `screenshot-desktop.png`
- **위치**: `public/screenshot-desktop.png`
- **크기**: 1920×1080 픽셀
- **형식**: PNG
- **용도**: 데스크톱 PWA 미리보기

**스크린샷 캡처 방법:**
1. 실제 앱 화면 캡처 (Chrome DevTools 사용)
2. 프레임 추가 (선택사항)
3. 배경 추가 또는 그림자 효과

### 6. Shortcut 아이콘

#### `icon-add.png`
- **크기**: 96×96 픽셀
- **용도**: "새 할 일 추가" 단축키 아이콘

#### `icon-today.png`
- **크기**: 96×96 픽셀
- **용도**: "오늘의 할 일" 단축키 아이콘

## 이미지 최적화

### 압축

**PNG 압축:**
```bash
# pngquant 사용
pngquant --quality=65-80 icon-512.png
```

**JPG 압축:**
```bash
# ImageMagick 사용
convert og-image.png -quality 85 og-image.jpg
```

**온라인 도구:**
- [TinyPNG](https://tinypng.com/)
- [Squoosh](https://squoosh.app/)
- [ImageOptim](https://imageoptim.com/) (Mac)

### WebP 변환

```bash
# cwebp 사용
cwebp -q 80 og-image.png -o og-image.webp
```

## 이미지 생성 워크플로우

### 1. 디자인 준비
1. 브랜드 컬러 확정: `#8B5CF6` (Primary)
2. 로고 또는 심볼 디자인
3. 타이포그래피 선정

### 2. 기본 아이콘 생성 (512×512)
- Figma, Sketch, Illustrator 등에서 디자인
- 512×512 PNG로 내보내기
- 이 파일을 기준으로 다른 크기 생성

### 3. 크기별 리사이징
```bash
# ImageMagick 설치 (Mac)
brew install imagemagick

# 자동 리사이징 스크립트
convert icon-512.png -resize 192x192 icon-192.png
convert icon-512.png -resize 180x180 apple-icon.png
convert icon-512.png -resize 96x96 icon-add.png
convert icon-512.png -resize 96x96 icon-today.png
```

### 4. OG 이미지 생성
- 1200×630 템플릿 사용
- Canva 또는 Figma에서 디자인
- PNG로 내보내기

### 5. 파비콘 생성
```bash
# 512×512 PNG로부터 favicon.ico 생성
convert icon-512.png -resize 32x32 -define icon:auto-resize=32,16 favicon.ico
```

### 6. SVG 아이콘 생성
- Figma 또는 Illustrator에서 벡터 디자인
- SVG로 내보내기
- SVGO로 최적화

```bash
# SVGO 설치 및 최적화
npm install -g svgo
svgo icon.svg -o icon-optimized.svg
```

## 색상 팔레트

서비스의 브랜드 컬러를 이미지 디자인에 활용하세요:

```css
Primary: #8B5CF6 (Vibrant Purple)
Secondary: #F97316 (Orange)
Accent: #06B6D4 (Cyan)
Success: #10B981 (Green)
Warning: #F59E0B (Yellow)
Error: #EF4444 (Red)
Background: #FFFFFF (White)
Foreground: #0A0A0A (Near Black)
```

## Figma 템플릿

### 아이콘 템플릿
```
프레임: 512×512px
패딩: 51px (10%)
아이콘 영역: 410×410px
배경: #8B5CF6
심볼: #FFFFFF
```

### OG 이미지 템플릿
```
프레임: 1200×630px
안전 영역: 1200×600px (중앙)
배경: 그라디언트 (#8B5CF6 → #6366F1)
텍스트: 60px 이상, 흰색
```

## 자동화 스크립트

### generate-icons.sh
```bash
#!/bin/bash

# 기본 512×512 이미지 필요
SOURCE="source-icon.png"

# PWA 아이콘
convert $SOURCE -resize 192x192 public/icon-192.png
convert $SOURCE -resize 512x512 public/icon-512.png

# Apple Touch Icon
convert $SOURCE -resize 180x180 public/apple-icon.png

# Favicon
convert $SOURCE -resize 32x32 -define icon:auto-resize=32,16 public/favicon.ico

# Shortcut 아이콘
convert $SOURCE -resize 96x96 public/icon-add.png
convert $SOURCE -resize 96x96 public/icon-today.png

echo "✅ All icons generated successfully!"
```

**사용 방법:**
```bash
chmod +x generate-icons.sh
./generate-icons.sh
```

## 체크리스트

이미지 에셋 준비가 완료되었는지 확인하세요:

### 필수 파일
- [ ] `public/favicon.ico` - 기본 파비콘
- [ ] `public/icon.svg` - SVG 파비콘
- [ ] `public/apple-icon.png` - iOS 아이콘 (180×180)
- [ ] `public/og-image.png` - OG 이미지 (1200×630)
- [ ] `public/icon-192.png` - PWA 아이콘 (192×192)
- [ ] `public/icon-512.png` - PWA 아이콘 (512×512)

### 선택 파일
- [ ] `public/screenshot-mobile.png` - 모바일 스크린샷
- [ ] `public/screenshot-desktop.png` - 데스크톱 스크린샷
- [ ] `public/icon-add.png` - 추가 단축키 아이콘
- [ ] `public/icon-today.png` - 오늘 단축키 아이콘

### 최적화
- [ ] 모든 이미지 압축 완료
- [ ] 파일 크기 확인 (OG 이미지 < 1MB)
- [ ] 고해상도 디스플레이 테스트
- [ ] 다크 모드 대응 확인 (선택)

## 참고 자료

- [Web App Manifest Icons](https://web.dev/add-manifest/#icons)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Open Graph Image Guidelines](https://ogp.me/)
- [Favicon Generator](https://realfavicongenerator.net/)
- [Maskable Icon Guide](https://web.dev/maskable-icon/)

## 디자인 리소스

### 무료 아이콘 라이브러리
- [Lucide Icons](https://lucide.dev/) - 현재 프로젝트에서 사용 중
- [Heroicons](https://heroicons.com/)
- [Feather Icons](https://feathericons.com/)

### 디자인 도구
- [Figma](https://www.figma.com/) - 무료 웹 기반 디자인 도구
- [Canva](https://www.canva.com/) - 빠른 OG 이미지 생성
- [GIMP](https://www.gimp.org/) - 무료 이미지 편집 도구

## 문의

이미지 에셋 생성에 어려움이 있다면 다음을 확인하세요:
1. 브랜드 가이드라인 문서
2. 디자인 시스템 문서
3. 기존 에셋 파일 참고
