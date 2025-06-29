# QClick 관리자 페이지 디자인 시스템 가이드
*Users 페이지 분석을 통한 표준 컴포넌트 작성 기준*

## 📏 레이아웃 기본 구조

### 1. 페이지 컨테이너
```css
/* 최상위 컨테이너 */
max-width: 1080px
margin: 0 auto
padding: 24px (상하좌우 통일)
background-color: white
font-weight: 300 (경량 폰트)
```

### 2. 페이지 제목 영역
```css
/* 페이지 타이틀 */
font-size: 24px (2xl)
font-weight: 300
margin-bottom: 24px
color: 검정색
```

## 🔧 컨트롤 영역 디자인

### 3. 상단 컨트롤 바
```css
/* 검색/정렬/액션 버튼 영역 */
display: flex
justify-content: space-between
align-items: center
margin-bottom: 16px
gap: 16px (요소 간 간격)
```

### 4. 검색 입력창
```css
/* 검색 필드 */
width: 300px
padding: 8px 12px
border: 1px solid #ddd
border-radius: 4px
font-weight: 300
font-size: 14px
```

### 5. 선택 박스 (정렬)
```css
/* 드롭다운 */
padding: 8px 12px
border: 1px solid #ddd
border-radius: 4px
font-weight: 300
font-size: 14px
cursor: pointer
```

### 6. 액션 버튼
```css
/* 주요 버튼 */
padding: 8px 16px
border-radius: 4px
font-weight: 300
font-size: 14px
cursor: pointer

/* 위험 버튼 (삭제/차단) */
background-color: #dc3545
color: white
border: none

/* 일반 버튼 (내보내기/저장) */
background-color: #007bff
color: white
border: none

/* 보조 버튼 (취소) */
background-color: #6c757d
color: white
border: none
```

## 📊 테이블 디자인 시스템

### 7. 테이블 컨테이너
```css
/* 테이블 래퍼 */
width: 100%
border-collapse: collapse
margin-top: 16px
```

### 8. 테이블 헤더
```css
/* thead tr th */
border: 1px solid #ddd
padding: 4px (최소 패딩)
font-weight: 300 (경량)
background-color: #f8f9fa (연한 회색)
text-align: left
font-size: 14px
```

### 9. 테이블 바디
```css
/* tbody tr td */
border: 1px solid #ddd
padding: 4px (최소 패딩)
font-weight: 300
font-size: 14px
height: 32px (행 높이 최소화)

/* 조건부 스타일 */
background-color: white (기본)
background-color: #ffe6e6 (차단된 사용자)
```

### 10. 체크박스
```css
/* 선택 체크박스 */
cursor: pointer
margin: 0
```

## 🔢 페이지네이션

### 11. 페이지 버튼
```css
/* 페이지네이션 컨테이너 */
margin-top: 20px
display: flex
justify-content: center

/* 개별 페이지 버튼 */
padding: 10px 15px
margin: 0 5px
border-radius: 5px
border: 1px solid #007bff
cursor: pointer

/* 현재 페이지 */
background-color: #007bff
color: white

/* 비활성 페이지 */
background-color: white
color: #007bff
```

## 🎨 모달 디자인

### 12. 모달 오버레이
```css
/* 배경 오버레이 */
position: fixed
top: 0, left: 0, right: 0, bottom: 0
background-color: rgba(0,0,0,0.5)
display: flex
justify-content: center
align-items: center
z-index: 50
```

### 13. 모달 컨텐츠
```css
/* 모달 박스 */
background-color: white
padding: 24px
border-radius: 8px
box-shadow: 0 4px 6px rgba(0,0,0,0.1)
max-width: 400px
width: 100%
```

## 📱 반응형 기준

### 14. 화면 크기별 조정
```css
/* 데스크톱 (기본) */
테이블: 모든 컬럼 표시
검색창: 300px

/* 태블릿 (768px 이하) */
테이블: 중요 컬럼만 표시
검색창: 200px

/* 모바일 (480px 이하) */
테이블: 카드 형태로 변경
검색창: 100% 폭
```

## 🎯 컬러 팔레트

### 15. 표준 색상
```css
/* 주요 색상 */
Primary Blue: #007bff
Success Green: #28a745
Danger Red: #dc3545
Warning Yellow: #ffc107
Secondary Gray: #6c757d

/* 배경 색상 */
White: #ffffff
Light Gray: #f8f9fa
Border Gray: #ddd
Error Background: #ffe6e6

/* 텍스트 색상 */
Black: #000000
Dark Gray: #333333
Medium Gray: #666666
Light Gray: #999999
```

## 📝 타이포그래피

### 16. 폰트 규칙
```css
/* 폰트 가족 */
font-family: Arial, sans-serif

/* 폰트 두께 */
기본: font-weight: 300 (Light)
강조: font-weight: 400 (Normal)
제목: font-weight: 600 (Semi-bold)

/* 폰트 크기 */
페이지 제목: 24px
섹션 제목: 18px
본문: 14px
작은 텍스트: 12px
```

## 🎪 애니메이션 & 인터랙션

### 17. 호버 효과
```css
/* 버튼 호버 */
transition: all 0.2s ease
hover: opacity 0.8

/* 테이블 행 호버 */
hover: background-color #f5f5f5

/* 링크 호버 */
hover: text-decoration underline
```

## 🚀 사용 방법 (AI 프롬프트용)

### 새 페이지 작성 시 참조 문구:
```
"QClick 디자인 시스템에 따라 다음 페이지를 작성해주세요:
- 최대 폭 1080px, 중앙 정렬, 패딩 24px
- 폰트 기본 두께 300, 크기 14px
- 테이블은 테두리 1px solid #ddd, 패딩 4px, 행 높이 32px
- 버튼은 패딩 8px 16px, 라운드 4px, 폰트 두께 300
- 검색창은 폭 300px, 패딩 8px 12px
- 색상은 Primary Blue #007bff, Danger Red #dc3545 사용
- 모든 요소는 경량 폰트(font-weight: 300) 적용"
```

이 가이드를 참조하여 일관된 디자인의 QClick 관리자 페이지들을 작성할 수 있습니다.
