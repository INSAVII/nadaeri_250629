# 🎯 버튼 스타일 가이드

## 📋 개요
이 프로젝트에서는 **패딩 없는 문자 버튼**을 표준으로 사용합니다. 깔끔하고 미니멀한 디자인으로 사용자 경험을 향상시킵니다.

## 🎨 버튼 스타일 특징

### ✅ 표준 스타일 (패딩 없는 문자 버튼)
- **패딩**: 없음 (`padding: 0`)
- **배경**: 투명 (`background-color: transparent`)
- **테두리**: 없음 (`border: 0`)
- **호버 효과**: 색상만 변경
- **포커스**: 아웃라인 없음

### ❌ 사용하지 않는 스타일 (패딩 있는 버튼)
- **패딩**: 있음 (`px-4 py-2`)
- **배경**: 색상 있음
- **테두리**: 둥근 모서리
- **호버 효과**: 배경색 변경

## 🔧 사용 방법

### 1. Button 컴포넌트 사용 (권장)
```tsx
import Button from '../components/ui/Button';

// 기본 사용법
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>
<Button variant="text">Text</Button>
<Button variant="link">Link</Button>

// 크기 조절
<Button variant="primary" size="sm">Small</Button>
<Button variant="primary" size="md">Medium</Button>
<Button variant="primary" size="lg">Large</Button>

// 상태
<Button variant="primary" disabled>Disabled</Button>
<Button variant="primary" isLoading>Loading</Button>
```

### 2. TextButton 컴포넌트 사용
```tsx
import TextButton from '../components/ui/TextButton';

// 기본 사용법
<TextButton variant="primary">Primary</TextButton>
<TextButton variant="secondary">Secondary</TextButton>

// 크기 조절
<TextButton variant="primary" size="xs">Extra Small</TextButton>
<TextButton variant="primary" size="sm">Small</TextButton>
<TextButton variant="primary" size="md">Medium</TextButton>
```

### 3. CSS 클래스 직접 사용
```tsx
<button className="qc-btn qc-btn-text text-primary-600 hover:text-primary-800">
  커스텀 버튼
</button>
```

## 🎨 색상 변형

### Primary (기본)
- **일반**: `#2563eb` (blue-600)
- **호버**: `#1d4ed8` (blue-800)

### Secondary (보조)
- **일반**: `#6b7280` (gray-600)
- **호버**: `#374151` (gray-800)

### Danger (위험)
- **일반**: `#dc2626` (red-600)
- **호버**: `#b91c1c` (red-800)

### Success (성공)
- **일반**: `#10b981` (emerald-600)
- **호버**: `#047857` (emerald-800)

### Text (텍스트)
- **일반**: `#374151` (gray-700)
- **호버**: `#111827` (gray-900)

### Link (링크)
- **일반**: `#2563eb` (blue-600)
- **호버**: `#1d4ed8` (blue-800)
- **추가**: `underline` 스타일

## 📏 크기 가이드

### Button 컴포넌트
- **sm**: `text-sm` (14px)
- **md**: `text-base` (16px) - 기본값
- **lg**: `text-lg` (18px)

### TextButton 컴포넌트
- **xs**: `text-xs` (12px)
- **sm**: `text-sm` (14px) - 기본값
- **md**: `text-base` (16px)

## 🔄 마이그레이션 가이드

### 기존 패딩 있는 버튼을 패딩 없는 버튼으로 변경

#### Before (기존)
```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  기존 버튼
</button>
```

#### After (새로운 표준)
```tsx
<Button variant="primary">
  새로운 버튼
</Button>
```

### 단계별 마이그레이션
1. **Button 컴포넌트 임포트 추가**
2. **기존 `<button>` 태그를 `<Button>` 컴포넌트로 변경**
3. **variant 속성으로 색상 지정**
4. **기존 className 제거**

## 🎯 사용 시나리오

### ✅ 적합한 사용 사례
- **네비게이션 링크**: 메뉴, 탭, 페이지 이동
- **액션 버튼**: 편집, 삭제, 저장, 취소
- **상태 표시**: 활성/비활성 토글
- **폼 액션**: 제출, 리셋, 검색

### ❌ 부적합한 사용 사례
- **주요 CTA**: 회원가입, 구매 등 중요한 액션
- **모달 닫기**: 사용자가 놓치기 쉬운 액션
- **긴급 액션**: 삭제 확인 등 위험한 액션

## 🔍 접근성 고려사항

### 포커스 표시
- 키보드 네비게이션 지원
- 포커스 시 색상 변경으로 표시
- 스크린 리더 호환성

### 색상 대비
- WCAG AA 기준 준수
- 색맹 사용자 고려
- 고대비 모드 지원

## 🧪 테스트 방법

### 시각적 테스트
1. 쇼케이스 페이지에서 모든 변형 확인
2. 호버 상태 확인
3. 포커스 상태 확인
4. 비활성화 상태 확인

### 기능적 테스트
1. 클릭 이벤트 작동 확인
2. 키보드 네비게이션 확인
3. 스크린 리더 호환성 확인

## 📚 관련 파일

- `frontend/src/components/ui/Button.tsx` - Button 컴포넌트
- `frontend/src/components/ui/TextButton.tsx` - TextButton 컴포넌트
- `frontend/src/styles.css` - 버튼 스타일 정의
- `frontend/src/pages/ComponentShowcase.tsx` - 쇼케이스 페이지

## 💡 팁

1. **일관성 유지**: 항상 Button 또는 TextButton 컴포넌트 사용
2. **의미있는 variant**: 버튼의 목적에 맞는 색상 선택
3. **적절한 크기**: 컨텍스트에 맞는 크기 선택
4. **접근성 고려**: 키보드 사용자와 스크린 리더 사용자 고려

이 가이드를 따라하면 일관되고 사용자 친화적인 버튼 인터페이스를 구축할 수 있습니다! 🎉 