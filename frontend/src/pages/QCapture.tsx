import React, { useState, useEffect, useRef } from 'react';
import { ServiceIcon, TextButton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useDownloadService } from '../api/downloadService';
import { STORAGE_KEYS } from '../config/constants';
import { getApiUrl } from '../config/constants';

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

// 실제 API 연동 함수
const getCurrentUserFromAPI = async (token: string) => {
  const response = await fetch(`${getApiUrl()}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('사용자 정보를 불러오지 못했습니다');
  return await response.json();
};

// 최종 수정: 2025. 6. 19. 오전 8:20:00
const QCapture: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { downloadProgram, checkPermission: downloadServiceCheckPermission } = useDownloadService();

  // 프로그램 다운로드 목록 관리 (큐캡쳐 무료, 1개월, 3개월)
  const [publicPrograms, setPublicPrograms] = useState<ProgramFile[]>([]);

  // 사용자의 프로그램 구독 상태
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 무한루프 방지를 위한 ref들
  const lastSubscriptionRef = useRef<string>('');
  const isUpdatingSubscriptionRef = useRef(false);
  const eventListenersRegisteredRef = useRef(false);
  const programSubscriptionRef = useRef<ProgramSubscription>({
    free: false,
    month1: false,
    month3: false
  });

  // 내장 서비스 함수들 - programService 대체
  const getPublicPrograms = async (type: string): Promise<ProgramFile[]> => {
    // localStorage에서 활성화된 프로그램 가져오기
    const activeProgramsJson = localStorage.getItem('ACTIVE_PROGRAMS');
    const activePrograms = activeProgramsJson ? JSON.parse(activeProgramsJson) : {};

    // 실제 업로드된 파일 정보 사용
    return [
      {
        id: '1',
        name: '큐캡쳐 무료',
        version: '1.0',
        type: 'qcapture',
        url: activePrograms.qcapture_free ? `/downloads/qcapture/free/${activePrograms.qcapture_free.filename}` : '/downloads/qcapture/free/qcapture_free_v1.0.exe',
        isActive: !!activePrograms.qcapture_free,
        isPublished: !!activePrograms.qcapture_free,
        license_type: 'free',
        filename: activePrograms.qcapture_free?.filename || 'qcapture_free_v1.0.exe',
        fileSize: activePrograms.qcapture_free?.fileSize
      },
      {
        id: '2',
        name: '큐캡쳐 1개월',
        version: '2.1',
        type: 'qcapture',
        url: activePrograms.qcapture_1month ? `/downloads/qcapture/month1/${activePrograms.qcapture_1month.filename}` : '/downloads/qcapture/month1/qcapture_1month_v2.1.exe',
        isActive: !!activePrograms.qcapture_1month,
        isPublished: !!activePrograms.qcapture_1month,
        license_type: '1month',
        filename: activePrograms.qcapture_1month?.filename || 'qcapture_1month_v2.1.exe',
        fileSize: activePrograms.qcapture_1month?.fileSize
      },
      {
        id: '3',
        name: '큐캡쳐 3개월',
        version: '3.0',
        type: 'qcapture',
        url: activePrograms.qcapture_3month ? `/downloads/qcapture/month3/${activePrograms.qcapture_3month.filename}` : '/downloads/qcapture/month3/qcapture_3month_v3.0.exe',
        isActive: !!activePrograms.qcapture_3month,
        isPublished: !!activePrograms.qcapture_3month,
        license_type: '3month',
        filename: activePrograms.qcapture_3month?.filename || 'qcapture_3month_v3.0.exe',
        fileSize: activePrograms.qcapture_3month?.fileSize
      }
    ];
  };

  const getUserPrograms = async (): Promise<UserProgram[]> => {
    if (!user) return [];

    // 공개 프로그램 가져오기
    const publicPrograms = await getPublicPrograms('qcapture');

    // 사용자 구독 정보 가져오기
    const subscription = programSubscriptionRef.current;

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
      const month1Program = publicPrograms.find(p => p.license_type === '1month');
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
      const month3Program = publicPrograms.find(p => p.license_type === '3month');
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

      // 로그인한 사용자의 프로그램 로드
      if (isAuthenticated) {
        const userProgramList = await getUserPrograms();
        const userQCapturePrograms = userProgramList.filter((up: UserProgram) =>
          up.program.type.toLowerCase() === 'qcapture'
        );
        setUserPrograms(userQCapturePrograms);
      }
      // 로컬 스토리지에서 활성화 프로그램 확인
      // 실제 API 구현 시 이 부분은 서버에서 받은 데이터를 사용
      try {
        const activeProgramsJson = localStorage.getItem('ACTIVE_PROGRAMS');
        const activePrograms = activeProgramsJson ? JSON.parse(activeProgramsJson) : {};
      } catch (storageError) {
        console.error('로컬 스토리지 접근 오류:', storageError);
      }

    } catch (error) {
      console.error('프로그램 로드 실패:', error);
      setMessage('프로그램 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 프로그램 구독 정보 로드 (DOM 직접 조작)
  const loadUserSubscription = () => {
    try {
      // 무한루프 방지: 이미 업데이트 중인지 확인
      if (isUpdatingSubscriptionRef.current) {
        return;
      }

      // 인증된 사용자인 경우만 구독 정보를 확인
      if (isAuthenticated && user) {
        // 실제 API 호출을 통해 사용자 정보 가져오기
        if (user.token) {
          getCurrentUserFromAPI(user.token)
            .then(currentUser => {
              if (currentUser.programPermissions) {
                const newSubscription = currentUser.programPermissions;
                const newSubscriptionString = JSON.stringify(newSubscription);

                if (lastSubscriptionRef.current !== newSubscriptionString) {
                  lastSubscriptionRef.current = newSubscriptionString;
                  programSubscriptionRef.current = newSubscription;
                  console.log('QCapture - 프로그램 구독 정보 업데이트:', newSubscription);
                }
              }
            })
            .catch(error => {
              console.error('사용자 정보 로드 실패:', error);
              // 오류 시 기본값으로 설정
              programSubscriptionRef.current = {
                free: true,
                month1: false,
                month3: false
              };
            })
            .finally(() => {
              isUpdatingSubscriptionRef.current = false;
            });
        } else {
          // 토큰이 없는 경우 기본값 사용
          console.log('QCapture - 토큰 없음, 기본값 사용');
          programSubscriptionRef.current = {
            free: true,
            month1: false,
            month3: false
          };
          isUpdatingSubscriptionRef.current = false;
        }
      }
    } catch (error) {
      console.error('구독 정보 로드 실패:', error);
      isUpdatingSubscriptionRef.current = false;
      // 오류 시 기본값으로 설정
      programSubscriptionRef.current = {
        free: true,
        month1: false,
        month3: false
      };
    }
  };

  // 이벤트 리스너 등록 (한 번만)
  useEffect(() => {
    if (eventListenersRegisteredRef.current) {
      return;
    }
    eventListenersRegisteredRef.current = true;

    // 프로그램 변경 이벤트
    const handleActiveProgramsChanged = () => {
      loadPrograms();
    };

    // 이벤트 리스너 등록 (프로그램 권한 이벤트 제거)
    window.addEventListener('activeProgramsChanged', handleActiveProgramsChanged);

    // 초기 상태 설정
    loadPrograms();
    loadUserSubscription();

    return () => {
      window.removeEventListener('activeProgramsChanged', handleActiveProgramsChanged);
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

  // 권한 확인 함수 (ref 사용)
  const checkPermission = (licenseType: string): boolean => {
    const subscription = programSubscriptionRef.current;

    switch (licenseType) {
      case 'free':
        return subscription.free;
      case 'month1':
        return subscription.month1;
      case 'month3':
        return subscription.month3;
      default:
        return false;
    }
  };

  // 새로운 다운로드 처리 함수
  const handleDownload = async (licenseType: string, programName: string) => {
    try {
      // 권한 확인 (ref 사용)
      const hasPermission = checkPermission(licenseType);
      if (!hasPermission) {
        setMessage(`❌ ${programName} 사용 권한이 없습니다. 관리자에게 문의하세요.`);
        return;
      }

      // 로딩 상태 표시
      setMessage(`📥 ${programName} 다운로드 준비 중...`);

      // 다운로드 실행
      await downloadProgram('qcapture', licenseType);

      // 성공 메시지
      setMessage(`✅ ${programName} 다운로드가 시작되었습니다!`);

      // 5초 후 메시지 삭제
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } catch (error) {
      console.error('다운로드 실패:', error);

      // 오류 메시지 개선
      if (error instanceof Error) {
        if (error.message.includes('로그인이 필요')) {
          setMessage('❌ 로그인이 필요합니다. 먼저 로그인해주세요.');
        } else if (error.message.includes('권한이 없습니다')) {
          setMessage(`❌ ${programName} 사용 권한이 없습니다. 관리자에게 문의하세요.`);
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

        {/* 상태 배지 */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-light rounded">
            서비스 정상
          </span>
          <span className="text-xs text-gray-600 font-light">
            이미지 문자제거는 Q문자를 사용하세요
          </span>
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
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="qcapture_free"
                    checked={selectedPrograms['qcapture_free'] || false}
                    onChange={() => handleCheckboxChange('qcapture_free')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="qcapture_free" className="font-medium text-gray-900">
                      큐캡쳐 무료
                    </label>
                    <p className="text-sm text-gray-600">
                      파일명: {publicPrograms.find(p => p.license_type === 'free')?.filename || 'qcapture_free_v1.0.exe'}
                      {publicPrograms.find(p => p.license_type === 'free')?.fileSize && (
                        <span className="ml-2 text-gray-500">
                          ({(publicPrograms.find(p => p.license_type === 'free')?.fileSize! / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      )}
                    </p>

                    {/* 구독 상태 표시 */}
                    <p className={`text-sm font-bold mt-1 ${checkPermission('free') ? 'text-green-600' : 'text-red-500'}`}>
                      {checkPermission('free') ? '✓ 사용 가능' : '✗ 사용 권한 없음'}
                    </p>
                    {!publicPrograms.find(p => p.license_type === 'free')?.isActive && (
                      <p className="text-xs mt-1 text-orange-600">
                        ⚠️ 관리자가 파일을 업로드하지 않았습니다
                      </p>
                    )}
                  </div>
                </div>
                <TextButton
                  variant="primary"
                  size="md"
                  className="font-bold text-blue-600 text-lg hover:text-blue-700"
                  onClick={() => handleDownload('free', '큐캡쳐 무료')}
                  disabled={!isAuthenticated || !checkPermission('free') || !publicPrograms.find(p => p.license_type === 'free')?.isActive}
                >
                  다운로드
                </TextButton>
              </div>

              {/* 큐캡쳐 1개월 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="qcapture_1month"
                    checked={selectedPrograms['qcapture_1month'] || false}
                    onChange={() => handleCheckboxChange('qcapture_1month')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="qcapture_1month" className="font-medium text-gray-900">
                      큐캡쳐 1개월
                    </label>
                    <p className="text-sm text-gray-600">
                      파일명: {publicPrograms.find(p => p.license_type === '1month')?.filename || 'qcapture_1month_v2.1.exe'}
                      {publicPrograms.find(p => p.license_type === '1month')?.fileSize && (
                        <span className="ml-2 text-gray-500">
                          ({(publicPrograms.find(p => p.license_type === '1month')?.fileSize! / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      )}
                    </p>

                    {/* 구독 상태 표시 */}
                    <p className={`text-sm font-bold mt-1 ${checkPermission('month1') ? 'text-green-600' : 'text-red-500'}`}>
                      {checkPermission('month1') ? '✓ 사용 가능' : '✗ 사용 권한 없음'}
                    </p>
                    {!publicPrograms.find(p => p.license_type === '1month')?.isActive && (
                      <p className="text-xs mt-1 text-orange-600">
                        ⚠️ 관리자가 파일을 업로드하지 않았습니다
                      </p>
                    )}
                  </div>
                </div>
                <TextButton
                  variant="primary"
                  size="md"
                  className="font-bold text-blue-600 text-lg hover:text-blue-700"
                  onClick={() => handleDownload('month1', '큐캡쳐 1개월')}
                  disabled={!isAuthenticated || !checkPermission('month1') || !publicPrograms.find(p => p.license_type === '1month')?.isActive}
                >
                  다운로드
                </TextButton>
              </div>

              {/* 큐캡쳐 3개월 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="qcapture_3month"
                    checked={selectedPrograms['qcapture_3month'] || false}
                    onChange={() => handleCheckboxChange('qcapture_3month')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="qcapture_3month" className="font-medium text-gray-900">
                      큐캡쳐 3개월
                    </label>
                    <p className="text-sm text-gray-600">
                      파일명: {publicPrograms.find(p => p.license_type === '3month')?.filename || 'qcapture_3month_v3.0.exe'}
                      {publicPrograms.find(p => p.license_type === '3month')?.fileSize && (
                        <span className="ml-2 text-gray-500">
                          ({(publicPrograms.find(p => p.license_type === '3month')?.fileSize! / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      )}
                    </p>

                    {/* 구독 상태 표시 */}
                    <p className={`text-sm font-bold mt-1 ${checkPermission('month3') ? 'text-green-600' : 'text-red-500'}`}>
                      {checkPermission('month3') ? '✓ 사용 가능' : '✗ 사용 권한 없음'}
                    </p>
                    {!publicPrograms.find(p => p.license_type === '3month')?.isActive && (
                      <p className="text-xs mt-1 text-orange-600">
                        ⚠️ 관리자가 파일을 업로드하지 않았습니다
                      </p>
                    )}
                  </div>
                </div>
                <TextButton
                  variant="primary"
                  size="md"
                  className="font-bold text-blue-600 text-lg hover:text-blue-700"
                  onClick={() => handleDownload('month3', '큐캡쳐 3개월')}
                  disabled={!isAuthenticated || !checkPermission('month3') || !publicPrograms.find(p => p.license_type === '3month')?.isActive}
                >
                  다운로드
                </TextButton>
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
          {isAuthenticated && (!checkPermission('free') && !checkPermission('month1') && !checkPermission('month3')) && (
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
                  const activePrograms = localStorage.getItem('ACTIVE_PROGRAMS');
                  const allKeys = Object.keys(localStorage);
                  const fileContentKeys = allKeys.filter(key => key.startsWith('FILE_CONTENT_'));

                  console.log('=== 디버깅 정보 ===');
                  console.log('ACTIVE_PROGRAMS:', activePrograms ? JSON.parse(activePrograms) : '없음');
                  console.log('모든 localStorage 키:', allKeys);
                  console.log('FILE_CONTENT 키들:', fileContentKeys);

                  fileContentKeys.forEach(key => {
                    const content = localStorage.getItem(key);
                    console.log(`${key}: ${content ? `${(content.length / 1024 / 1024).toFixed(1)} MB` : '없음'}`);
                  });
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                localStorage 상태 확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QCapture;