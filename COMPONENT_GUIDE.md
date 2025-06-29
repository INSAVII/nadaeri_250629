# 컴포넌트 사용 가이드

## � 인증 시스템 (ID 기반)

### 사용자 데이터 구조
```typescript
interface User {
  id: string;          // 시스템 내부 ID
  userId: string;      // 사용자 로그인 ID (고유값, 필수)
  email?: string;      // 이메일 (선택사항)
  name: string;        // 실명
  role: 'admin' | 'user';
  balance: number;     // 예치금
}
```

### 테스트 계정 (ID 기반)
- 관리자: admin / admin
- 일반사용자: testuser / test123

## �📋 필수 적용 규칙

### 모든 페이지 공통 구조
```jsx
export default function PageName() {
  return (
    <div className="max-w-[1080px] mx-auto px-4 py-6">
      <h1 className="text-2xl font-light mb-6">페이지 제목</h1>
      {/* 콘텐츠 */}
    </div>
  );
}
```

### 관리자 페이지 구조
```jsx
export default function AdminPageName() {
  return (
    <div className="max-w-[1080px] mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light">페이지 제목</h1>
        <Link to="/admin">
          <TextButton variant="secondary">관리자 대시보드</TextButton>
        </Link>
      </div>
      {/* 콘텐츠 */}
    </div>
  );
}
```

## 🎨 UI 컴포넌트 사용법

### TextButton 컴포넌트
```jsx
// 네비게이션용 (문자형)
<TextButton variant="text" size="sm">메뉴명</TextButton>

// 주요 액션
<TextButton variant="primary" size="sm">저장</TextButton>
<TextButton variant="primary" size="md">로그인하기</TextButton>

// 보조 액션
<TextButton variant="secondary" size="sm">취소</TextButton>

// 위험한 액션
<TextButton variant="danger" size="sm">삭제</TextButton>
```

### 입력 컴포넌트
```jsx
// 텍스트 입력
<CompactInput
  type="text"
  placeholder="입력하세요"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// 선택 박스
<CompactSelect
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
  options={[
    { value: 'option1', label: '옵션1' },
    { value: 'option2', label: '옵션2' }
  ]}
/>
```

### 테이블 컴포넌트
```jsx
<CompactTable headers={['컬럼1', '컬럼2', '컬럼3']}>
  <CompactTableRow>
    <CompactTableCell>데이터1</CompactTableCell>
    <CompactTableCell>데이터2</CompactTableCell>
    <CompactTableCell>데이터3</CompactTableCell>
  </CompactTableRow>
</CompactTable>
```

## 🎯 필수 클래스

### 텍스트 스타일
- `font-light` - 모든 텍스트에 적용
- `text-2xl font-light mb-6` - 페이지 제목
- `text-lg font-light mb-4` - 섹션 제목
- `text-sm font-light` - 일반 텍스트
- `text-xs text-gray-600 font-light` - 설명/캡션

### 레이아웃
- `max-w-[1080px] mx-auto px-4` - 페이지 컨테이너
- `py-6` - 페이지 상하 여백
- `space-y-6` - 섹션 간격
- `space-y-4` - 폼 요소 간격

### 카드/박스
- `border rounded p-4` - 기본 카드
- `border rounded p-6` - 큰 카드
- `bg-gray-50 border rounded p-4` - 강조 박스
