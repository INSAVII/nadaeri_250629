**프로잭트명 Qclick 웹서비스프로잭트**

**qname.py /qtext.py / qcapture.exe** **기반 웹서비스 개발 작업 지시서**

**프로젝트 개요**

상품명 생성 및 카테고리 매핑 Python 스크립트(qname.py /qtext.py / qcapture.exe )를 기반으로 하이브리드 아키텍처의 유료 웹서비스를 개발하는 프로젝트입니다. 회원 관리, 예치금 관리 기능을 포함하여 일반 사용자에게 3가지 서비스를 제공합니다.

서비스 1. 관리자가 큐캡쳐 (qcapture.exe) 3가지 종류로 빌드된 실행파일을 업로드해서 일반 사용자들이 예치금한도내에서 다운로드 받아서 무료사용버전,1개월사용버전 5만원/3개월사용버전15만원 을 다운로드 받아서 사용하도록 허용하는 서비스 (참고,파일용량 50mb)

서비스 2. qname.py 을 기반으로 사용자가 엑셀헤더가 A열=상품코드,B열=상품키워드, C열=NSAVERCODE ,D열=카테분류형식,E열=SEO상품명, F열=연관검색어,G열=네이버태그 인 엑셀에 A열과 B열에 값을 입력해서 업로드 하면 구글/네이버 API와 연결해서 C,D,E,F,G 열 값을 찾아서 기입해주는 서비스. 서비스 처리당 50원. 예치금에서 차감. (qname.py 의 프로그램 내부 엑셀출력헤더명 을 업로드 엑셀양식에 맞게 수정해줘야함)

서비스 3. qtext.py 를 기반으로 사용자가 자신의 이미지 저장 폴더를 웹서비스 사이트에서 업로드 하면 , qtext.py 가 구글api를 이용해서 이미지로부터 문자를 제거해서 같은 파일명으로 처리완료된 이미지를 사용자가 다운로드 받도록 하며, 이미지 1건당 50원의 예치금을 차감하는 서비스 .(참고 이미지 최대 500개까지 업로드제한 500개용량 5메가바이트예상)

회원 예치금 잔액은 사용자들이 예치금 업데이트 버튼을 클릭했을대만 DB 의 저장값을 업데이트하는 방식으로 구현

회원예치금 변동은 큐네임,큐문자의 경우 가공완료 보고와 함께 회원예치금 업데이트 반영

관리자가 예치금추가 삭감시 모든 표시 및 저장 데이터 즉시 적용

**네비게이션 바구성**

Qclick 홈 | 큐네임 | 큐캡쳐 | 큐문자 | 공지사항 | 게시판 | 로그인 | 회원가입

Qclick 홈 | 큐네임 | 큐캡쳐 | 큐문자 | 공지사항 | 게시판 | ID 님 |예치금 잔액|예치금 업데이트| 로그아웃 |

Qclick 홈 | 큐네임 | 큐캡쳐 | 큐문자 | 공지사항 | 게시판 | 관리자 | 로그아웃 |

**관리자(드롭다운 메뉴)**

- - 관리자의 드롭다운 메뉴 버튼은 아래와 같이 구성한다.  

큐캡쳐 프로그램업로드

회원정보관리

회원예치금관리

서비스가격설정

관리자대시보드(사용설명서관리)

큐캡쳐 프로그램업로드 버튼은 큐캡쳐 프로그램업로드 관리자 페이지로 링크연결한다.

- - 큐캡쳐 프로그램업로드

**큐캡쳐 관리자업로드페이지**

큐캡쳐/유료회원3개월 실행파일

☑ 업로드 취소

☑ 업로드 취소

큐캡쳐/신규회원 무료사용7일 실행파일

☑ 업로드 취소

큐캡쳐/유료회원1개월 실행파일

- - 회원정보관리 구성은 아래와 같이 구성한다.

회원정보관리 회원정보 ☑ID / EMAIL / 이름 / 전화번호 /사업자번호/예치금잔액/가입일/ 차단 ☑

- - 회원예치금관리 구성은 아래와 같이 구성한다.

회원예치금관리

☑ ID /이름 / 예치금잔액표시 / 예치금 ☑추가 |삭감 모달박스 설치/큐캡쳐 허용버튼☑ 1개월|☑3개월

관리자가 회원 ID 에 큐캡쳐 허용버튼을 채크하면 채크된 프로그램 버튼이 사용회원의 접속페이지에서 다운로드

가능 허용됨.

회원예치금관리 페이지에는 회원 모두선택 채크박스와 채크된 회원 엑셀 다운로드 버튼, 회원예치금 추가,삭감 및 큐캡쳐 허용버튼 변경후 “수정사항모두저장” 버튼을 설치해서수정내용을 저장하도록 해야함.

- - 관리자대시보드(사용설명서관리)

공지사항관리- 공자사항 업로드 삭재 관리

개시판관리 게시판 의 관리자 권한으로 개시글 삭재 ,회원 차단설정

푸터관리 푸터 내용을 푸터관리자 페이지에서 내용 수정

서비스 가격관리 – 큐네임 완료보고1건당 50원 설정 관리자는 10원~100원 설정기능 필요

큐문자 완료보고 1건당 초기 50원 설정 10원~100원 설정기능

- - 서비스가격설정

큐네임 가격 설정 ☑ “금액입력창” 가격설정 저장 버튼

큐문자 가격 설정 ☑ “금액입력창” 가격설정 저장 버튼

서비스 가격설정은 관리자가 큐네임 과 큐문자 의 한건당 처리 삭감 금액(서비스이용료) 을 10원~200,000원까지 설정할 수 있도록 한다.

- - 관리자대시보드(사용설명서관리)

\[페이지구성 지시사항\]

\* 사용설명서 입력박스는 Rich Text Editor 로 작성해야한다.

\* 관리자가 관리자 대시보드에서 문단과 이미지 삽입기능으로 편집할 수 있어야한다.

\* 박스 크기는 박스높이를 15줄로 하고 옆에 업다운 슬라이딩바 설치

관리자 대시보드(사용설명서관리)

**“홈” 화면 사용설명서**

홈 화면 사용설명서 내용 관리자입력박스

**“큐네임” 사용설명서**

큐내임 사용설명서 관리자 내용입력박스

**“큐문자” 사용설명서**

큐문자관리자 사용설명서 내용 입력박스

“**큐캡쳐” 사용설명서**

큐캡쳐 사용설명서 내용입력박스

**“푸터관리”**

푸터 관리자 회사정보 입력박스

**회원가입**

ID

PW

이름

이메일

거주지역

나이

성벌

전업/부업

사업자 등록증유무 채크박스

사업자번호

개인정보처리동의서

**로그인**

ID

PW

비밀번호 자동저장 채크박스

비밀번호 찾기

비밀번호 재설정

로그인 / 회원탈퇴

**회원탈퇴 프로세스**

1. 회원탈퇴 버튼 클릭 시 확인 모달 표시: "사용자 관련 모든 정보가 초기화됩니다. 탈퇴하시겠습니까?"
2. 탈퇴 진행 시 비밀번호 확인 필요
3. 탈퇴 완료 후 "회원 탈퇴가 완료되었습니다. 그동안 Qclick을 이용해 주셔서 감사합니다." 메시지 표시

**회원탈퇴 기능 세부 구현**

회원탈퇴 기능은 사용자의 개인정보 보호와 서비스 이용 종료를 위한 중요한 기능입니다. 다음과 같이 구현합니다:

**1. 데이터베이스 처리**

회원탈퇴 시 데이터 처리 방식은 '소프트 삭제(Soft Delete)' 방식을 사용합니다:
- users 테이블의 deleted_at 타임스탬프 필드에 삭제 시점 기록
- is_active 필드를 false로 설정
- 개인식별정보(이메일, 전화번호 등)를 암호화 또는 익명화 처리

**2. API 구현**

```typescript
// 회원탈퇴 API (NextJS)
async function withdrawAccount(req, res) {
  try {
    const { userId, password } = req.body;
    
    // 비밀번호 확인
    const isValid = await verifyPassword(userId, password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }
    
    // 사용자 계정 소프트 삭제 처리
    await prisma.users.update({
      where: { id: userId },
      data: {
        deleted_at: new Date(),
        is_active: false,
        email: `deleted_${userId}_${Math.random().toString(36).substring(2, 15)}@deleted.com`,
        name: `탈퇴회원`,
        phone: null
      }
    });
    
    // 세션 종료
    req.session.destroy();
    
    return res.status(200).json({ success: true, message: '회원 탈퇴가 완료되었습니다. 그동안 Qclick을 이용해 주셔서 감사합니다.' });
  } catch (error) {
    console.error('회원탈퇴 처리 실패:', error);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
}
```

**3. 프론트엔드 구현**

```tsx
// 회원탈퇴 모달 컴포넌트
const WithdrawalModal = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleWithdrawal = async () => {
    if (!password) {
      toast.error('비밀번호를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        router.push('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">회원 탈퇴</h3>
        <p className="mb-4 text-red-500">사용자 관련 모든 정보가 초기화됩니다. 탈퇴하시겠습니까?</p>
        
        <div className="mb-4">
          <label className="block mb-2">비밀번호 확인</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            취소
          </button>
          <button
            onClick={handleWithdrawal}
            className="px-4 py-2 bg-red-500 text-white rounded"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '탈퇴하기'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

**4. 보안 고려사항**

- 회원탈퇴 시 비밀번호 재확인으로 본인 확인
- 중요 작업 진행 중인 경우 경고 메시지 표시 (예: 처리 중인 작업이 있을 경우)
- 사용자 데이터 익 anonym화 처리로 개인정보 보호

**5. 추가 처리 사항**

- 예치금 잔액 처리: 회원탈퇴 시 잔여 예치금에 대한 정책 안내
- 진행 중인 작업: 처리 중인 작업이 있을 경우 처리 방법 안내
- 사용 이력 관리: 서비스 개선을 위한 익명화된 사용 데이터 보존
- 재가입 정책: 탈퇴 후 재가입 시 제한사항 안내

위 구현을 통해 사용자의 개인정보를 보호하면서 안전한 회원탈퇴 프로세스를 제공합니다.

**홈화면구성**

홈 |개시판|공지사항|관리자|큐캡쳐 |큐문자| 큐내임| 마이페이지| 예치금 | 로그인

ID \*\*\*\*\*님 서비스이용현황표 예치금잔액 \*\*\*\*\*\* 큐캡쳐 무료 1개월

**Qclik**

회원가입시 큐캡쳐7일무료사용, 예치금 10,000원 지급 / 지금 무료로 사용해보세요.

기본 사용설명서.

Qclick=큐캡쳐/큐내임/큐문자제거

대량등록 /위탁판매/구매대행

큐네임NAME

상품명/네이버카테/키워드

엑셀양식업로드>>>

큐문자제거Clean

목록이미지 문자제거

이미지ZIP폴더업로드>>>

큐캡쳐Capture

상세페이지 목록이미지화작업

프로그램다운로드>>

사용중 불편사항 . 요청사항 문의 댓글달기 /문자보내기/ >>>>010-5904-2213

푸터 내용

**큐네임 Qname**

관리자 사용설명서 입력박스

**☑표준엑셀양식 다운로드버튼**

큐name/한 개당 50원

**☑ 업로드 ☑취소**

가공시작

처리결과보고 / 오류 20/완료 480

처리완료엑셀

처리완료/다운로드

처리중

**사용중 에러, 불편사항, 개선사항 문자보내기**

**관리자 연락처 :010-5904-2213**

**큐캡쳐 Qcapture**

큐캡쳐사용설명서 입력박스

☑

다운로드

큐캡쳐/신규회원 무료사용7일 실행파일

☑

다운로드

큐캡쳐/유료회원1개월 실행파일

☑

다운로드

큐캡쳐/유료회원3개월 실행파일

**큐문자 Qcleanup**

스크립트박스_관리자 사용설명서 입력박스

1회 최대 400개 이미지 업로드

☑ ☑ 파일업로드 ☑ 파일취소

큐문자 이미지 최대 500개 폴더 연결

1회 최대 500개 까지 업로드 해주세요. 사용중 에러, 불편사항, 개선사항 문자보내기

관리자 연락처 :010-5904-2213

완료 숫자표시

처리중

총이미지숫자

처리완료된 이미지 다운로드

☑

처리결과 다운로드크

처리결과승인채크

처리 완료 표시를 확인 하고 , 내 컴퓨터로 다운로드 받으세요.

**기술 스택**

**하이브리드 아키텍처**

- **Frontend**: Next.js (React) - Vercel에 배포
- **Backend API**: Next.js API Routes - Vercel에 배포
- **데이터 처리 서비스**: Python FastAPI - 별도 호스팅 (Railway/Render)
- **데이터베이스**: PostgreSQL - Supabase
- **파일 스토리지**: Firebase Storage 또는 AWS S3
- **인증**: NextAuth.js + JWT
- **결제**: 무통장 입금을 관리자가 확인하고 직접 회원 예치금관리에서 회원예치금 추가 삭감 하는방식

**핵심 기능 요구사항**

**1\. 회원 관리 시스템**

- 회원 가입/로그인/로그아웃/관리자
- 소셜 로그인 지원 (네이버/카카오/구글)
- 회원 정보 관리 (프로필 수정, 비밀번호 변경)
- 이메일 인증 및 비밀번호 찾기, 비밀번호재설정, 회원탈퇴

**2\. 예치금 관리 시스템**

- 예치금 충전 -관리자가 각회원별로 수동충전해주는 방식 ( 무통장입금확인후 관리자가 회원예치금 추가하는방식)
- 예치금 사용 내역 조회
- 관리자용 예치금 관리 대시보드
- 예치금 내역 다운로드 기능 추가

**3\. 상품명 생성 기능**

- 엑셀 파일 업로드를 통한 일괄 처리
- 텍스트 입력을 통한 개별 상품명 생성
- 상품명 생성 결과 저장 및 다운로드
- 생성 이력 조회
- 처리 진행 상황 실시간 표시

**처리 진행 상황 실시간 표시 (서버사이드 API 구현)**

1. **API 기반 진행상황 추적 시스템**
   - FastAPI 서버에서 비동기 처리 작업의 상태를 추적하고 저장하는 API 구현
   - 작업 ID 기반의 상태 관리 시스템으로 여러 동시 처리 요청 추적 가능
   - 진행률, 처리된 항목 수, 총 항목 수, 예상 완료 시간 등 상세 정보 제공

2. **구현 방법**
   ```python
   # FastAPI 서버 측 구현
   from fastapi import FastAPI, BackgroundTasks
   from pydantic import BaseModel
   import uuid
   import time
   
   app = FastAPI()
   
   # 작업 진행 상황을 저장할 딕셔너리
   processing_tasks = {}
   
   class ProcessingStatus(BaseModel):
       job_id: str
       total: int = 0
       processed: int = 0
       success: int = 0
       failed: int = 0
       status: str = "pending"  # pending, processing, completed, failed
       start_time: float = None
       completion_time: float = None
   
   @app.post("/api/process/start")
   async def start_processing(file_data: dict, background_tasks: BackgroundTasks):
       job_id = str(uuid.uuid4())
       total_items = file_data.get("total_items", 0)
       
       # 작업 상태 초기화
       processing_tasks[job_id] = ProcessingStatus(
           job_id=job_id,
           total=total_items,
           status="pending",
           start_time=time.time()
       )
       
       # 백그라운드에서 처리 작업 시작
       background_tasks.add_task(process_items, job_id, file_data)
       
       return {"job_id": job_id, "message": "처리가 시작되었습니다."}
   
   @app.get("/api/process/status/{job_id}")
   async def get_processing_status(job_id: str):
       if job_id not in processing_tasks:
           return {"error": "존재하지 않는 작업 ID입니다."}
           
       status = processing_tasks[job_id]
       
       # 진행률 계산
       if status.total > 0:
           progress_percentage = round((status.processed / status.total) * 100, 1)
       else:
           progress_percentage = 0
           
       # 예상 완료 시간 계산
       estimated_time_remaining = None
       if status.processed > 0 and status.status == "processing":
           elapsed_time = time.time() - status.start_time
           items_per_second = status.processed / elapsed_time
           if items_per_second > 0:
               remaining_items = status.total - status.processed
               estimated_time_remaining = round(remaining_items / items_per_second)
       
       return {
           "job_id": status.job_id,
           "total": status.total,
           "processed": status.processed,
           "success": status.success,
           "failed": status.failed,
           "status": status.status,
           "progress_percentage": progress_percentage,
           "estimated_time_remaining": estimated_time_remaining
       }
   
   async def process_items(job_id: str, file_data: dict):
       """실제 데이터 처리 로직"""
       status = processing_tasks[job_id]
       status.status = "processing"
       
       # 실제 qname.py나 qtext.py의 처리 로직을 여기에 통합
       # 예시로 간단한 처리 로직 구현
       total_items = status.total
       
       try:
           for i in range(total_items):
               # 개별 항목 처리 로직
               # TODO: 실제 상품명 생성 또는 이미지 처리 로직 통합
               
               # 상태 업데이트
               status.processed += 1
               status.success += 1
               
               # 처리 과정 시뮬레이션(실제 구현에서는 제거)
               await asyncio.sleep(0.1)
               
           # 처리 완료
           status.status = "completed"
           status.completion_time = time.time()
           
       except Exception as e:
           status.status = "failed"
           # 로깅 및 에러 처리
           print(f"처리 중 오류 발생: {str(e)}")
   ```

3. **프론트엔드 구현 (Next.js)**
   ```jsx
   // 프론트엔드에서 진행 상황을 주기적으로 확인하는 코드
   import { useState, useEffect } from 'react';
   
   export default function ProcessingStatus({ jobId }) {
     const [status, setStatus] = useState({ processed: 0, total: 0, progress_percentage: 0 });
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState(null);
     
     useEffect(() => {
       const checkStatus = async () => {
         try {
           const response = await fetch(`/api/process/status/${jobId}`);
           const data = await response.json();
           
           setStatus(data);
           setIsLoading(false);
           
           // 작업이 완료되지 않았으면 1초 후 다시 확인
           if (data.status !== 'completed' && data.status !== 'failed') {
             setTimeout(checkStatus, 1000);
           }
         } catch (err) {
           setError('상태 확인 중 오류가 발생했습니다.');
           setIsLoading(false);
         }
       };
       
       checkStatus();
     }, [jobId]);
     
     if (isLoading) return <div>로딩 중...</div>;
     if (error) return <div className="error">{error}</div>;
     
     return (
       <div className="processing-status">
         <h3>처리 상태</h3>
         
         <div className="status-info">
           <p>처리 중: {status.processed} / {status.total} 항목 ({status.progress_percentage}%)</p>
           
           {status.estimated_time_remaining && (
             <p>예상 남은 시간: {formatTime(status.estimated_time_remaining)}</p>
           )}
           
           <div className="progress-bar-container">
             <div 
               className="progress-bar" 
               style={{ width: `${status.progress_percentage}%` }}
             ></div>
           </div>
           
           {status.status === 'completed' && (
             <div className="success-message">
               처리가 완료되었습니다. 성공: {status.success}, 실패: {status.failed}
             </div>
           )}
           
           {status.status === 'failed' && (
             <div className="error-message">
               처리 중 오류가 발생했습니다.
             </div>
           )}
         </div>
       </div>
     );
   }
   
   function formatTime(seconds) {
     if (seconds < 60) return `${seconds}초`;
     if (seconds < 3600) return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
     return `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`;
   }
   ```

4. **통합 구현 예시**
   - 파일 업로드 시 작업 ID 발급 후 백그라운드 처리 시작
   - 클라이언트는 작업 ID로 주기적으로 상태 확인 API 호출
   - 상태에 따라 UI 업데이트 및 완료 시 결과 파일 다운로드 제공
   - 실패 시 적절한 오류 메시지와 재시도 옵션 제공

이 방식은 서버와 클라이언트 간의 통신을 최적화하면서 실시간에 가까운 진행 상황 업데이트를 제공합니다. 서버 측에서 작업 상태를 추적하므로 클라이언트 연결이 끊겨도 작업은 계속 진행되며, 사용자가 다시 연결했을 때 현재 상태를 볼 수 있습니다.

**4\. 관리자 기능**

- 회원 정보관리
- 회원예치금 충전/삭감 관리
- 홈 화면및, 3가지 웹서비스 페이지와 연동되는 관리자의 사용설명서 작성 대시보드
- 결제 내역 조회 및 관리
- 네이버 카테고리 매핑 파일 관리
- API 키 관리 (Gemini API, 네이버 API)

**서비스 아키텍처**

\[사용자 브라우저\] → \[Next.js Frontend (Vercel)\] → \[Next.js API Routes (Vercel)\] → \[Python FastAPI 서비스\]

↓

\[PostgreSQL 데이터베이스\]

↓

\[파일 스토리지\]

**서비스 사용 구조**

본 서비스는 다음과 같은 구조로 회원 서비스 사용을 관리합니다:

1. **예치금 기반 서비스 사용**
   - 관리자가 무통장 입금을 확인한 후 회원별 예치금을 직접 추가하는 방식으로 운영
   - 큐네임, 큐문자 서비스는 처리 건당 예치금에서 자동 차감 (기본 50원, 관리자 설정 가능)
   - 회원 예치금 잔액은 사용자가 '예치금 업데이트' 버튼을 클릭할 때만 DB에 반영 (큐네임, 큐문자의 경우 가공 완료 보고와 함께 자동 반영)
   - 관리자의 예치금 추가/삭감 시에는 모든 표시 및 저장 데이터 즉시 반영

2. **큐캡쳐 접근 권한 관리**
   - 관리자가 회원별로 체크박스를 통해 무료/1개월/3개월 접근 권한을 직접 부여
   - 부여된 권한에 따라 회원 페이지에서 해당 버전의 다운로드 버튼이 활성화됨
   - 신규 회원은 기본적으로 7일 무료 사용 버전 다운로드 가능
   - 1개월 버전은 5만원, 3개월 버전은 15만원의 가격으로 관리자가 무통장 입금 확인 후 접근 권한 부여

**개발 단계**

**1단계: 기본 설정 및 프로젝트 구조화**

- Next.js 프로젝트 생성
- FastAPI 프로젝트 생성
- 데이터베이스 스키마 설계
- 파일 스토리지 설정
- 개발 환경 구성

**2단계: Python API 서비스 개발**

- **qname.py /qtext.py** 코드를 API 서비스로 변환
- 필요한 엔드포인트 구현:
  - 엑셀 파일 처리 API
  - 텍스트 입력 처리 API
  - 카테고리 매핑 API
- 결과 저장 및 반환 기능 구현

**3단계: 회원 및 예치금 관리 시스템 개발**

- 회원 관리 API 구현
- 인증 시스템 구현
- 예치금 관리 시스템 구현
- 큐캡쳐 접근 권한 관리 시스템 구현

**4단계: 프론트엔드 개발**

- 사용자 인터페이스 설계
- 로그인/회원가입 페이지
- 대시보드
- 상품명 생성 페이지
- 예치금 관리 페이지
- 관리자 페이지

**5단계: 통합 및 테스트**

- 프론트엔드와 백엔드 API 통합
- Python 서비스 연결
- 종합 테스트
- 성능 최적화

**6단계: 배포 및 모니터링**

- Vercel에 프론트엔드 배포
- Railway/Render에 Python 서비스 배포
- 모니터링 시스템 설정
- 에러 추적 시스템 설정

\-- 사용자 테이블

CREATE TABLE users (

id SERIAL PRIMARY KEY,

email VARCHAR(255) UNIQUE NOT NULL,

password VARCHAR(255) NOT NULL,

name VARCHAR(100) NOT NULL,

phone VARCHAR(20),

address_region VARCHAR(100),  -- 거주지역

age INTEGER,

gender VARCHAR(10),  -- 성별

job_type VARCHAR(20),  -- 전업/부업

business_number VARCHAR(20),  -- 사업자번호

has_business_license BOOLEAN DEFAULT FALSE,  -- 사업자 등록증 유무

role VARCHAR(20) DEFAULT 'user',

deposit_balance INTEGER DEFAULT 10000,  -- 예치금 잔액, 신규가입시 10,000원

is_blocked BOOLEAN DEFAULT FALSE,  -- 차단 여부

agree_terms BOOLEAN DEFAULT FALSE,  -- 개인정보처리동의

deleted_at TIMESTAMP,  -- 회원탈퇴 시간 (NULL이 아니면 탈퇴한 회원)

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

last_login TIMESTAMP

);

\-- 예치금 테이블

CREATE TABLE deposits (

id SERIAL PRIMARY KEY,

user_id INTEGER REFERENCES users(id),

amount INTEGER NOT NULL,

balance INTEGER NOT NULL,

transaction_type VARCHAR(20) NOT NULL,

description TEXT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

\-- 큐캡쳐 접근 권한 테이블

CREATE TABLE qcapture_access (

id SERIAL PRIMARY KEY,

user_id INTEGER REFERENCES users(id),

free_access BOOLEAN DEFAULT FALSE,

one_month_access BOOLEAN DEFAULT FALSE,

three_month_access BOOLEAN DEFAULT FALSE,

granted_by INTEGER REFERENCES users(id),

free_expires_at TIMESTAMP,

one_month_expires_at TIMESTAMP,

three_month_expires_at TIMESTAMP,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP

);

\-- 처리 이력 테이블

CREATE TABLE processing_history (

id SERIAL PRIMARY KEY,

user_id INTEGER REFERENCES users(id),

file_name VARCHAR(255),

total_count INTEGER NOT NULL,

success_count INTEGER NOT NULL,

fail_count INTEGER NOT NULL,

result_file_path VARCHAR(255),

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

\-- 네이버 매핑 파일 테이블

CREATE TABLE naver_mapping_files (

id SERIAL PRIMARY KEY,

file_name VARCHAR(255) NOT NULL,

file_path VARCHAR(255) NOT NULL,

is_active BOOLEAN DEFAULT FALSE,

uploaded_by INTEGER REFERENCES users(id),

uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

**핵심 API 엔드포인트**

**NextJS API Routes**

- /api/auth/\* - 인증 관련 API
  - /api/auth/signup - 회원가입
  - /api/auth/login - 로그인
  - /api/auth/logout - 로그아웃
  - /api/auth/withdraw - 회원탈퇴
  - /api/auth/reset-password - 비밀번호 재설정
- /api/users/\* - 사용자 관리 API
- /api/deposits/\* - 예치금 관리 API
- /api/qcapture-access/\* - 큐캡쳐 접근 권한 관리 API
- /api/product-names/\* - 상품명 생성 관리 API

**Python FastAPI**

- /process-file - 엑셀 파일 처리
- /process-text - 텍스트 입력 처리
- /health - 서비스 상태 확인
- /update-mapping - 매핑 파일 업데이트

**특별 요구사항**

1. **성능 최적화**
    - 대용량 파일(1000개 이상 키워드) 처리 시 성능 최적화
    - 비동기 처리를 통한 사용자 경험 개선
2. **보안**
    - API 키 보안 관리
    - 사용자 데이터 암호화
    - CSRF 및 XSS 방어
3. **UI/UX**
    - 모바일 반응형 디자인
    - 실시간 진행 상태 표시
    - 직관적인 사용자 인터페이스
4. **확장성**
    - 향후 추가 기능(ex: 추가 API 연동, 다국어 지원 등)을 위한 확장 가능한 구조 설계

**참고 사항**

1. **Python 코드 이해**
    - [product_name_processor_2020601.py](vscode-file://vscode-app/c:/Users/PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) 파일은 Gemini API와 네이버 API를 활용하여 상품명, 카테고리 코드, 연관 검색어를 생성합니다.
    - pandas, sklearn 라이브러리를 사용하여 데이터 처리와 벡터 유사도 계산을 수행합니다.
2. **API 키 관리**
    - 환경 변수를 통한 안전한 API 키 관리 필요
    - 관리자 대시보드에서 Gemini API, 네이버 API 키 등록 및 관리 기능 구현
3. **데이터 처리 흐름**
    - 사용자 업로드 → Python 서비스 처리 → 결과 저장 → 사용자에게 결과 제공

**납품 산출물**

1. 소스 코드 (GitHub 레포지토리)
2. 데이터베이스 스키마 및 마이그레이션 스크립트
3. API 문서 (Swagger/OpenAPI)
4. 배포 문서 및 가이드
5. 관리자 매뉴얼
6. 사용자 매뉴얼

**일정**

총 개발 기간: 8-10주

- 1-2주: 설계 및 기본 구조 개발
- 3-4주: Python API 서비스 개발
- 5-6주: 회원/결제 시스템 개발
- 7-8주: 프론트엔드 개발
- 9-10주: 통합, 테스트 및 배포

**추가 고려사항**

1. Vercel의 서버리스 환경에 최적화된 코드 작성
2. Railway/Render에서 Python 서비스 안정적 운영을 위한 설정
3. 대용량 파일 처리 시간 단축을 위한 병렬 처리 구현
4. 사용자 피드백을 통한 지속적인 서비스 개선 계획