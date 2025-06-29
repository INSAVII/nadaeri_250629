/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // 프로젝트 전용 색상 팔레트
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // 서비스별 전용 색상
        qcapture: {
          light: '#dbeafe',
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },
        qtext: {
          light: '#d1fae5',
          DEFAULT: '#10b981',
          dark: '#047857',
        },
        qname: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        }
      },
      
      // 프로젝트 표준 폰트
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      
      // 프로젝트 표준 폰트 가중치
      fontWeight: {
        'light': '300',    // 프로젝트 기본
        'normal': '400',   
        'medium': '500',   // 강조용
        'semibold': '600', // 제목용
        'bold': '700',     // 특별 강조용
      },
      
      // 프로젝트 표준 폭 정의
      maxWidth: {
        'content': '1080px',           // 프로젝트 표준 폭
        'qc': '1080px',               // 프로젝트 전용 alias
        '[1080px]': '1080px',         // 임의값 지원
        'compact': '960px',           // 좁은 레이아웃용
        'wide': '1200px',            // 특별히 넓은 레이아웃용
      },
      
      // 프로젝트 표준 간격
      spacing: {
        'compact': '0.75rem',         // 조밀한 간격
        'comfortable': '1rem',        // 편안한 간격
        'loose': '1.5rem',           // 여유있는 간격
        'header': '60px',            // 헤더 높이
      },
      
      // 프로젝트 표준 행간
      lineHeight: {
        'compact': '1.4',            // 프로젝트 기본
        'comfortable': '1.6',        // 읽기 편한 텍스트용
        'loose': '1.8',             // 긴 텍스트용
      },
      
      // 프로젝트 표준 자간
      letterSpacing: {
        'compact': '-0.01em',        // 프로젝트 기본
        'normal': '0',              
        'loose': '0.01em',          
      },
      
      // 프로젝트 표준 그림자
      boxShadow: {
        'qc-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'qc': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'qc-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'qc-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      
      // 프로젝트 표준 둥근 모서리
      borderRadius: {
        'qc-sm': '0.25rem',
        'qc': '0.375rem',
        'qc-md': '0.5rem',
        'qc-lg': '0.75rem',
      },
      
      // 프로젝트 표준 애니메이션
      transitionDuration: {
        'qc': '200ms',              // 프로젝트 기본
        'qc-fast': '150ms',         // 빠른 전환
        'qc-slow': '300ms',         // 느린 전환
      },
      
      // 프로젝트 Z-index 관리
      zIndex: {
        'dropdown': '50',
        'modal': '100',
        'tooltip': '150',
        'notification': '200',
      }
    },
  },
  
  // 프로젝트 표준 유틸리티 추가
  plugins: [
    // 커스텀 유틸리티 추가
    function({ addUtilities }) {
      addUtilities({
        '.qc-container': {
          'max-width': '1080px',
          'margin-left': 'auto',
          'margin-right': 'auto',
          'padding-left': '1rem',
          'padding-right': '1rem',
          'font-weight': '300',
        },
        '.qc-text-compact': {
          'line-height': '1.4',
          'letter-spacing': '-0.01em',
        },
        '.qc-text-comfortable': {
          'line-height': '1.6',
          'letter-spacing': '0',
        },
      })
    }
  ],
    // 중요: CSS 계층 순서 보장 및 기본 스타일 활성화
  corePlugins: {
    preflight: true,              // Tailwind 기본 리셋 활성화
    container: false,             // 기본 container 비활성화 (qc-container 사용)
  },
  
  // 프로젝트 전용 설정
  important: false,               // 전역 !important 비활성화 (선택적 사용)
}
