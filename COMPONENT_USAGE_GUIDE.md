# 공통 컴포넌트 사용 가이드

## 📋 개요

이 문서는 QClick 프로젝트에서 사용되는 공통 UI 컴포넌트들의 사용법을 설명합니다.

## 🎯 컴포넌트 목록

### 1. 로딩 컴포넌트
- `Loading` - 로딩 스피너
- `ProgressBar` - 진행률 표시

### 2. 메시지 컴포넌트
- `SuccessMessage` - 성공 메시지
- `ErrorMessage` - 에러 메시지
- `InfoMessage` - 정보 메시지

### 3. 입력 컴포넌트
- `CompactInput` - 텍스트 입력 필드
- `CompactSelect` - 드롭다운 선택
- `FileUpload` - 파일 업로드

### 4. 폼 컴포넌트
- `ServiceForm` - 서비스별 입력 폼 컨테이너

### 5. 결과 표시 컴포넌트
- `ResultDisplay` - 결과 표시 영역

### 6. 기타 컴포넌트
- `Button` - 버튼
- `Modal` - 모달
- `CompactTable` - 테이블

## 🚀 사용법

### 1. 컴포넌트 임포트

```typescript
import {
  Button,
  CompactInput,
  CompactSelect,
  Loading,
  SuccessMessage,
  ErrorMessage,
  InfoMessage,
  FileUpload,
  ResultDisplay,
  ServiceForm,
  ProgressBar
} from '@/components/ui';
```

### 2. 로딩 컴포넌트

#### Loading
```typescript
// 기본 사용
<Loading />

// 크기 지정
<Loading size="sm" />
<Loading size="md" />
<Loading size="lg" />

// 텍스트 변경
<Loading text="처리 중입니다..." />

// 전체 화면 로딩
<Loading fullScreen={true} />
```

#### ProgressBar
```typescript
// 기본 사용
<ProgressBar progress={50} />

// 라벨과 퍼센트 표시
<ProgressBar 
  progress={75} 
  label="업로드 진행률" 
  showPercentage={true} 
/>

// 크기와 색상 지정
<ProgressBar 
  progress={30} 
  size="lg" 
  color="green" 
/>
```

### 3. 메시지 컴포넌트

#### SuccessMessage
```typescript
<SuccessMessage 
  message="작업이 성공적으로 완료되었습니다!" 
  onClose={() => setShowSuccess(false)}
  autoClose={true}
  duration={5000}
/>
```

#### ErrorMessage
```typescript
<ErrorMessage 
  message="오류가 발생했습니다. 다시 시도해주세요." 
  onClose={() => setShowError(false)}
/>
```

#### InfoMessage
```typescript
<InfoMessage 
  message="이것은 정보 메시지입니다." 
  onClose={() => setShowInfo(false)}
/>
```

### 4. 입력 컴포넌트

#### CompactInput
```typescript
<CompactInput
  label="이름"
  placeholder="이름을 입력하세요"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required={true}
/>
```

#### CompactSelect
```typescript
<CompactSelect
  label="카테고리"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  options={[
    { value: '', label: '카테고리 선택' },
    { value: 'electronics', label: '전자제품' },
    { value: 'clothing', label: '의류' }
  ]}
  required={true}
/>
```

#### FileUpload
```typescript
<FileUpload
  label="엑셀 파일 업로드"
  accept=".xlsx,.xls"
  multiple={false}
  maxSize={5} // 5MB
  onFileSelect={(files) => setSelectedFiles(files)}
  onFileRemove={(file) => handleFileRemove(file)}
/>
```

### 5. 폼 컴포넌트

#### ServiceForm
```typescript
<ServiceForm
  title="큐네임 서비스"
  description="상품명을 생성하기 위한 정보를 입력해주세요."
  onSubmit={handleSubmit}
  loading={isLoading}
>
  <CompactInput
    label="카테고리"
    placeholder="예: 전자제품 > 스마트폰"
    value={category}
    onChange={(e) => setCategory(e.target.value)}
  />
  <CompactInput
    label="키워드"
    placeholder="상품 키워드를 입력하세요"
    value={keywords}
    onChange={(e) => setKeywords(e.target.value)}
  />
  <CompactSelect
    label="스타일"
    value={style}
    onChange={(e) => setStyle(e.target.value)}
    options={[
      { value: 'modern', label: '모던' },
      { value: 'classic', label: '클래식' }
    ]}
  />
  <Button type="submit">상품명 생성</Button>
</ServiceForm>
```

### 6. 결과 표시 컴포넌트

#### ResultDisplay
```typescript
// 텍스트 결과
<ResultDisplay
  title="생성된 상품명"
  data="최신 스마트폰 갤럭시 S24 울트라 256GB"
  type="text"
  showCopy={true}
/>

// 리스트 결과
<ResultDisplay
  title="생성된 상품명 목록"
  data={[
    "갤럭시 S24 울트라 256GB",
    "갤럭시 S24 플러스 128GB",
    "갤럭시 S24 512GB"
  ]}
  type="list"
  showCopy={true}
/>

// 테이블 결과
<ResultDisplay
  title="상품 정보"
  data={[
    { name: "갤럭시 S24", price: "1,200,000원", category: "스마트폰" },
    { name: "아이폰 15", price: "1,500,000원", category: "스마트폰" }
  ]}
  type="table"
  showCopy={true}
  showDownload={true}
  downloadFileName="product-list"
/>

// JSON 결과
<ResultDisplay
  title="API 응답"
  data={{ status: "success", data: [...] }}
  type="json"
  showCopy={true}
/>
```

## 🎨 스타일링

모든 컴포넌트는 Tailwind CSS를 사용하여 스타일링되어 있습니다. 필요에 따라 `className` prop을 통해 추가 스타일을 적용할 수 있습니다.

```typescript
<Button className="w-full bg-red-600 hover:bg-red-700">
  삭제
</Button>

<CompactInput 
  className="mb-4"
  label="이름"
  placeholder="이름을 입력하세요"
/>
```

## 🔧 고급 사용법

### 조건부 렌더링
```typescript
{isLoading && <Loading fullScreen={true} />}

{error && (
  <ErrorMessage 
    message={error} 
    onClose={() => setError('')}
  />
)}

{success && (
  <SuccessMessage 
    message="성공!" 
    autoClose={true}
  />
)}
```

### 상태 관리와 함께 사용
```typescript
const [formData, setFormData] = useState({
  category: '',
  keywords: '',
  style: 'modern'
});

const [isLoading, setIsLoading] = useState(false);
const [result, setResult] = useState(null);
const [error, setError] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  
  try {
    const response = await generateProductNames(formData);
    setResult(response.data);
  } catch (err) {
    setError('상품명 생성에 실패했습니다.');
  } finally {
    setIsLoading(false);
  }
};
```

## 📱 반응형 디자인

모든 컴포넌트는 모바일과 데스크톱에서 최적화되어 있습니다. 특별한 설정 없이도 반응형으로 작동합니다.

## ♿ 접근성

컴포넌트들은 웹 접근성 가이드라인을 준수하여 개발되었습니다:
- 적절한 ARIA 라벨
- 키보드 네비게이션 지원
- 스크린 리더 호환성

## 🐛 문제 해결

### 일반적인 문제들

1. **컴포넌트가 렌더링되지 않는 경우**
   - import 경로 확인
   - TypeScript 타입 오류 확인

2. **스타일이 적용되지 않는 경우**
   - Tailwind CSS 설정 확인
   - className prop 올바르게 전달 확인

3. **이벤트 핸들러가 작동하지 않는 경우**
   - 함수 참조 확인
   - 이벤트 객체 올바르게 전달 확인

## 📚 추가 리소스

- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [React TypeScript 가이드](https://react-typescript-cheatsheet.netlify.app/)
- [Heroicons](https://heroicons.com/) (아이콘 라이브러리) 