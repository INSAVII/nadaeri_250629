import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrice } from '../context/PriceContext';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

// 파일 검증 결과 타입 정의
interface FileValidation {
  isValid: boolean;
  totalRows: number;
  estimatedCost: number;
  canProcess: boolean;
  reason: string;
}

// API 설정
const QNAME_SERVICE_URL = 'http://localhost:8002';

const QName: React.FC = () => {
  const { user, isAuthenticated, isLoading, updateUserBalance } = useAuth();
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

  // 사용자 잔액 업데이트
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
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          if (!data) {
            reject('파일 읽기 실패');
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          let totalRows = 0;
          let isValid = false;
          let reason = '';

          // 2행부터 시작하여 A열과 B열이 모두 존재하는 셀을 카운트
          for (let i = 1; i < json.length; i++) {
            const row = json[i] as any[];
            const cellA = row[0]; // A열 (상품코드)
            const cellB = row[1]; // B열 (메인키워드)

            if (cellA && cellB && cellA.toString().trim() !== '' && cellB.toString().trim() !== '') {
              totalRows++;
            } else {
              break;
            }
          }

          // 검증 로직
          if (totalRows === 0) {
            reason = '유효한 데이터가 없습니다. A열(상품코드)과 B열(메인키워드)이 모두 입력된 행이 필요합니다.';
          } else if (totalRows > 500) {
            reason = `처리 가능한 최대 개수(500개)를 초과했습니다. 현재: ${totalRows}개`;
          } else {
            isValid = true;
          }

          const estimatedCost = totalRows * qnamePrice;
          const canProcess = isValid && user && user.balance >= estimatedCost;

          if (isValid && user && user.balance < estimatedCost) {
            reason = `예치금 부족: 필요 금액 ${estimatedCost.toLocaleString()}원, 현재 잔액 ${user.balance.toLocaleString()}원`;
          }

          resolve({
            isValid,
            totalRows,
            estimatedCost,
            canProcess: canProcess || false,
            reason
          });
        } catch (error) {
          reject('파일 형식이 올바르지 않습니다.');
        }
      };
      reader.onerror = () => reject('파일 읽기 실패');
      reader.readAsBinaryString(file);
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      const header = [
        '상품코드',
        '메인키워드',
        'NAVERCODE',
        '카테분류형식',
        'SEO상품명',
        '연관검색어',
        '네이버태그'
      ];
      const exampleRow = [
        'MYSELLING1004',
        '틈새 브러쉬 세탁용',
        '', '', '', '', ''
      ];
      const csvData = [header, exampleRow];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(csvData);

      const colWidths = [
        { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'sheet1');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '상품명카테키워드표준양식.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('파일 다운로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleUpload = async () => {
    console.log('=== handleUpload 함수 시작 ===');
    console.log('현재 상태:', { file, user, fileValidation, isProcessing });

    if (!file) {
      console.log('조건 실패: file이 없음');
      setError('엑셀 파일을 선택하세요.');
      return;
    }
    if (!user) {
      console.log('조건 실패: user가 없음');
      setError('로그인이 필요합니다.');
      return;
    }
    if (!fileValidation.canProcess) {
      console.log('조건 실패: fileValidation.canProcess가 false');
      console.log('fileValidation:', fileValidation);
      setError(fileValidation.reason || '파일을 처리할 수 없습니다.');
      return;
    }

    console.log('모든 조건 통과! 예치금 차감 및 API 호출 시작');
    setIsProcessing(true);
    setError('');
    setSuccess('');

    // 처리 진행률 초기화
    setProcessingProgress({
      current: 0,
      total: fileValidation.totalRows,
      message: '예치금 차감 중...'
    });

    try {
      // === 예치금 차감 (처리 시작 전) ===
      const totalCost = fileValidation.estimatedCost;
      const rowCount = fileValidation.totalRows;
      const newBalance = user.balance - totalCost;

      console.log('=== 예치금 차감 시작 ===');
      console.log('현재 잔액:', user.balance);
      console.log('차감 금액:', totalCost);
      console.log('차감 후 잔액:', newBalance);

      // 사용자 잔액 업데이트 (AuthContext를 통해 실제 API 호출)
      updateUserBalance(newBalance);
      setBalance(newBalance);

      console.log('예치금 차감 완료');

      // === 파일 업로드 및 처리 ===
      console.log('=== 파일 업로드 시작 ===');
      console.log('QNAME_SERVICE_URL:', QNAME_SERVICE_URL);
      console.log('파일명:', file.name);
      console.log('파일 크기:', file.size);
      console.log('파일 타입:', file.type);

      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      console.log('FormData 생성 완료');
      console.log('FormData 내용:', Array.from(formData.entries()));

      // API 호출
      console.log('API 호출 시도:', `${QNAME_SERVICE_URL}/api/qname/process-file`);
      console.log('요청 시작 시간:', new Date().toISOString());

      // 처리 중 메시지 업데이트
      setProcessingProgress(prev => ({
        ...prev,
        message: '백엔드에서 파일 처리 중...'
      }));

      const response = await fetch(`${QNAME_SERVICE_URL}/api/qname/process-file`, {
        method: 'POST',
        body: formData,
      });

      console.log('API 응답 수신 시간:', new Date().toISOString());
      console.log('API 응답 상태:', response.status);
      console.log('API 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);

        // API 오류 시 예치금 환불 (원래 잔액으로 복원)
        console.log('=== API 오류로 인한 예치금 환불 ===');
        updateUserBalance(user.balance);
        setBalance(user.balance);

        throw new Error(`서버 오류: ${response.status} - ${errorText}`);
      }

      // 파일 다운로드 처리
      console.log('응답 blob 변환 시작');
      setProcessingProgress(prev => ({
        ...prev,
        message: '결과 파일 준비 중...'
      }));

      const blob = await response.blob();
      console.log('응답 blob 크기:', blob.size);
      console.log('응답 blob 타입:', blob.type);

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

      // 파일 상태 초기화
      setFile(null);
      setFileValidation({
        isValid: false,
        totalRows: 0,
        estimatedCost: 0,
        canProcess: false,
        reason: ''
      });

    } catch (e) {
      console.error('=== 파일 업로드 오류 ===');
      console.error('오류 타입:', typeof e);
      console.error('오류 메시지:', e instanceof Error ? e.message : e);
      console.error('오류 스택:', e instanceof Error ? e.stack : '스택 없음');

      // 오류 시 진행률 초기화
      setProcessingProgress({
        current: 0,
        total: 0,
        message: '오류 발생'
      });

      setError(`엑셀 파일 처리 중 오류가 발생했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
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
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-light"
          >
            📥 업로드표준엑셀양식
          </button>
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
    </div>
  );
}

export default QName;
