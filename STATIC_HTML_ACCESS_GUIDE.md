# Parcel 개발 서버에서 정적 HTML 파일 접속 문제 해결 가이드

## 문제 상황
- Parcel 개발 서버에서 `public/` 폴더의 HTML 파일에 접속하려고 할 때 "페이지를 찾을 수 없습니다" 오류 발생
- 예: `http://localhost:3000/init_mock_data.html` 접속 시 404 오류

## 원인
Parcel 개발 서버는 기본적으로 `src/index.html`을 진입점으로 사용하며, `public/` 폴더의 정적 파일들을 자동으로 서빙하지 않습니다.

## 해결 방법

### 방법 1: React 라우터를 통한 접근 (권장)
정적 HTML 파일 대신 React 컴포넌트로 만들어 React 라우터를 통해 접근

#### 1. React 컴포넌트 생성
```tsx
// App.tsx에 컴포넌트 추가
const MockDataInitializer: React.FC = () => {
  // HTML 내용을 JSX로 변환
  return (
    <div>
      {/* HTML 내용 */}
    </div>
  );
};
```

#### 2. 라우트 추가
```tsx
// App.tsx의 Routes 섹션에 추가
<Route
  path="/init_mock_data"
  element={<MockDataInitializer />}
/>
```

#### 3. 접속 방법
- `http://localhost:3000/init_mock_data` 로 접속

### 방법 2: 정적 파일 서빙 설정 (대안)
Parcel 설정을 통해 정적 파일 서빙 활성화

#### 1. .parcelrc 파일 생성
```json
{
  "extends": "@parcel/config-default",
  "static": {
    "publicUrl": "/",
    "outDir": "dist"
  }
}
```

#### 2. public 폴더 구조
```
frontend/
├── public/
│   └── init_mock_data.html
└── src/
    └── index.html
```

## 실제 적용 사례

### 목업 데이터 초기화 페이지
- **문제**: `http://localhost:3000/init_mock_data.html` 접속 불가
- **해결**: React 컴포넌트로 변환하여 `http://localhost:3000/init_mock_data`로 접속
- **파일**: `frontend/src/App.tsx`에 `MockDataInitializer` 컴포넌트 추가

### 코드 예시
```tsx
// App.tsx에 추가된 컴포넌트
const MockDataInitializer: React.FC = () => {
  const [message, setMessage] = React.useState('');

  const initializeMockData = () => {
    try {
      localStorage.setItem('mockUsers', JSON.stringify(DEFAULT_MOCK_USERS));
      setMessage('✅ 목업 데이터가 성공적으로 초기화되었습니다!');
    } catch (error) {
      setMessage('❌ 목업 데이터 초기화에 실패했습니다: ' + error.message);
    }
  };

  return (
    <div style={{ /* 스타일 */ }}>
      <h1>🎯 목업 데이터 초기화</h1>
      <button onClick={initializeMockData}>목업 데이터 초기화</button>
      {message && <div>{message}</div>}
    </div>
  );
};

// 라우트 추가
<Route path="/init_mock_data" element={<MockDataInitializer />} />
```

## 권장사항
1. **React 라우터 방식 사용**: 일관성 있고 관리하기 쉬움
2. **정적 HTML은 배포 시에만 사용**: 개발 중에는 React 컴포넌트로 관리
3. **파일 구조 유지**: `public/` 폴더는 이미지, 아이콘 등 순수 정적 파일용으로 사용

## 참고사항
- 이 방법은 Parcel 개발 서버에서만 발생하는 문제
- 프로덕션 빌드 시에는 `public/` 폴더의 파일들이 정상적으로 서빙됨
- Next.js와 Parcel을 혼용할 때 발생할 수 있는 문제이므로, 하나의 빌드 도구만 사용 권장

---
**작성일**: 2025-06-24  
**문제 해결자**: AI Assistant  
**적용 프로젝트**: QClick Frontend (Parcel + React) 