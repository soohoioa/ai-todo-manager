import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 기본 메타데이터
  title: {
    default: "AI 할 일 관리 서비스",
    template: "%s | AI 할 일 관리 서비스",
  },
  description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
  
  // 키워드 (검색 엔진 최적화)
  keywords: [
    "AI 할 일 관리",
    "todo 앱",
    "할일 관리",
    "생산성 도구",
    "AI 어시스턴트",
    "스마트 플래너",
    "일정 관리",
    "태스크 관리",
  ],
  
  // 저자 및 제작자 정보
  authors: [{ name: "AI Todo Manager Team" }],
  creator: "AI Todo Manager Team",
  publisher: "AI Todo Manager",
  
  // 언어 및 지역
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
    },
  },
  
  // 로봇 크롤링 설정
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
  },
  
  // Open Graph (Facebook, LinkedIn 등)
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
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "AI 할 일 관리 서비스",
    description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
    images: ["/og-image.png"],
    creator: "@aitodomanager",
  },
  
  // 파비콘 및 아이콘
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // PWA 매니페스트
  manifest: "/manifest.json",
  
  // 앱 카테고리
  category: "productivity",
  
  // 기타 메타데이터
  applicationName: "AI 할 일 관리 서비스",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Todo",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
