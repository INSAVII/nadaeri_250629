# 스타일 우선순위 체계 및 충돌 방지 가이드

## 개요

이 문서는 프로젝트에서 강제 스타일(!important)의 남용을 방지하고, Tailwind CSS와 커스텀 CSS 간의 우선순위 충돌을 체계적으로 해결하기 위한 가이드입니다.

## 스타일 적용 우선순위 계층

### 1. CSS 우선순위 원칙
```
1. 인라인 스타일 (style 속성)
2. ID 선택자 (#id)
3. 클래스 선택자 (.class)
4. 요소 선택자 (div, span 등)
5. !important 규칙 (최후 수단)
```

### 2. Tailwind CSS Layer 순서
```css
@tailwind base;      /* 1. 기본 스타일 (HTML 요소 기본값) */
@tailwind components; /* 2. 컴포넌트 스타일 */
@tailwind utilities;  /* 3. 유틸리티 클래스 (가장 높은 우선순위) */
```

### 3. 프로젝트 스타일 계층 구조

#### Layer 1: Base (@layer base)
- HTML 요소의 기본 스타일
- CSS Reset 보완
- 프로젝트 전역 기본값

```css
@layer base {
  html, body {
    font-family: Arial, Helvetica, sans-serif;
    font-weight: 300; /* 프로젝트 기본: font-light */
    line-height: 1.4; /* 프로젝트 기본: 조밀한 행간 */
  }
}
```

#### Layer 2: Components (@layer components)
- 재사용 가능한 컴포넌트 스타일
- 프로젝트 전용 UI 패턴

```css
@layer components {
  .qc-container {
    max-width: 1080px; /* 프로젝트 핵심 요구사항 */
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .qc-btn {
    display: inline-flex;
    align-items: center;
    /* ... */
  }
}
```

#### Layer 3: Utilities (@layer utilities)
- Tailwind 유틸리티 보완
- 프로젝트 전용 유틸리티

```css
@layer utilities {
  .qc-w-content {
    max-width: 1080px;
  }
  
  .qc-font-light {
    font-weight: 300;
  }
}
```

#### Layer 4: 커스텀 컴포넌트 (Tailwind 이후)
- 복잡한 인터랙션 스타일
- 애니메이션 및 전환 효과

```css
.service-icon-wrapper {
  transition: transform 0.2s ease-in-out;
}

.service-icon-wrapper:hover {
  transform: scale(1.05);
}
```

#### Layer 5: 강제 스타일 (!important 최소화)
- 프로젝트 핵심 요구사항만 적용
- 외부 라이브러리 충돌 해결용

```css
.force-max-width {
  max-width: 1080px !important;
}
```

## 충돌 방지 전략

### 1. 네이밍 컨벤션

#### 프로젝트 전용 클래스: `qc-` prefix 사용
```css
.qc-container    /* ✅ 권장 */
.qc-btn         /* ✅ 권장 */
.qc-input       /* ✅ 권장 */
.qc-table       /* ✅ 권장 */
```

#### Tailwind 클래스와 구분
```css
/* ❌ 피하기: Tailwind와 동일한 패턴 */
.container
.btn
.input

/* ✅ 권장: 프로젝트 전용 prefix */
.qc-container
.qc-btn
.qc-input
```

### 2. 구체성(Specificity) 활용

#### 높은 구체성으로 우선순위 확보
```css
/* 낮은 구체성 */
.btn { }

/* 높은 구체성 */
.qc-container .qc-btn { }
.page-container .qc-btn { }

/* 더 높은 구체성 */
.qc-container .qc-btn.qc-btn-primary { }
```

### 3. CSS Variable 활용

#### 프로젝트 표준값 정의
```css
:root {
  --qc-max-width: 1080px;
  --qc-font-weight: 300;
  --qc-line-height: 1.4;
  --qc-letter-spacing: -0.01em;
}

.qc-container {
  max-width: var(--qc-max-width);
  font-weight: var(--qc-font-weight);
}
```

## 클래스 사용 가이드

### 1. 컨테이너 클래스

```jsx
// ✅ 권장: 새로운 qc- prefix 클래스
<div className="qc-container">

// ✅ 호환성: 기존 클래스 유지
<div className="page-container">

// ✅ 강제 적용이 필요한 경우
<div className="qc-container force-max-width">
```

### 2. 버튼 클래스

```jsx
// ✅ 프로젝트 표준 버튼
<button className="qc-btn qc-btn-primary">

// ✅ 텍스트 버튼 (네비게이션용)
<button className="qc-btn qc-btn-text">

// ❌ 피하기: Tailwind와 혼재
<button className="qc-btn bg-blue-500 hover:bg-blue-700">
```

### 3. 입력 필드 클래스

```jsx
// ✅ 프로젝트 표준 입력
<input className="qc-input" />

// ✅ 프로젝트 표준 선택
<select className="qc-select">
```

### 4. 테이블 클래스

```jsx
// ✅ 프로젝트 표준 테이블
<table className="qc-table">
  <thead>
    <tr>
      <th>헤더</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>데이터</td>
    </tr>
  </tbody>
</table>
```

## 문제 해결 방법

### 1. Tailwind 클래스가 적용되지 않는 경우

#### 원인: 커스텀 CSS의 높은 구체성
```css
/* 문제 상황 */
.custom-component {
  background-color: red; /* Tailwind의 bg-blue-500를 덮어씀 */
}
```

#### 해결방법 1: 더 구체적인 선택자 사용
```jsx
<div className="qc-container">
  <div className="bg-blue-500"> {/* 더 높은 구체성 확보 */}
```

#### 해결방법 2: Tailwind의 !important 변형 사용
```jsx
<div className="!bg-blue-500"> {/* ! prefix로 강제 적용 */}
```

#### 해결방법 3: CSS 수정
```css
.custom-component {
  /* background-color 제거하거나 더 구체적으로 지정 */
}

.custom-component.specific-case {
  background-color: red;
}
```

### 2. 프로젝트 표준이 적용되지 않는 경우

#### 강제 적용 클래스 사용
```jsx
<div className="qc-container force-max-width force-font-light">
```

#### CSS Variable 재정의
```css
.special-component {
  --qc-max-width: 1200px; /* 특별한 경우만 예외 처리 */
}
```

### 3. 외부 라이브러리 충돌

#### 더 구체적인 선택자로 덮어쓰기
```css
.my-app .external-lib-class {
  /* 외부 라이브러리 스타일 덮어쓰기 */
}
```

#### CSS Module 또는 CSS-in-JS 고려
```jsx
// CSS Module 사용 시
import styles from './Component.module.css';

<div className={`${styles.component} qc-container`}>
```

## 유지보수 가이드

### 1. 새로운 컴포넌트 추가 시

1. `qc-` prefix 사용
2. @layer components에 정의
3. 필요시 utilities layer에 유틸리티 추가
4. !important는 최후 수단으로만 사용

### 2. 스타일 충돌 발생 시

1. 브라우저 개발자 도구로 우선순위 확인
2. 구체성 높이기 시도
3. 네이밍 컨벤션 확인
4. 최후 수단으로 !important 사용

### 3. 성능 최적화

1. 불필요한 !important 제거
2. 중복 스타일 통합
3. CSS Variable 활용도 높이기

## 체크리스트

### 스타일 추가 전 확인사항

- [ ] `qc-` prefix 사용했는가?
- [ ] 적절한 layer에 정의했는가?
- [ ] 기존 클래스와 중복되지 않는가?
- [ ] !important 없이 해결 가능한가?
- [ ] 프로젝트 표준(1080px, font-light)을 준수하는가?

### 충돌 해결 시 확인사항

- [ ] 브라우저 개발자 도구로 우선순위 확인했는가?
- [ ] 더 구체적인 선택자로 해결 시도했는가?
- [ ] CSS Variable 활용을 고려했는가?
- [ ] !important는 정말 필요한가?

이 가이드를 따르면 강제 스타일(!important)을 최소화하고 반복적인 충돌을 방지할 수 있습니다.
