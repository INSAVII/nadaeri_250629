import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrice } from '../context/PriceContext';
import { getQTextApiUrl } from '../config/constants';
import { qtextApiRequest, ApiError } from '../utils/apiClient';

// 파일 검증 결과 타입 정의
interface FileValidation {
  isValid: boolean;
  totalFiles: number;
  estimatedCost: number;
  canProcess: boolean;
  reason: string;
  supportedTypes: string[];
}

// API 설정 - 하이브리드 방식에 맞춰 동적 설정
const QTEXT_SERVICE_URL = getQTextApiUrl();

const QText: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { qtextPrice, setQtextPrice } = usePrice();
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrice, setTempPrice] = useState(qtextPrice || 100);
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState(user?.balance || 0);
  const [isProcessing, setIsProcessing] = useState(false);

  // 파일 검증 관련 상태
  const [fileValidation, setFileValidation] = useState<FileValidation>({
    isValid: false,
    totalFiles: 0,
    estimatedCost: 0,
    canProcess: false,
    reason: '',
    supportedTypes: ['JPG', 'PNG', 'GIF', 'JPEG']
  });

  // 처리 진행률 상태
  const [processingProgress, setProcessingProgress] = useState({
    current: 0,
    total: 0,
    message: ''
  });

  // 파일 가공 완료 상태
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processedFilesUrl, setProcessedFilesUrl] = useState<string | null>(null);

  // 사용자 잔액 업데이트
  useEffect(() => {
    setBalance(user?.balance || 0);
  }, [user]);

  // 가격 업데이트
  useEffect(() => {
    setTempPrice(qtextPrice || 100);
  }, [qtextPrice]);

  const handlePriceSave = () => {
    setQtextPrice(tempPrice);
    setIsEditing(false);
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');
    setProcessingComplete(false);
    setProcessedFilesUrl(null);

    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = e.target.files;
      setFiles(selectedFiles);

      try {
        const validation = await validateImageFiles(selectedFiles);
        setFileValidation(validation);

        if (!validation.isValid) {
          setError(validation.reason);
        }
      } catch (error) {
        setError('파일 검증 중 오류가 발생했습니다.');
        setFileValidation({
          isValid: false,
          totalFiles: 0,
          estimatedCost: 0,
          canProcess: false,
          reason: '파일 검증 실패',
          supportedTypes: ['JPG', 'PNG', 'GIF', 'JPEG']
        });
      }
    }
  };

  const handleFilesCancel = () => {
    setFiles(null);
    setError('');
    setSuccess('');
    setProcessingComplete(false);
    setProcessedFilesUrl(null);
    setFileValidation({
      isValid: false,
      totalFiles: 0,
      estimatedCost: 0,
      canProcess: false,
      reason: '',
      supportedTypes: ['JPG', 'PNG', 'GIF', 'JPEG']
    });

    // 파일 입력 필드 초기화
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateImageFiles = async (files: FileList): Promise<FileValidation> => {
    return new Promise((resolve) => {
      try {
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        const supportedExtensions = ['JPG', 'PNG', 'GIF', 'JPEG'];
        let validFiles = 0;
        let invalidFiles: string[] = [];

        // 각 파일 검증
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const isValidType = supportedTypes.includes(file.type.toLowerCase());
          const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB 제한

          if (!isValidType) {
            invalidFiles.push(`${file.name}: 지원하지 않는 파일 형식`);
          } else if (!isValidSize) {
            invalidFiles.push(`${file.name}: 파일 크기가 10MB를 초과`);
          } else {
            validFiles++;
          }
        }

        let isValid = false;
        let reason = '';

        // 검증 로직
        if (validFiles === 0) {
          reason = '유효한 이미지 파일이 없습니다. JPG, PNG, GIF 형식만 지원됩니다.';
        } else if (files.length > 100) {
          reason = `처리 가능한 최대 개수(100개)를 초과했습니다. 현재: ${files.length}개`;
        } else if (invalidFiles.length > 0) {
          reason = `일부 파일에 문제가 있습니다:\\n${invalidFiles.join('\\n')}`;
        } else {
          isValid = true;
        }

        const estimatedCost = validFiles * (qtextPrice || 100);
        const canProcess = isValid && user && user.balance >= estimatedCost;

        if (isValid && user && user.balance < estimatedCost) {
          reason = `예치금 부족: 필요 금액 ${estimatedCost.toLocaleString()}원, 현재 잔액 ${user.balance.toLocaleString()}원`;
        }

        resolve({
          isValid,
          totalFiles: validFiles,
          estimatedCost,
          canProcess: canProcess || false,
          reason,
          supportedTypes: supportedExtensions
        });
      } catch (error) {
        resolve({
          isValid: false,
          totalFiles: 0,
          estimatedCost: 0,
          canProcess: false,
          reason: '파일 검증 중 오류가 발생했습니다.',
          supportedTypes: ['JPG', 'PNG', 'GIF', 'JPEG']
        });
      }
    });
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setError('이미지 파일을 선택하세요.');
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

    setIsProcessing(true);
    setError('');
    setSuccess('');

    // 처리 진행률 초기화
    setProcessingProgress({
      current: 0,
      total: fileValidation.totalFiles,
      message: '예치금 차감 중...'
    });

    try {
      // === 예치금 차감 (처리 시작 전) ===
      const totalCost = fileValidation.estimatedCost;
      const fileCount = fileValidation.totalFiles;
      const newBalance = user.balance - totalCost;

      // 🆕 로컬 상태만 업데이트 (AuthContext 호출 제거)
      console.log('🆕 QText - AuthContext updateUserBalance 호출 차단됨');
      console.log('🆕 로컬 상태만 업데이트:', newBalance);
      setBalance(newBalance);

      // === 파일 업로드 및 처리 ===
      // FormData 생성
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      // 사용자 정보 추가
      if (user) {
        formData.append('user_name', user.name || '사용자');
        formData.append('user_id', user.id || 'unknown');
      }

      // 처리 중 메시지 업데이트
      setProcessingProgress(prev => ({
        ...prev,
        message: 'AI 모델이 텍스트를 감지하고 제거 중...'
      }));

      const blob = await qtextApiRequest('/api/qtext/process-images', {
        method: 'POST',
        body: formData
      });

      console.log('API 응답 성공 - 파일 다운로드 준비');

      // 파일 다운로드 처리
      setProcessingProgress(prev => ({
        ...prev,
        message: '문자 제거된 이미지 준비 중...'
      }));

      const url = window.URL.createObjectURL(blob);
      setProcessedFilesUrl(url);

      // 처리 완료 상태 설정
      setProcessingProgress({
        current: fileCount,
        total: fileCount,
        message: '처리 완료!'
      });

      setProcessingComplete(true);
      setSuccess(`문자 제거 완료! ${fileCount}개 파일 처리, ${totalCost.toLocaleString()}원 차감, 남은 예치금: ${newBalance.toLocaleString()}원`);

      // 파일 상태 초기화
      setFiles(null);
      setFileValidation({
        isValid: false,
        totalFiles: 0,
        estimatedCost: 0,
        canProcess: false,
        reason: '',
        supportedTypes: ['JPG', 'PNG', 'GIF', 'JPEG']
      });

    } catch (e) {
      setProcessingProgress({
        current: 0,
        total: 0,
        message: '오류 발생'
      });

      // ApiError 처리
      if (e instanceof ApiError) {
        if (e.status === 0) {
          // 네트워크 오류
          setError(`네트워크 오류: ${e.message}`);
        } else {
          // API 오류
          setError(`서버 오류: ${e.message}`);
        }
      } else {
        setError(`이미지 처리 중 오류가 발생했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadProcessedFiles = () => {
    if (!processingComplete || !processedFilesUrl) {
      setError('문자 제거가 완료되지 않았습니다.');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = processedFilesUrl;
      link.download = '문자제거완료_이미지들.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('문자 제거된 이미지 다운로드가 시작되었습니다.');
    } catch (error) {
      setError('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="page-container py-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="text-purple-600 mr-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-lg text-blue-600 font-bold">
              큐캡쳐로 캡쳐한이미지를 대량 문자제거처리해서 목록이미지로 사용하게 합니다 최대400개까지 업로드하세요
            </p>
          </div>
        </div>

        {/* 상태 배지 및 가격 정보 (QName 스타일) */}
        <div className="flex items-center justify-between space-x-2 mb-4">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-light rounded">문자 제거 대기</span>
            <span className="text-xs text-gray-600 font-light">1회 최대 100개 이미지까지 처리 가능</span>
            <span className="text-xs text-gray-400">|</span>
            {user?.role === 'admin' ? (
              isEditing ? (
                <>
                  <input type="number" min={0} value={tempPrice} onChange={e => setTempPrice(Number(e.target.value))} className="w-16 px-1 py-0.5 text-xs border rounded" />
                  <button onClick={handlePriceSave} className="text-xs text-green-600 hover:text-green-800 ml-1">저장</button>
                  <button onClick={() => { setIsEditing(false); setTempPrice(qtextPrice || 100); }} className="text-xs text-gray-500 hover:text-gray-700 ml-1">취소</button>
                </>
              ) : (
                <>
                  <span className="text-xs text-purple-600 font-medium">{(qtextPrice || 100).toLocaleString()}원/개</span>
                  <button onClick={() => setIsEditing(true)} className="text-xs text-gray-500 hover:text-gray-700 ml-1" title="가격 수정">✏️</button>
                </>
              )
            ) : (
              <span className="text-xs text-purple-600 font-medium">{(qtextPrice || 100).toLocaleString()}원/개</span>
            )}
            {user && (
              <span className="text-xs text-gray-500 ml-2">예치금: {balance.toLocaleString()}원</span>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded p-6 mb-6">
        {/* 파일 업로드 안내 */}
        <div className="mb-4">
          <p className="text-base text-blue-800 font-semibold">
            <b>JPG, PNG, GIF</b> 형식의 이미지를 업로드하세요.
          </p>
        </div>

        {/* 파일 업로드 영역 */}
        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center mb-3">
          <p className="text-sm font-light mb-2">문자가 포함된 이미지 파일들을 업로드하세요</p>

          {/* 커스텀 파일 선택 버튼 */}
          <div className="mb-2">
            <label className="inline-block px-6 py-2 bg-purple-500 text-white rounded font-light cursor-pointer hover:bg-purple-600 transition-colors">
              📁 파일 선택
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                multiple
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>
          </div>

          {/* 파일 선택 상태 표시 */}
          {files && files.length > 0 && (
            <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">
                  선택된 파일: {files.length}개
                </span>
                <button
                  onClick={handleFilesCancel}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  파일 선택 취소
                </button>
              </div>

              {fileValidation.totalFiles > 0 && (
                <div className="text-xs text-purple-600 space-y-1">
                  <p>✅ 유효한 파일: {fileValidation.totalFiles}개</p>
                  <p>💰 예상 비용: {fileValidation.estimatedCost.toLocaleString()}원</p>
                  <p>📊 예치금: {balance.toLocaleString()}원</p>
                  {fileValidation.canProcess ? (
                    <p className="text-green-600">✅ 처리 가능</p>
                  ) : (
                    <p className="text-red-600">❌ {fileValidation.reason}</p>
                  )}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-600">
                파일 목록: {Array.from(files).map(f => f.name).slice(0, 3).join(', ')}
                {files.length > 3 && ` 외 ${files.length - 3}개`}
              </div>
            </div>
          )}
        </div>

        {/* 처리 버튼 영역 */}
        <div className="border rounded p-4 mb-3 bg-purple-50 border-purple-200">
          <button
            className={`w-full px-32 py-3 text-white rounded font-light ${fileValidation.canProcess && !isProcessing
              ? 'bg-purple-500 hover:bg-purple-600 text-sm'
              : 'bg-gray-400 cursor-not-allowed text-base'
              }`}
            onClick={handleUpload}
            disabled={!fileValidation.canProcess || isProcessing}
          >
            {isProcessing ? '🤖 AI가 문자를 제거하는 중...' : '1000X1000 Pixcel 큐캡쳐이미지 문자제거시작'}
          </button>

          {/* 처리 진행률 표시 */}
          {isProcessing && (
            <div className="mt-3 p-3 bg-white border border-purple-300 rounded">
              <div className="flex justify-between text-sm text-purple-700 mb-2">
                <span>진행률: {processingProgress.current}/{processingProgress.total}</span>
                <span>{processingProgress.total > 0 ? Math.round((processingProgress.current / processingProgress.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress.total > 0 ? (processingProgress.current / processingProgress.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-purple-600">{processingProgress.message}</p>
            </div>
          )}
        </div>

        {/* 안내 정보 */}
        <div className="bg-purple-50 border border-purple-200 rounded p-4 mb-4">
          <h3 className="text-sm font-light mb-2 text-purple-800">AI 문자 제거 안내</h3>
          <div className="text-xs text-purple-700 font-light">
            <p>• AI가 감지된 텍스트를 자연스럽게 제거하고 배경을 복원합니다</p>
            <p>• 원본 이미지 품질과 레이아웃은 최대한 보존됩니다</p>
            <p>• 처리 시간: 이미지 1개당 약 6초 소요</p>
            <p>• 지원 형식: JPG, PNG, GIF (개당 최대 10MB, 최대 100개)</p>
            <p>• 캡쳐 프로그램으로 캡쳐한 이미지(1000x1000 픽셀)를 목록이미지로 사용하기 위해서 문자를 제거합니다.</p>
            <p>• 고급 머신러닝 모델로 정밀한 텍스트 감지 및 지능적 배경 복원을 제공합니다</p>
          </div>
        </div>

        {/* 오류 및 성공 메시지 */}
        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{error}</div>}
        {success && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">{success}</div>}
      </div>

      {/* 완성파일 다운로드 섹션 */}
      {processingComplete && (
        <div className="border rounded p-6 mb-6 bg-green-50 border-green-200">
          <h2 className="text-lg font-light mb-4 text-green-800">문자 제거 완료</h2>
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-700 font-light">
              <p>✅ AI 문자 제거가 완료되었습니다.</p>
              <p className="text-xs text-green-600 mt-1">문자가 제거된 이미지들을 다운로드하세요.</p>
            </div>
            <button
              onClick={handleDownloadProcessedFiles}
              className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-light flex items-center"
            >
              📥 문자제거완료 이미지 다운로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QText;
