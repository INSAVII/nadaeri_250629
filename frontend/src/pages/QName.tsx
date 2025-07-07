import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrice } from '../context/PriceContext';
import { useNavigate } from 'react-router-dom';
import { getQNameApiUrl, getApiUrl } from '../config/constants';
import { apiPost, qnameApiRequest, ApiError } from '../utils/apiClient';
import * as XLSX from 'xlsx';

// 파일 검증 결과 타입 정의
interface FileValidation {
  isValid: boolean;
  totalRows: number;
  estimatedCost: number;
  canProcess: boolean;
  reason: string;
}

// 표준 양식 헤더 및 안내문 정의
const STANDARD_HEADER = [
  '상품코드', '메인키워드', 'NAVERCODE', '카테분류형식', 'SEO상품명', '연관검색어', '네이버태그'
];

// 안내문 각 셀 분산 (엑셀용)
const STANDARD_GUIDE_ROW = [
  '*메인키워드는 좋은상품명을찾기위해서 매우중요한입력값입니다.',
  '*가장핵심적인 상품명을표현하는단어+용도재질+특징 등으로 최소3단어이상구성',
  '*상품코드는 도매몰상품코드또는자체상품코드사용',
  '*약95%이상의 카테고리번호가 일치합니다.',
  '*과도한 400개 이상을 한번에 처리하지마시고 조금 여유를가지고 기다려주세요.',
  '*3행부터 상품코드와 메인키워드를 입력하고 업로드 해주세요.',
  ''
];

// 표준 헤더 및 예시 데이터(캡처와 동일)
const SIMPLE_HEADER = [
  '상품코드', '메인키워드', 'NAVERCODE', '카테분류형식', 'SEO상품명', '연관검색어', '네이버태그'
];
const SIMPLE_EXAMPLE = [
  'Manipalja104', '청소 블랙 솔 세탁', '', '', '', '', ''
];

// 안전한 API URL 설정
const getSafeQNameApiUrl = (): string => {
  try {
    const url = getQNameApiUrl();
    console.log('🔗 QName API URL 설정:', url);
    return url;
  } catch (error) {
    console.error('❌ QName API URL 설정 오류:', error);
    // 기본값 반환
    return 'http://localhost:8004';
  }
};

const QNAME_SERVICE_URL = getSafeQNameApiUrl();

const QName: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { qnamePrice, setQnamePrice } = usePrice();
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrice, setTempPrice] = useState(qnamePrice);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState(user?.balance || 0);
  const [isProcessing, setIsProcessing] = useState(false);

  // 파일 검증 관련 상태
  const [fileValidation, setFileValidation] = useState<FileValidation>({
    isValid: false,
    totalRows: 0,
    estimatedCost: 0,
    canProcess: false,
    reason: ''
  });

  // 파일 가공 완료 상태
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null);

  // 처리 진행률 상태 추가
  const [processingProgress, setProcessingProgress] = useState({
    current: 0,
    total: 0,
    message: ''
  });

  // 예상 처리 시간 상태 추가 (간단한 계산용)
  const [estimatedTime, setEstimatedTime] = useState('');

  // 사용잔액 업데이트
  useEffect(() => {
    setBalance(user?.balance || 0);
  }, [user]);

  // 가격 업데이트
  useEffect(() => {
    setTempPrice(qnamePrice);
  }, [qnamePrice]);

  const handlePriceSave = () => {
    setQnamePrice(tempPrice);
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');
    setProcessingComplete(false);
    setProcessedFileUrl(null);

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      try {
        const validation = await validateExcelFile(selectedFile);
        setFileValidation(validation);

        if (!validation.isValid) {
          setError(validation.reason);
        }
      } catch (error) {
        setError('파일 검증 중 오류가 발생했습니다.');
        setFileValidation({
          isValid: false,
          totalRows: 0,
          estimatedCost: 0,
          canProcess: false,
          reason: '파일 검증 실패'
        });
      }
    }
  };

  const handleFileCancel = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setProcessingComplete(false);
    setProcessedFileUrl(null);
    setFileValidation({
      isValid: false,
      totalRows: 0,
      estimatedCost: 0,
      canProcess: false,
      reason: ''
    });

    // 파일 입력 필드 초기화
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateExcelFile = async (file: File): Promise<FileValidation> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

            // 표준 헤더 검증 (1행)
            const headers = jsonData[0] as string[];
            const isHeaderMatch =
              headers && headers.length === STANDARD_HEADER.length &&
              headers.every((h, i) => h === STANDARD_HEADER[i]);
            if (!isHeaderMatch) {
              resolve({
                isValid: false,
                totalRows: 0,
                estimatedCost: 0,
                canProcess: false,
                reason: '업로드 파일이 표준 양식과 일치하지 않습니다. 반드시 제공된 표준양식을 사용해 주세요.'
              });
              return;
            }

            // 3행부터 데이터 입력 검증 (2행은 안내문, 3행부터 데이터)
            const dataRows = jsonData.slice(2); // 0:헤더, 1:안내문, 2~:데이터
            const totalRows = dataRows.length;

            if (totalRows === 0) {
              resolve({
                isValid: false,
                totalRows: 0,
                estimatedCost: 0,
                canProcess: false,
                reason: '3행부터 데이터를 입력해야 합니다. 표준양식을 참고하세요.'
              });
              return;
            }

            if (totalRows > 500) {
              resolve({
                isValid: false,
                totalRows: totalRows,
                estimatedCost: totalRows * qnamePrice,
                canProcess: false,
                reason: '최대 500개 상품까지만 처리 가능합니다.'
              });
              return;
            }

            const estimatedCost = totalRows * qnamePrice;
            const canProcess = balance >= estimatedCost;

            resolve({
              isValid: true,
              totalRows: totalRows,
              estimatedCost: estimatedCost,
              canProcess: canProcess,
              reason: canProcess ? '' : `잔액이 부족합니다. 필요: ${estimatedCost}원, 보유: ${balance}원`
            });
          } catch (error) {
            resolve({
              isValid: false,
              totalRows: 0,
              estimatedCost: 0,
              canProcess: false,
              reason: '엑셀 파일 형식이 올바르지 않습니다.'
            });
          }
        };
        reader.onerror = () => {
          resolve({
            isValid: false,
            totalRows: 0,
            estimatedCost: 0,
            canProcess: false,
            reason: '파일 읽기에 실패했습니다.'
          });
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        resolve({
          isValid: false,
          totalRows: 0,
          estimatedCost: 0,
          canProcess: false,
          reason: '파일 검증 중 오류가 발생했습니다.'
        });
      }
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        SIMPLE_HEADER,
        SIMPLE_EXAMPLE
      ];
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);
      XLSX.utils.book_append_sheet(workbook, worksheet, '표준양식');
      XLSX.writeFile(workbook, 'QName_표준엑셀양식.xlsx');
      setSuccess('표준 엑셀양식이 다운로드되었습니다.');
    } catch (error) {
      setError('표준양식 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleUpload = async () => {
    console.log('=== handleUpload 함수 시작 (예치금 차감 후처리 방식) ===');
    console.log('현재 상태:', { file, user, fileValidation, isProcessing });

    // 🆕 상세한 함수 존재 여부 확인
    console.log('=== 함수 존재 여부 확인 ===');
    console.log('setBalance 함수:', typeof setBalance);
    console.log('apiPost 함수:', typeof apiPost);
    console.log('qnameApiRequest 함수:', typeof qnameApiRequest);
    console.log('checkQNameServiceStatus 함수:', typeof checkQNameServiceStatus);

    // 🆕 호출 스택 추적
    console.log('=== 호출 스택 ===');
    const stack = new Error().stack;
    console.log('현재 호출 스택:', stack);

    // 🆕 window 객체 확인
    console.log('=== window 객체 확인 ===');
    console.log('window.authUser:', (window as any).authUser);
    console.log('window.updateUserBalance:', typeof (window as any).updateUserBalance);

    if (!file) {
      setError('엑셀 파일을 선택하세요.');
      return;
    }
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }
    if (!fileValidation.canProcess) {
      setError(fileValidation.reason || '파일을 처리할 수 없습니다.');
      return;
    }

    console.log('모든 조건 통과! 파일 처리 우선 실행');
    setIsProcessing(true);
    setError('');
    setSuccess('');

    // 간단한 예상 처리 시간 계산 (1개당 1.8초 기준)
    const estimatedSeconds = fileValidation.totalRows * 1.8;
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
    setEstimatedTime(`${estimatedMinutes}분`);

    // 처리 진행률 초기화 (단계별 표시)
    setProcessingProgress({
      current: 0,
      total: fileValidation.totalRows,
      message: `1/3 단계: QName 서비스 연결 확인 중... (예상 처리시간: ${estimatedMinutes}분)`
    });

    try {
      // === QName 서비스 상태 확인 (1단계) ===
      console.log('=== QName 서비스 상태 확인 ===');
      const isServiceAvailable = await checkQNameServiceStatus();
      if (!isServiceAvailable) {
        throw new Error('QName 서비스에 연결할 수 없습니다. 서비스가 실행 중인지 확인해주세요.');
      }

      // === 파일 업로드 및 처리 (2단계) ===
      console.log('=== 파일 업로드 시작 ===');
      console.log('QNAME_SERVICE_URL:', QNAME_SERVICE_URL);
      console.log('파일 정보:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // API URL 유효성 검사
      if (!QNAME_SERVICE_URL || QNAME_SERVICE_URL === '') {
        throw new Error('QName 서비스 URL이 설정되지 않았습니다.');
      }

      // FormData 생성 및 검증
      const formData = new FormData();
      formData.append('file', file);

      console.log('FormData 생성 완료:', {
        hasFile: formData.has('file'),
        fileCount: formData.getAll('file').length
      });

      // 2단계 진행률 업데이트
      setProcessingProgress(prev => ({
        ...prev,
        message: '2/3 단계: 파일 업로드 및 처리 중... (최대 5분 소요)'
      }));

      console.log('🔄 QName API 호출 시작');
      console.log('요청 URL:', `${QNAME_SERVICE_URL}/api/qname/process-file`);
      console.log('요청 메서드: POST');

      // 파일 업로드 및 처리 (예치금 차감 없이)
      const blob = await qnameApiRequest('/api/qname/process-file', {
        method: 'POST',
        body: formData
      });

      console.log('API 응답 성공 - 파일 다운로드 준비');
      console.log('응답 blob 크기:', blob.size);
      console.log('응답 blob 타입:', blob.type);

      // === 예치금 차감 (3단계 - 파일 처리 완료 후) ===
      console.log('=== 파일 처리 완료! 예치금 차감 시작 ===');
      setProcessingProgress(prev => ({
        ...prev,
        message: '3/3 단계: 예치금 차감 중...'
      }));

      const totalCost = fileValidation.estimatedCost;
      const rowCount = fileValidation.totalRows;
      const newBalance = user.balance - totalCost;

      console.log('=== 예치금 차감 (파일 처리 완료 후) ===');
      console.log('현재 잔액:', user.balance);
      console.log('차감 금액:', totalCost);
      console.log('차감 후 잔액:', newBalance);

      // 🆕 로컬 상태만 업데이트 (AuthContext 호출 완전 차단)
      console.log('🆕 AuthContext updateUserBalance 호출 차단됨');
      console.log('🆕 로컬 상태만 업데이트:', newBalance);
      setBalance(newBalance);
      console.log('✅ 로컬 예치금 업데이트 완료:', newBalance);

      // 파일 다운로드 처리
      console.log('응답 blob 변환 시작');
      const url = window.URL.createObjectURL(blob);
      setProcessedFileUrl(url);

      // 처리 완료 상태 설정
      setProcessingProgress({
        current: rowCount,
        total: rowCount,
        message: '처리 완료!'
      });

      setProcessingComplete(true);
      setSuccess(`파일 가공 완료! ${rowCount}건 처리, ${totalCost.toLocaleString()}원 차감, 남은 예치금: ${newBalance.toLocaleString()}원`);

      // 간단한 완료 효과음 재생 (안전한 방식)
      try {
        playCompletionSound();
      } catch (error) {
        console.log('효과음 재생 실패 (무시됨):', error);
      }

      // 파일 상태 초기화
      setFile(null);
      setFileValidation({
        isValid: false,
        totalRows: 0,
        estimatedCost: 0,
        canProcess: false,
        reason: ''
      });

    } catch (e: any) {
      console.error('=== 파일 업로드 오류 상세 ===');
      console.error('오류 타입:', typeof e);
      console.error('오류 이름:', e?.name);
      console.error('오류 메시지:', e?.message);
      console.error('오류 스택:', e?.stack);
      console.error('전체 오류 객체:', e);

      // 오류 메시지 초기화
      let errorMessage = '알 수 없는 오류가 발생했습니다.';

      // ApiError 처리
      if (e instanceof ApiError) {
        if (e.status === 0) {
          errorMessage = `네트워크 오류: ${e.message}`;
        } else {
          errorMessage = `서버 오류: ${e.message}`;
        }
      } else {
        // 기존 타임아웃 및 네트워크 오류 구분
        if (e?.name === 'AbortError') {
          errorMessage = '파일 처리가 5분을 초과했습니다. 파일 크기를 줄이거나 나중에 다시 시도해주세요.';
        } else if (e?.message?.includes('timeout') || e?.message?.includes('타임아웃')) {
          errorMessage = 'API 호출이 시간 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.';
        } else if (e?.message?.includes('Failed to fetch') || e?.message?.includes('NetworkError')) {
          errorMessage = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
        } else if (e?.message?.includes('QName 서비스에 연결할 수 없습니다')) {
          errorMessage = 'QName 서비스가 실행되지 않고 있습니다. 관리자에게 문의해주세요.';
        } else {
          errorMessage = `엑셀 파일 처리 중 오류가 발생했습니다: ${e?.message || '알 수 없는 오류'}`;
        }
      }

      // 추가 디버깅 정보
      console.error('=== 디버깅 정보 ===');
      console.error('파일 정보:', {
        name: file?.name,
        size: file?.size,
        type: file?.type,
        lastModified: file?.lastModified
      });
      console.error('사용자 정보:', {
        id: user?.id,
        balance: user?.balance,
        hasToken: !!user?.token
      });
      console.error('API URL:', QNAME_SERVICE_URL);
      console.error('현재 시간:', new Date().toISOString());

      // 오류 시 진행률 초기화
      setProcessingProgress({
        current: 0,
        total: 0,
        message: '오류 발생'
      });

      setError(errorMessage);
    } finally {
      console.log('=== handleUpload 함수 종료 ===');
      setIsProcessing(false);
    }
  };

  const handleDownloadProcessedFile = () => {
    if (!processingComplete || !processedFileUrl) {
      setError('가공이 완료되지 않았습니다.');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = processedFileUrl;
      link.download = '가공완료_상품명카테키워드.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('완성파일 다운로드가 시작되었습니다.');
    } catch (error) {
      setError('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  // QName 서비스 상태 확인 함수
  const checkQNameServiceStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${QNAME_SERVICE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('QName 서비스 상태 확인 실패:', error);
      return false;
    }
  };

  // 간단한 완료 효과음 재생 함수
  const playCompletionSound = () => {
    try {
      // 브라우저 호환성을 위한 간단한 비프음 생성
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('효과음 재생 실패:', error);
    }
  };

  const safeUpdateBalance = async (newBalance: number) => {
    // 이 함수는 이전 코드에서 사용되었지만 현재 코드에서는 사용되지 않습니다.
    // 이 함수의 구현은 이전 코드에서 가져와야 합니다.
  };

  return (
    <div className="page-container py-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="text-green-600 mr-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-600 mb-1">SEO상품명 NAVER카테번호 키워드생성최대500개까지</h1>
            <p className="text-sm text-gray-600 font-light">
              엑셀에 상품코드와 상품키워드3개이상 기입해서 업로드하면 SEO최적화 상품명과 카테고리 키워드가 자동기입
            </p>
          </div>
        </div>

        {/* 가격 설정/표시 */}
        <div className="flex items-center justify-between space-x-2 mb-4">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-light rounded">생성 대기</span>
            <span className="text-xs text-gray-600 font-light">1회 최대 500개까지 처리 가능</span>
            <span className="text-xs text-gray-400">|</span>
            {user?.role === 'admin' ? (
              isEditing ? (
                <>
                  <input type="number" min={0} value={tempPrice} onChange={e => setTempPrice(Number(e.target.value))} className="w-16 px-1 py-0.5 text-xs border rounded" />
                  <button onClick={handlePriceSave} className="text-xs text-green-600 hover:text-green-800 ml-1">저장</button>
                  <button onClick={() => { setIsEditing(false); setTempPrice(qnamePrice); }} className="text-xs text-gray-500 hover:text-gray-700 ml-1">취소</button>
                </>
              ) : (
                <>
                  <span className="text-xs text-blue-600 font-medium">{qnamePrice.toLocaleString()}원/건</span>
                  <button onClick={() => setIsEditing(true)} className="text-xs text-gray-500 hover:text-gray-700 ml-1" title="가격 수정">✏️</button>
                </>
              )
            ) : (
              <span className="text-xs text-blue-600 font-medium">{qnamePrice.toLocaleString()}원/건</span>
            )}
            {user && (
              <span className="text-xs text-gray-500 ml-2">예치금: {balance.toLocaleString()}원</span>
            )}
          </div>

          {/* 엑셀 양식 다운로드 버튼 - 우측 정렬 */}
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-light"
            >
              📥 업로드표준엑셀양식
            </button>
          </div>
        </div>
      </div>

      <div className="border rounded p-6 mb-6">
        {/* 엑셀 양식 다운로드 버튼 설명 */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 font-light">
            표준 양식의 <b>A열(상품코드)</b>와 <b>B열(메인키워드)</b>만 입력해서 업로드하세요.<br />
            나머지 열은 자동으로 채워집니다.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center mb-3">
          <p className="text-sm font-light mb-2">상품코드와 메인키워드를 입력한 표준엑셀양식파일을업로드하세요</p>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="mb-2" />

          {/* 파일 선택 상태 표시 및 취소 버튼 */}
          {file && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-700 font-light mb-2">
                선택된 파일: <span className="font-medium">{file.name}</span>
              </p>

              {/* 파일 검증 결과 표시 */}
              {fileValidation.totalRows > 0 && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-800 font-light">
                    <div className="flex justify-between items-center mb-1">
                      <span>총 처리량:</span>
                      <span className="font-medium">{fileValidation.totalRows}개</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span>예상 비용:</span>
                      <span className="font-medium">{fileValidation.estimatedCost.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>처리 가능:</span>
                      <span className={`font-medium ${fileValidation.canProcess ? 'text-green-600' : 'text-red-600'}`}>
                        {fileValidation.canProcess ? '가능' : '불가능'}
                      </span>
                    </div>
                  </div>
                  {!fileValidation.canProcess && fileValidation.reason && (
                    <p className="text-xs text-red-600 mt-1 font-light">{fileValidation.reason}</p>
                  )}
                </div>
              )}

              <div className="flex justify-center space-x-2">
                <button
                  onClick={handleFileCancel}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-light"
                >
                  파일 취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 대량파일가공시작 버튼 - 별도 박스로 분리 */}
        <div className="border rounded p-4 text-center mb-3 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-light mb-3 text-blue-800">파일 가공 시작</h3>
          <button
            className={`w-full px-32 py-3 text-white rounded font-light ${fileValidation.canProcess && !isProcessing
              ? 'bg-blue-500 hover:bg-blue-600 text-sm'
              : 'bg-purple-500 cursor-not-allowed text-base'
              }`}
            onClick={() => {
              console.log('=== 정상 버튼 클릭됨! ===');
              console.log('버튼 클릭 시점 상태:');
              console.log('- fileValidation.canProcess:', fileValidation.canProcess);
              console.log('- isProcessing:', isProcessing);
              console.log('- file:', file?.name);
              console.log('- user:', user?.id);
              console.log('handleUpload 함수 호출 시작');
              handleUpload();
            }}
            disabled={!fileValidation.canProcess || isProcessing}
          >
            {isProcessing ? '🌸 처리중입니다 100개 처리8분소요. 대기가 많으면 더걸림. 완료될때까지 버튼 클릭금지!' : '대량파일가공시작'}
          </button>

          {/* 버튼 상태 표시 */}
          <div className="mt-2 p-2 bg-white border border-blue-300 rounded text-xs">
            <p className="text-gray-600">버튼 상태:
              <span className={`ml-1 font-medium ${fileValidation.canProcess && !isProcessing ? 'text-green-600' : 'text-red-600'}`}>
                {fileValidation.canProcess && !isProcessing ? '활성화' : '비활성화'}
              </span>
            </p>
            <p className="text-gray-500">조건: canProcess={fileValidation.canProcess.toString()}, isProcessing={isProcessing.toString()}</p>
          </div>

          {/* 처리 진행률 표시 */}
          {isProcessing && (
            <div className="mt-3 p-3 bg-white border border-blue-300 rounded">
              {/* 예상 처리 시간 표시 */}
              {estimatedTime && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-center">
                  <p className="text-lg font-bold text-green-800">
                    예상 처리시간: {estimatedTime}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-800 font-medium">
                  {processingProgress.message}
                </span>
                <span className="text-xs text-blue-600">
                  {processingProgress.current}/{processingProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: processingProgress.total > 0
                      ? `${(processingProgress.current / processingProgress.total) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* 디버깅 버튼 */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-center">
          <h4 className="text-sm font-medium text-blue-800 mb-2">🔍 fileValidation 디버깅</h4>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-light hover:bg-blue-600"
            onClick={() => {
              console.log('=== fileValidation 디버깅 ===');
              console.log('fileValidation 상태:', fileValidation);
              console.log('user 정보:', user);
              console.log('qnamePrice:', qnamePrice);

              if (user) {
                console.log('사용자 잔액:', user.balance);
                console.log('예상 비용:', fileValidation.estimatedCost);
                console.log('잔액 >= 비용:', user.balance >= fileValidation.estimatedCost);
              }

              console.log('canProcess 조건 분석:');
              console.log('- isValid:', fileValidation.isValid);
              console.log('- user 존재:', !!user);
              console.log('- 잔액 충분:', user ? user.balance >= fileValidation.estimatedCost : 'N/A');
              console.log('- 최종 canProcess:', fileValidation.canProcess);

              alert(`디버깅 정보가 콘솔에 출력되었습니다.\n\n현재 상태:\n- isValid: ${fileValidation.isValid}\n- totalRows: ${fileValidation.totalRows}\n- estimatedCost: ${fileValidation.estimatedCost}원\n- canProcess: ${fileValidation.canProcess}\n- reason: ${fileValidation.reason || '없음'}`);
            }}
          >
            🔍 fileValidation 상태 확인
          </button>
          <p className="text-xs text-blue-600 mt-1">
            현재 fileValidation 상태를 상세히 확인하여 왜 처리 불가 판정이 나는지 파악합니다.
          </p>
        </div>

        <p className="text-xs text-gray-500 font-light mt-2">
          지원 형식: XLSX, XLS (최대 500개 상품)
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="text-sm font-light mb-2 text-blue-800">엑셀 파일 형식 안내</h3>
          <div className="text-xs text-blue-700 font-light">
            <p>A열:상품코드, B열:메인키워드, C열:NAVERCODE, D열:카테분류형식, E열:SEO상품명, F열:연관검색어, G열:네이버태그</p>
          </div>
        </div>

        {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-sm">{success}</div>}
      </div>

      {/* 완성파일 다운로드 섹션 */}
      {processingComplete && (
        <div className="border rounded p-6 mb-6 bg-green-50 border-green-200">
          <h2 className="text-lg font-light mb-4 text-green-800">가공 완료</h2>
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-700 font-light">
              <p>✅ 파일 가공이 완료되었습니다.</p>
              <p className="text-xs text-green-600 mt-1">완성된 파일을 다운로드하세요.</p>
            </div>
            <button
              onClick={handleDownloadProcessedFile}
              className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-light flex items-center"
            >
              📥 완성파일다운로드
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <b>업로드 표준양식 사용법 안내</b>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>엑셀 표준양식 파일을 다운로드하여 2행부터 데이터를 입력하세요.</li>
          <li>표준양식의 헤더(1행)는 절대 수정하지 마세요.</li>
          <li>.xls, .xlsx 모두 업로드 가능하며, 결과물은 항상 .xlsx로 제공됩니다.</li>
          <li>파일을 업로드하면 자동으로 표준양식 일치 여부를 검사합니다.</li>
          <li>양식이 다르거나 2행부터 데이터가 없으면 가공이 불가합니다.</li>
        </ul>
        <div style={{ marginTop: 8 }}>
          <button onClick={handleDownloadTemplate} style={{ padding: '6px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            엑셀 표준양식 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}

export default QName;
