# 🚨 QClick 프로젝트 - 전체 사이트 공통요소 가이드

## ⚠️ **중요: 전체 사이트 영향 요소들**

페이지 작성 시 다음 요소들을 건드리면 **전체 사이트가 깨집니다**:

### 🏗️ **1. 레이아웃 기본 구조**

#### **절대 변경 금지 요소들:**
```css
/* 전체 사이트 기본 폭 */
max-width: 1080px
margin: 0 auto
padding: 24px

/* 기본 폰트 설정 */
font-family: Arial, sans-serif
font-weight: 300 (경량)

/* 기본 배경색 */
background-color: white
```

**⚠️ 위 설정 변경 시 → 모든 페이지 레이아웃 붕괴**

### 📱 **2. 공통 컴포넌트 (절대 수정 금지)**

#### **Header.tsx (네비게이션)**
- 위치: `frontend/src/components/Header.tsx`
- 영향: 모든 페이지 상단 메뉴
- 수정 시: 전체 네비게이션 붕괴

#### **AuthContext.tsx (인증 시스템)**
- 위치: `frontend/src/context/AuthContext.tsx`
- 영향: 로그인/로그아웃 모든 기능
- 수정 시: 사용자 인증 완전 마비

#### **App.tsx (라우팅)**
- 위치: `frontend/src/App.tsx`
- 영향: 모든 페이지 연결
- 수정 시: 사이트 전체 접근 불가

### 🎨 **3. CSS 공통 클래스 (변경 금지)**

#### **Tailwind 기본 설정:**
```css
/* 페이지 컨테이너 */
.page-container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px;
}

/* 기본 폰트 */
.font-light {
  font-weight: 300;
}

/* 텍스트 크기 */
.text-2xl { font-size: 24px; }
.text-lg { font-size: 18px; }
.text-base { font-size: 14px; }
```

**⚠️ 이 클래스들 수정 시 → 모든 페이지 디자인 붕괴**

## 🛡️ **안전한 페이지 작성 규칙**

### ✅ **허용되는 작업:**

1. **새 페이지 파일 생성**
   ```tsx
   // 새 파일: src/pages/NewPage.tsx
   export default function NewPage() {
     return (
       <div className="page-container py-6">
         {/* 새 내용 */}
       </div>
     );
   }
   ```

2. **기존 페이지 내용 수정**
   - 페이지별 고유 내용만 변경
   - 공통 구조는 유지

3. **새 컴포넌트 생성**
   ```tsx
   // 새 파일: src/components/MyComponent.tsx
   export default function MyComponent() {
     // 독립적인 컴포넌트
   }
   ```

### ❌ **절대 금지 작업:**

1. **기본 레이아웃 변경**
   ```tsx
   // ❌ 이런 변경 금지
   <div style={{maxWidth: '1200px'}}> // 1080px 변경
   <div style={{fontWeight: 400}}>   // 300 변경
   ```

2. **공통 컴포넌트 수정**
   ```tsx
   // ❌ Header.tsx 내부 수정 금지
   // ❌ AuthContext.tsx 수정 금지
   // ❌ App.tsx 라우팅 수정 금지
   ```

3. **Tailwind 기본 클래스 재정의**
   ```css
   /* ❌ 이런 재정의 금지 */
   .page-container { max-width: 1200px; }
   .font-light { font-weight: 400; }
   ```

## 🔧 **페이지 작성 시 안전한 템플릿**

### **표준 페이지 템플릿:**
```tsx
import React from 'react';

export default function NewPage() {
  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-light mb-6">페이지 제목</h1>
      
      {/* 페이지별 고유 내용 */}
      <div className="space-y-6">
        {/* 여기에 새 내용 추가 */}
      </div>
    </div>
  );
}
```

### **관리자 페이지 템플릿:**
```tsx
import React from 'react';

export default function AdminNewPage() {
  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 300, marginBottom: '24px' }}>
        관리자 페이지 제목
      </h1>
      
      {/* 테이블이나 폼 등 */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontWeight: 300,
        fontSize: '14px'
      }}>
        {/* 테이블 내용 */}
      </table>
    </div>
  );
}
```

## 🚨 **전체 사이트 깨짐 방지 체크리스트**

### **새 페이지 작성 전 확인:**
- [ ] `page-container` 클래스 사용했는가?
- [ ] `font-light` 유지했는가?
- [ ] `max-width: 1080px` 유지했는가?
- [ ] 공통 컴포넌트 수정하지 않았는가?
- [ ] 기존 라우팅 건드리지 않았는가?

### **작성 후 확인:**
- [ ] 다른 페이지들이 정상 작동하는가?
- [ ] 네비게이션이 정상인가?
- [ ] 로그인/로그아웃이 정상인가?
- [ ] 모바일에서도 정상인가?

## 💡 **AI 프롬프트 가이드**

### **안전한 요청 방법:**
```
"QClick 디자인 시스템을 유지하면서 새 페이지를 작성해주세요:
- max-width: 1080px, 중앙 정렬 유지
- font-weight: 300 유지
- page-container 클래스 사용
- 기존 공통 컴포넌트는 수정하지 말고
- 새 페이지 파일만 생성해주세요"
```

### **위험한 요청 예시:**
```
❌ "전체 사이트 디자인을 바꿔주세요"
❌ "Header 컴포넌트를 수정해주세요"
❌ "폭을 1200px로 바꿔주세요"
❌ "폰트를 더 굵게 해주세요"
```

## 🎯 **결론**

**1080px 폭, font-weight: 300, React 구조**는 전체 사이트의 뼈대입니다.

이것들을 건드리면 **모든 페이지가 깨집니다**.

**새 페이지는 이 틀 안에서만 작성**하고, **공통 요소는 절대 수정하지 마세요**!
