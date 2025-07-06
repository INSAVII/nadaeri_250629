import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ServiceIcon, TextButton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { usePrice } from '../context/PriceContext';
import { STORAGE_KEYS, getApiUrl } from '../config/constants';

// 기존 programService 타입 정의
interface ProgramFile {
  id: string;
  name: string;
  version: string;
  type: string;
  url: string;
  isActive: boolean;
  isPublished: boolean;
  license_type?: string; // license_type 추가
  filename: string;
  fileSize: number;
}

interface UserProgram {
  id: string;
  userId: string;
  program: ProgramFile;
  purchaseDate: string;
  expiryDate: string;
  isActive: boolean;
}

// 사용자의 프로그램 구독 상태 인터페이스
interface ProgramSubscription {
  free: boolean;
  month1: boolean;
  month3: boolean;
}

// 최종 수정: 2025. 6. 19. 오전 8:20:00
const QCapture: React.FC = () => {
  const { isAuthenticated, user, refreshUserData } = useAuth();
  const { qcaptureMonth1Price, setQcaptureMonth1Price, qcaptureMonth3Price, setQcaptureMonth3Price } = usePrice();

  // 프로그램 다운로드 목록 관리 (큐캡쳐 무료, 1개월, 3개월)
  const [publicPrograms, setPublicPrograms] = useState<ProgramFile[]>([]);

  // 사용자의 프로그램 구독 상태
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 가격 설정 관련 상태
  const [isEditingMonth1, setIsEditingMonth1] = useState(false);
  const [isEditingMonth3, setIsEditingMonth3] = useState(false);
  const [tempMonth1Price, setTempMonth1Price] = useState(qcaptureMonth1Price);
  const [tempMonth3Price, setTempMonth3Price] = useState(qcaptureMonth3Price);

  // 무한루프 방지를 위한 ref들 (단순화)
  const eventListenersRegisteredRef = useRef(false);

  // ✅ 강화된 권한 확인 = 사용자 정보와 권한 상태 모두 확인
  const permissionStates = useMemo(() => {
    console.log('🔍 QCapture - 권한 상태 확인:', {
      user: user?.userId,
      hasUser: !!user,
      hasPermissions: !!user?.programPermissions,
      permissions: user?.programPermissions
    });

    if (!user || !user.programPermissions) {
      console.log('❌ QCapture - 사용자 또는 권한 정보 없음');
      return { free: false, month1: false, month3: false };
    }

    const states = {
      free: user.programPermissions.free || false,
      month1: user.programPermissions.month1 || false,
      month3: user.programPermissions.month3 || false
    };

    console.log('✅ QCapture - 권한 상태 계산 완료:', states);
    return states;
  }, [user, user?.programPermissions]);

  // 내장 서비스 함수들 - programService 대체
  const getPublicPrograms = async (type: string): Promise<ProgramFile[]> => {
    try {
      // 🆕 백엔드 API에서 프로그램 정보 가져오기 (공개 접근 가능)
      const response = await fetch(`${getApiUrl()}/api/programs/public-programs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const programs = await response.json();
        console.log('백엔드에서 가져온 프로그램 목록:', programs);

        // 백엔드 응답을 ProgramFile 형식으로 변환
        return programs.map((program: any) => ({
          id: program.id,
          name: program.name,
          version: '1.0', // 기본값
          type: 'qcapture',
          url: `/api/programs/user/download-file/${program.license_type === 'qcapture_free' ? 'free' : program.license_type === 'qcapture_month1' ? 'month1' : 'month3'}`,
          isActive: program.is_active,
          isPublished: program.is_active,
          license_type: program.license_type === 'qcapture_free' ? 'free' :
            program.license_type === 'qcapture_month1' ? 'month1' : 'month3',
          filename: program.filename,
          fileSize: program.file_size
        }));
      } else {
        console.error('프로그램 목록 가져오기 실패:', response.status, response.statusText);
        // 실패 시 빈 배열 반환 (기본값 반환하지 않음)
        return [];
      }
    } catch (error) {
      console.error('프로그램 목록 가져오기 오류:', error);
      // 오류 시 빈 배열 반환 (기본값 반환하지 않음)
      return [];
    }
  };

  const getUserPrograms = async (): Promise<UserProgram[]> => {
    if (!user) return [];

    // 공개 프로그램 가져오기
    const publicPrograms = await getPublicPrograms('qcapture');

    // 사용자 구독 정보 가져오기 (AuthContext에서 직접)
    const subscription = user.programPermissions || {
      free: false,
      month1: false,
      month3: false
    };

    // 사용자의 구독 상태에 따라 프로그램 반환
    const userProgs: UserProgram[] = [];

    if (subscription.free) {
      const freeProgram = publicPrograms.find(p => p.license_type === 'free');
      if (freeProgram) {
        userProgs.push({
          id: `user_${user.id}_free`,
          userId: user.id,
          program: freeProgram,
          purchaseDate: new Date().toISOString(),
          expiryDate: '9999-12-31', // 무기한
          isActive: true
        });
      }
    }

    if (subscription.month1) {
      const month1Program = publicPrograms.find(p => p.license_type === 'month1');
      if (month1Program) {
        userProgs.push({
          id: `user_${user.id}_1month`,
          userId: user.id,
          program: month1Program,
          purchaseDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true
        });
      }
    }

    if (subscription.month3) {
      const month3Program = publicPrograms.find(p => p.license_type === 'month3');
      if (month3Program) {
        userProgs.push({
          id: `user_${user.id}_3month`,
          userId: user.id,
          program: month3Program,
          purchaseDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true
        });
      }
    }

    return userProgs;
  };

  // 프로그램 목록 로드
  const loadPrograms = async () => {
    try {
      setIsLoading(true);

      // 공개 프로그램 로드 (큐캡쳐 타입만)
      const publicQCapturePrograms = await getPublicPrograms('qcapture');
      setPublicPrograms(publicQCapturePrograms);

      // 로그인한 사용자의 프로그램 로드 (단순화)
      if (isAuthenticated && user) {
        // 권한 정보가 있으면 사용자 프로그램 로드
        if (user.programPermissions) {
          const userProgramList = await getUserPrograms();
          const userQCapturePrograms = userProgramList.filter((up: UserProgram) =>
            up.program.type.toLowerCase() === 'qcapture'
          );
          setUserPrograms(userQCapturePrograms);
        } else {
          // 권한 정보가 없으면 빈 배열로 설정
          setUserPrograms([]);
          console.log('QCapture - 사용자 권한 정보가 아직 로드되지 않음');
        }
      } else {
        // 로그인하지 않은 경우 빈 배열
        setUserPrograms([]);
      }

      console.log('QCapture - 프로그램 목록 로드 완료:', {
        publicPrograms: publicQCapturePrograms.length,
        userPrograms: userPrograms.length,
        userPermissions: user?.programPermissions
      });

    } catch (error) {
      console.error('프로그램 로드 실패:', error);
      setMessage('프로그램 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이벤트 리스너 등록 (한 번만)
  useEffect(() => {
    if (eventListenersRegisteredRef.current) {
      return;
    }
    eventListenersRegisteredRef.current = true;

    // ✅ 개선된 이벤트 리스너 = 즉시 권한 상태 업데이트
    const handleProgramPermissionSaved = (event: CustomEvent) => {
      console.log('🔔 QCapture - 프로그램 권한 변경 이벤트 수신:', event.detail);

      const currentUserId = user?.userId || user?.id;
      const changedUsers = event.detail.users || [];
      const currentUserChanged = changedUsers.find((u: any) => u.userId === currentUserId);

      if (currentUserChanged) {
        console.log('✅ QCapture - 현재 사용자 권한 변경됨:', currentUserChanged.permissions);

        // 즉시 메시지 표시
        setMessage('프로그램 권한이 변경되었습니다. 다운로드 버튼이 업데이트되었습니다.');
        setTimeout(() => setMessage(''), 3000);

        // AuthContext 새로고침으로 권한 상태 즉시 반영
        if (refreshUserData) {
          setTimeout(() => {
            refreshUserData();
            console.log('🔄 QCapture - AuthContext 새로고침 완료');
          }, 500);
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('programPermissionSaved', handleProgramPermissionSaved as EventListener);

    // 초기 상태 설정
    loadPrograms();

    return () => {
      window.removeEventListener('programPermissionSaved', handleProgramPermissionSaved as EventListener);
      eventListenersRegisteredRef.current = false;
    };
  }, []); // 빈 의존성 배열

  // 체크박스 변경 처리
  const handleCheckboxChange = (programId: string) => {
    setSelectedPrograms((prev: { [key: string]: boolean }) => ({
      ...prev,
      [programId]: !prev[programId]
    }));
  };

  // 새로운 다운로드 처리 함수 (예치금 차감 포함)
  const handleDownload = async (licenseType: string, programName: string) => {
    try {
      // 권한 확인 (메모이제이션된 상태 사용)
      const hasPermission = licenseType === 'free' ? permissionStates.free :
        licenseType === 'month1' ? permissionStates.month1 :
          licenseType === 'month3' ? permissionStates.month3 : false;
      if (!hasPermission) {
        setMessage(`❌ ${programName} 사용 권한이 없습니다. 관리자에게 문의하세요.`);
        return;
      }

      // 파일 존재 여부 확인
      const programFile = publicPrograms.find(p =>
        (licenseType === 'free' && p.license_type === 'free') ||
        (licenseType === 'month1' && p.license_type === 'month1') ||
        (licenseType === 'month3' && p.license_type === 'month3')
      );

      if (!programFile || !programFile.isActive) {
        setMessage(`❌ ${programName} 파일이 업로드되지 않았습니다. 관리자에게 문의하세요.`);
        return;
      }

      // 로딩 상태 표시
      setMessage(`⏳ ${programName} 다운로드 준비 중...`);

      // 1. 백엔드 API 호출로 예치금 차감 및 다운로드 권한 확인
      if (!user?.token) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await fetch(`${getApiUrl()}/api/deposits/download-program`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          program_id: 'qcapture',
          license_type: licenseType,
          prices: {
            month1: qcaptureMonth1Price,
            month3: qcaptureMonth3Price
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));

        // 다운로드 횟수 제한 에러 처리
        if (response.status === 429) {
          setMessage(`❌ ${errorData.detail || '다운로드 횟수 제한에 도달했습니다.'}`);
          return;
        }

        throw new Error(errorData.detail || response.statusText);
      }

      const downloadData = await response.json();
      console.log('다운로드 API 응답:', downloadData);

      // 2. 예치금 차감 정보 및 다운로드 횟수 정보 표시
      let messageText = '';
      if (downloadData.data.amount_deducted > 0) {
        messageText += `💰 예치금 ${downloadData.data.amount_deducted.toLocaleString()}원이 차감되었습니다. (잔액: ${downloadData.data.remaining_balance.toLocaleString()}원) `;
      } else {
        messageText += `✅ ${programName} 다운로드가 시작되었습니다! (무료 프로그램) `;
      }

      // 다운로드 횟수 정보 추가
      if (downloadData.data.downloads_remaining !== undefined) {
        messageText += `\n📊 다운로드 횟수: ${downloadData.data.download_count}/${downloadData.data.max_downloads} (남은 횟수: ${downloadData.data.downloads_remaining})`;
      }

      setMessage(messageText);

      // 3. 백엔드 API에서 실제 파일 다운로드
      const downloadResponse = await fetch(`${getApiUrl()}/api/programs/user/download-program/${licenseType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!downloadResponse.ok) {
        const errorData = await downloadResponse.json().catch(() => ({ detail: downloadResponse.statusText }));
        throw new Error(errorData.detail || downloadResponse.statusText);
      }

      // 파일 정보 받기
      const fileInfo = await downloadResponse.json();
      console.log('파일 정보:', fileInfo);

      // 🆕 실제 파일 다운로드 (새로운 엔드포인트 사용)
      const actualDownloadResponse = await fetch(`${getApiUrl()}/api/programs/user/download-file/${licenseType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!actualDownloadResponse.ok) {
        const errorData = await actualDownloadResponse.json().catch(() => ({ detail: actualDownloadResponse.statusText }));
        throw new Error(errorData.detail || actualDownloadResponse.statusText);
      }

      // 파일 다운로드 (실제 파일명 사용)
      const blob = await actualDownloadResponse.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileInfo.data.filename; // 🆕 실제 업로드된 파일명 사용
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 메모리 정리
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);

      // 4. 사용자 정보 새로고침 (잔액 업데이트)
      await refreshUserData?.();

      // 5. 성공 메시지 업데이트
      setTimeout(() => {
        const successMessage = `✅ ${programName} 다운로드가 완료되었습니다!`;
        if (downloadData.data.downloads_remaining !== undefined) {
          setMessage(`${successMessage}\n📊 남은 다운로드 횟수: ${downloadData.data.downloads_remaining}회`);
        } else {
          setMessage(successMessage);
        }
        setTimeout(() => setMessage(''), 5000);
      }, 2000);

    } catch (error) {
      console.error('다운로드 실패:', error);

      // 오류 메시지 개선
      if (error instanceof Error) {
        if (error.message.includes('로그인이 필요')) {
          setMessage('❌ 로그인이 필요합니다. 먼저 로그인해주세요.');
        } else if (error.message.includes('권한이 없습니다')) {
          setMessage(`❌ ${programName} 사용 권한이 없습니다. 관리자에게 문의하세요.`);
        } else if (error.message.includes('예치금이 부족합니다')) {
          setMessage(`❌ ${error.message}`);
        } else if (error.message.includes('다운로드 횟수 제한')) {
          setMessage(`❌ ${error.message}`);
        } else {
          setMessage(`❌ 다운로드 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {
        setMessage('❌ 다운로드 중 알 수 없는 오류가 발생했습니다.');
      }

      // 오류 메시지는 7초 후 삭제
      setTimeout(() => {
        setMessage('');
      }, 7000);
    }
  };

  // 가격 설정 함수들
  const handleMonth1PriceSave = () => {
    setQcaptureMonth1Price(tempMonth1Price);
    setIsEditingMonth1(false);
  };

  const handleMonth3PriceSave = () => {
    setQcaptureMonth3Price(tempMonth3Price);
    setIsEditingMonth3(false);
  };

  // 가격 업데이트
  useEffect(() => {
    setTempMonth1Price(qcaptureMonth1Price);
    setTempMonth3Price(qcaptureMonth3Price);
  }, [qcaptureMonth1Price, qcaptureMonth3Price]);

  return (
    <div className="page-container py-6">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="text-blue-600 mr-3">
            <ServiceIcon type="qcapture" size="lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-600 mb-1">
              큐캡쳐 본인컴퓨터에설치 상세페이지캡쳐리사이징 자동저장 프로그램이며 엄부효율성을 대폭향상시킴
            </h1>
            <p className="text-sm text-blue-600 font-light">
              스크롤 이용크기축소확대 더블클릭 캡쳐 상품코드엑셀등록으로 상세페이지자동로딩 페이지열고 캡쳐만 순식간에 하면 엑셀에 호스팅주소자동저장됨 이미지로부터 문자제거대량처리는 큐문자서비스를 이용하세요
            </p>
          </div>
        </div>

        {/* 가격 설정/표시 */}
        <div className="mb-4">
          {/* 서비스 상태 */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-light rounded">서비스 정상</span>
            <span className="text-xs text-gray-600 font-light">이미지 문자제거는 Q문자를 사용하세요</span>
          </div>

          {/* 가격 설정 (관리자용) */}
          {user?.role === 'admin' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
              <h3 className="text-sm font-medium text-blue-800 mb-2">💰 가격 설정 (관리자 전용)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1개월 가격 설정 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 font-medium">1개월 프로그램:</span>
                  {isEditingMonth1 ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min={0}
                        value={tempMonth1Price}
                        onChange={e => setTempMonth1Price(Number(e.target.value))}
                        className="w-20 px-2 py-1 text-sm border rounded"
                      />
                      <span className="text-xs text-gray-500">원</span>
                      <button onClick={handleMonth1PriceSave} className="text-xs text-green-600 hover:text-green-800">저장</button>
                      <button onClick={() => { setIsEditingMonth1(false); setTempMonth1Price(qcaptureMonth1Price); }} className="text-xs text-gray-500 hover:text-gray-700">취소</button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-blue-600 font-medium">{qcaptureMonth1Price.toLocaleString()}원</span>
                      <button onClick={() => setIsEditingMonth1(true)} className="text-xs text-gray-500 hover:text-gray-700" title="1개월 가격 수정">✏️</button>
                    </div>
                  )}
                </div>

                {/* 3개월 가격 설정 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 font-medium">3개월 프로그램:</span>
                  {isEditingMonth3 ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min={0}
                        value={tempMonth3Price}
                        onChange={e => setTempMonth3Price(Number(e.target.value))}
                        className="w-20 px-2 py-1 text-sm border rounded"
                      />
                      <span className="text-xs text-gray-500">원</span>
                      <button onClick={handleMonth3PriceSave} className="text-xs text-green-600 hover:text-green-800">저장</button>
                      <button onClick={() => { setIsEditingMonth3(false); setTempMonth3Price(qcaptureMonth3Price); }} className="text-xs text-gray-500 hover:text-gray-700">취소</button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-blue-600 font-medium">{qcaptureMonth3Price.toLocaleString()}원</span>
                      <button onClick={() => setIsEditingMonth3(true)} className="text-xs text-gray-500 hover:text-gray-700" title="3개월 가격 수정">✏️</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 가격 표시 (일반 사용자용) */}
          {user?.role !== 'admin' && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>1개월: <span className="text-blue-600 font-medium">{qcaptureMonth1Price.toLocaleString()}원</span></span>
              <span>3개월: <span className="text-blue-600 font-medium">{qcaptureMonth3Price.toLocaleString()}원</span></span>
            </div>
          )}

          {/* 사용자 예치금 표시 */}
          {user && (
            <div className="mt-2 text-sm text-gray-600">
              💰 예치금: <span className="font-medium">{user.balance?.toLocaleString() || 0}원</span>
            </div>
          )}
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
          {message}
        </div>
      )}

      {/* 프로그램 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <p className="text-sm text-gray-600 font-light mt-1">
            {isAuthenticated ? '구매하신 프로그램을 다운로드하실 수 있습니다.' : '로그인하여 프로그램을 다운로드하실 수 있습니다.'}
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">프로그램 목록을 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 큐캡쳐 무료 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    id="qcapture_free"
                    checked={selectedPrograms['qcapture_free'] || false}
                    onChange={() => handleCheckboxChange('qcapture_free')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="qcapture_free" className="font-medium text-gray-900">
                      큐캡쳐 무료
                    </label>
                    <p className="text-sm text-gray-600">
                      파일명: {publicPrograms.find(p => p.license_type === 'free')?.filename || '업로드된 파일 없음'}
                      {publicPrograms.find(p => p.license_type === 'free')?.fileSize && (
                        <span className="ml-2 text-gray-500">
                          ({(publicPrograms.find(p => p.license_type === 'free')?.fileSize! / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      )}
                    </p>

                    {/* 단순화된 상태 표시 */}
                    <p className={`text-sm mt-1 ${permissionStates.free ? 'text-green-600' : 'text-gray-500'}`}>
                      {permissionStates.free ? '✓ 사용 가능' : '사용 불가'}
                    </p>
                    {!publicPrograms.find(p => p.license_type === 'free')?.isActive && (
                      <p className="text-xs mt-1 text-orange-600">
                        ⚠️ 관리자가 파일을 업로드하지 않았습니다
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-1/2 flex justify-end">
                  <button
                    className={`py-2 px-4 rounded-lg font-semibold transition-colors w-full max-w-xs ${isAuthenticated && permissionStates.free
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    onClick={() => handleDownload('free', '큐캡쳐 무료')}
                    disabled={!isAuthenticated || !permissionStates.free}
                  >
                    다운로드
                  </button>
                </div>
              </div>

              {/* 큐캡쳐 1개월 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    id="qcapture_1month"
                    checked={selectedPrograms['qcapture_1month'] || false}
                    onChange={() => handleCheckboxChange('qcapture_1month')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="qcapture_1month" className="font-medium text-gray-900">
                      큐캡쳐 1개월
                    </label>
                    <p className="text-sm text-gray-600">
                      파일명: {publicPrograms.find(p => p.license_type === 'month1')?.filename || '업로드된 파일 없음'}
                      {publicPrograms.find(p => p.license_type === 'month1')?.fileSize && (
                        <span className="ml-2 text-gray-500">
                          ({(publicPrograms.find(p => p.license_type === 'month1')?.fileSize! / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      )}
                    </p>

                    {/* 단순화된 상태 표시 */}
                    <p className={`text-sm mt-1 ${permissionStates.month1 ? 'text-green-600' : 'text-gray-500'}`}>
                      {permissionStates.month1 ? '✓ 사용 가능' : '사용 불가'}
                    </p>
                    {!publicPrograms.find(p => p.license_type === 'month1')?.isActive && (
                      <p className="text-xs mt-1 text-orange-600">
                        ⚠️ 관리자가 파일을 업로드하지 않았습니다
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-1/2 flex justify-end">
                  <button
                    className={`py-2 px-4 rounded-lg font-semibold transition-colors w-full max-w-xs ${isAuthenticated && permissionStates.month1
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    onClick={() => handleDownload('month1', '큐캡쳐 1개월')}
                    disabled={!isAuthenticated || !permissionStates.month1}
                  >
                    다운로드
                  </button>
                </div>
              </div>

              {/* 큐캡쳐 3개월 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    id="qcapture_3month"
                    checked={selectedPrograms['qcapture_3month'] || false}
                    onChange={() => handleCheckboxChange('qcapture_3month')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="qcapture_3month" className="font-medium text-gray-900">
                      큐캡쳐 3개월
                    </label>
                    <p className="text-sm text-gray-600">
                      파일명: {publicPrograms.find(p => p.license_type === 'month3')?.filename || '업로드된 파일 없음'}
                      {publicPrograms.find(p => p.license_type === 'month3')?.fileSize && (
                        <span className="ml-2 text-gray-500">
                          ({(publicPrograms.find(p => p.license_type === 'month3')?.fileSize! / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      )}
                    </p>

                    {/* 단순화된 상태 표시 */}
                    <p className={`text-sm mt-1 ${permissionStates.month3 ? 'text-green-600' : 'text-gray-500'}`}>
                      {permissionStates.month3 ? '✓ 사용 가능' : '사용 불가'}
                    </p>
                    {!publicPrograms.find(p => p.license_type === 'month3')?.isActive && (
                      <p className="text-xs mt-1 text-orange-600">
                        ⚠️ 관리자가 파일을 업로드하지 않았습니다
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-1/2 flex justify-end">
                  <button
                    className={`py-2 px-4 rounded-lg font-semibold transition-colors w-full max-w-xs ${isAuthenticated && permissionStates.month3
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    onClick={() => handleDownload('month3', '큐캡쳐 3개월')}
                    disabled={!isAuthenticated || !permissionStates.month3}
                  >
                    다운로드
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          {!isAuthenticated && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>로그인이 필요합니다.</strong> <a href="/login" className="text-blue-600 underline">로그인</a>하시면 구매하신 프로그램을 다운로드할 수 있습니다.
              </p>
            </div>
          )}

          {/* 권한 없음 안내 메시지 */}
          {isAuthenticated && (!permissionStates.free && !permissionStates.month1 && !permissionStates.month3) && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>프로그램 사용 권한이 없습니다.</strong> 관리자에게 문의하거나 프로그램을 구매하세요.
              </p>
            </div>
          )}

          {/* 다운로드 안내 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">다운로드 안내</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 각 프로그램은 약 50MB+ 크기입니다 (최대 100MB 지원).</li>
              <li>• 다운로드 후 설치하여 사용하세요.</li>
              <li>• 권한이 있는 프로그램만 다운로드 가능합니다.</li>
              <li>• <strong>다운로드 횟수 제한: 프로그램당 최대 3회까지 다운로드 가능합니다.</strong></li>
              <li>• <strong>✅ 실제 파일 다운로드가 활성화되었습니다. 관리자가 파일을 업로드하면 즉시 다운로드 가능합니다.</strong></li>
              <li>• 다운로드 중 브라우저를 닫지 마세요.</li>
              <li>• 대용량 파일이므로 안정적인 인터넷 연결을 권장합니다.</li>
            </ul>
          </div>

          {/* 디버깅 버튼 (개발용) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-2">디버깅 정보</h3>
              <button
                onClick={() => {
                  console.log('=== 프로그램 상태 디버깅 ===');
                  console.log('isAuthenticated:', isAuthenticated);
                  console.log('permissionStates:', permissionStates);
                  console.log('publicPrograms:', publicPrograms);

                  // 각 프로그램별 상세 상태
                  const freeProgram = publicPrograms.find(p => p.license_type === 'free');
                  const month1Program = publicPrograms.find(p => p.license_type === 'month1');
                  const month3Program = publicPrograms.find(p => p.license_type === 'month3');

                  console.log('무료 프로그램:', {
                    found: !!freeProgram,
                    isActive: freeProgram?.isActive,
                    permission: permissionStates.free,
                    buttonEnabled: isAuthenticated && permissionStates.free && freeProgram?.isActive
                  });

                  console.log('1개월 프로그램:', {
                    found: !!month1Program,
                    isActive: month1Program?.isActive,
                    permission: permissionStates.month1,
                    buttonEnabled: isAuthenticated && permissionStates.month1 && month1Program?.isActive
                  });

                  console.log('3개월 프로그램:', {
                    found: !!month3Program,
                    isActive: month3Program?.isActive,
                    permission: permissionStates.month3,
                    buttonEnabled: isAuthenticated && permissionStates.month3 && month3Program?.isActive
                  });

                  // 🆕 데이터베이스 권한 상태 확인
                  console.log('=== 데이터베이스 권한 상태 ===');
                  console.log('user.programPermissions:', user?.programPermissions);
                  console.log('user.role:', user?.role);
                  console.log('user.balance:', user?.balance);
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                프로그램 상태 디버깅
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QCapture;