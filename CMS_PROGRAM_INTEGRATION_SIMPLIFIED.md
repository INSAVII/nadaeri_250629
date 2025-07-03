# CMS-QCapture 프로그램 권한 연동 단순화 가이드

## 개요
CMS 페이지의 프로그램 관리 탭과 QCapture 페이지 간의 연동을 최대한 단순화하여 에러 발생을 줄이고 안정성을 높였습니다.

## 주요 변경사항

### 1. CMS 페이지 단순화

#### 체크박스 클릭 이벤트
- **이전**: 체크박스 클릭 시 즉시 API 호출 및 로컬 스토리지 저장
- **현재**: 체크박스 클릭 시 UI 상태만 변경 (데이터베이스 저장은 저장 버튼에서만)
- **중요**: 페이지 로드 시 항상 데이터베이스의 실제 권한 상태로 체크박스 초기화

```typescript
// 단순화된 체크박스 클릭 함수
const handleProgramCheckboxChange = (userId: string, programType: 'free' | 'month1' | 'month3', isChecked: boolean) => {
    // UI 상태만 업데이트 (데이터베이스 저장은 저장 버튼에서만)
    setPermanentProgramPermissions(prevStates => ({
        ...prevStates,
        [userId]: {
            ...prevStates[userId],
            [programType]: isChecked
        }
    }));
};
```

#### 저장 버튼
- **이전**: 복잡한 에러 처리 및 로그
- **현재**: 단순한 데이터베이스 저장 및 이벤트 전송

```typescript
// 단순화된 저장 함수
const handleBulkProgramSave = async () => {
    // 선택된 사용자들의 프로그램 권한을 데이터베이스에 저장
    for (const userId of selectedUsers) {
        const permissions = permanentProgramPermissions[userId];
        if (!permissions) continue;

        // 각 프로그램 타입별로 권한 저장
        for (const programType of ['free', 'month1', 'month3']) {
            const isAllowed = permissions[programType as keyof typeof permissions] || false;
            
            const response = await fetch(`${getApiUrl()}/api/deposits/update-program-permission?user_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    program_id: programType,
                    is_allowed: isAllowed,
                    duration_months: programType === 'month1' ? 1 : programType === 'month3' ? 3 : null
                })
            });
        }
    }

    // 다운로드 버튼 상태 업데이트 이벤트 전송
    window.dispatchEvent(new CustomEvent('programPermissionSaved', {
        detail: {
            type: 'bulk_save',
            users: selectedUsers.map(userId => ({
                userId,
                permissions: permanentProgramPermissions[userId] || { free: false, month1: false, month3: false }
            }))
        }
    }));
};
```

### 2. QCapture 페이지 단순화

#### 권한 확인 로직
- **이전**: 복잡한 메모이제이션 및 콜백 함수
- **현재**: 단순한 useMemo로 권한 상태만 확인

```typescript
// 단순화된 권한 확인
const permissionStates = useMemo(() => {
    if (!user?.programPermissions) {
        return { free: false, month1: false, month3: false };
    }
    
    return {
        free: user.programPermissions.free || false,
        month1: user.programPermissions.month1 || false,
        month3: user.programPermissions.month3 || false
    };
}, [user?.programPermissions]);
```

#### 이벤트 리스너
- **이전**: 복잡한 로그 및 상태 업데이트
- **현재**: 단순한 메시지 표시만

```typescript
// 단순화된 이벤트 리스너
const handleProgramPermissionSaved = (event: CustomEvent) => {
    const currentUserId = user?.userId || user?.id;
    const changedUsers = event.detail.users || [];
    const currentUserChanged = changedUsers.find((u: any) => u.userId === currentUserId);
    
    if (currentUserChanged) {
        setMessage('다운로드 버튼이 업데이트되었습니다.');
        setTimeout(() => setMessage(''), 2000);
    }
};
```

#### 다운로드 버튼
- **이전**: 복잡한 조건부 텍스트 및 키 값
- **현재**: 단순한 "다운로드" 텍스트만

```typescript
// 단순화된 다운로드 버튼
<button
    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
        isAuthenticated && permissionStates.free && publicPrograms.find(p => p.license_type === 'free')?.isActive
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
    }`}
    onClick={() => handleDownload('free', '큐캡쳐 무료')}
    disabled={!isAuthenticated || !permissionStates.free || !publicPrograms.find(p => p.license_type === 'free')?.isActive}
>
    다운로드
</button>
```

#### 상태 표시
- **이전**: 복잡한 조건부 텍스트 및 키 값
- **현재**: 단순한 "사용 가능/사용 불가" 표시

```typescript
// 단순화된 상태 표시
<p className={`text-sm mt-1 ${permissionStates.free ? 'text-green-600' : 'text-gray-500'}`}>
    {permissionStates.free ? '✓ 사용 가능' : '사용 불가'}
</p>
```

## 데이터베이스 연동

### 핵심 원칙
- **CMS UI 상태 = 데이터베이스 상태**: 항상 동기화 유지
- **페이지 로드 시**: 데이터베이스에서 실제 권한 상태를 가져와서 체크박스 초기화
- **저장 버튼 클릭 시**: UI 상태를 데이터베이스에 저장 + QCapture 페이지 즉시 업데이트
- **로그아웃/재로그인 시**: 데이터베이스 상태가 그대로 유지됨
- **실시간 연동**: CMS에서 권한 변경 시 QCapture 페이지 다운로드 버튼 즉시 반영

### 사용자 ID 기반 통합 테이블
- 사용자 ID를 기반으로 무료, 1개월, 3개월 권한을 통합 관리
- API 엔드포인트: `/api/deposits/update-program-permission`
- 요청 형식:
```json
{
    "user_id": "사용자ID",
    "program_id": "free|month1|month3",
    "is_allowed": true|false,
    "duration_months": 1|3|null
}
```

## 페이지 간 연동 방식

### 1. CMS → QCapture 이벤트 전송
```typescript
window.dispatchEvent(new CustomEvent('programPermissionSaved', {
    detail: {
        type: 'bulk_save',
        users: [
            {
                userId: "사용자ID",
                permissions: {
                    free: true,
                    month1: false,
                    month3: true
                }
            }
        ]
    }
}));
```

### 2. QCapture 이벤트 수신
```typescript
window.addEventListener('programPermissionSaved', (event) => {
    // 현재 사용자 권한이 변경된 경우에만 처리
    const currentUserId = user?.userId || user?.id;
    const changedUsers = event.detail.users || [];
    const currentUserChanged = changedUsers.find((u: any) => u.userId === currentUserId);
    
    if (currentUserChanged) {
        // 즉시 메시지 표시
        setMessage('프로그램 권한이 변경되었습니다. 다운로드 버튼이 업데이트되었습니다.');
        
        // AuthContext 새로고침으로 권한 상태 즉시 반영
        if (refreshUserData) {
            setTimeout(() => {
                refreshUserData();
            }, 500);
        }
    }
});
```

## 보존된 기능

### 로그인 로직
- 기존 AuthContext 및 로그인 상태 관리 유지
- 사용자 인증 및 권한 확인 로직 그대로 유지

### 디자인
- 기존 UI/UX 디자인 완전 보존
- 버튼 스타일, 색상, 레이아웃 변경 없음

### 예치금 관리
- 기존 예치금 차감 및 관리 로직 유지
- 다운로드 시 예치금 차감 기능 그대로 유지

## 제거된 복잡한 기능

1. **복잡한 로그 및 디버깅**: 불필요한 콘솔 로그 제거
2. **메모이제이션 최적화**: 단순한 useMemo만 사용
3. **조건부 텍스트**: 다운로드 버튼 텍스트 단순화
4. **복잡한 상태 관리**: UI 상태와 데이터베이스 상태 분리
5. **무한 루프 방지 로직**: 단순한 구조로 변경

## 테스트 방법

1. **CMS 페이지 접속**: 관리자로 로그인하여 프로그램 관리 탭 확인
2. **상태 확인**: "상태 확인 (콘솔)" 버튼으로 UI 상태와 데이터베이스 상태 비교
3. **체크박스 클릭**: 사용자 권한 체크박스 클릭 (UI 상태만 변경)
4. **저장 버튼 클릭**: 선택된 사용자 권한을 데이터베이스에 저장
5. **페이지 새로고침**: 체크박스 상태가 데이터베이스 상태와 일치하는지 확인
6. **로그아웃/재로그인**: 데이터베이스 상태가 그대로 유지되는지 확인
7. **QCapture 페이지 확인**: 해당 사용자로 로그인하여 다운로드 버튼 상태 확인

## 장점

1. **에러 발생 감소**: 복잡한 로직 제거로 버그 가능성 최소화
2. **성능 향상**: 불필요한 리렌더링 및 API 호출 제거
3. **유지보수성**: 단순한 구조로 코드 이해 및 수정 용이
4. **안정성**: 로그인 로직 및 디자인 보존으로 기존 기능 안정성 유지 