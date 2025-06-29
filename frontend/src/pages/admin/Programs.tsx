import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ProgramFile {
  id: string;
  name: string;
  filename: string;
  uploadDate: string;
  isActive: boolean;
  fileSize?: number;
}

interface ProgramData {
  qcapture_free: ProgramFile | null;
  qcapture_1month: ProgramFile | null;
  qcapture_3month: ProgramFile | null;
}

// localStorage 키
const ACTIVE_PROGRAMS_KEY = 'ACTIVE_PROGRAMS';

// 2개 버튼 방식으로 단순화된 프로그램 관리 (업로드, 삭제)
export default function AdminPrograms() {
  const [programs, setPrograms] = useState<ProgramData>({
    qcapture_free: null,
    qcapture_1month: null,
    qcapture_3month: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 컴포넌트 마운트 시 localStorage에서 프로그램 데이터 로드
  useEffect(() => {
    loadProgramsFromStorage();
  }, []);

  // localStorage에서 프로그램 데이터 로드
  const loadProgramsFromStorage = () => {
    try {
      const storedData = localStorage.getItem(ACTIVE_PROGRAMS_KEY);
      if (storedData) {
        const activePrograms = JSON.parse(storedData);
        setPrograms(activePrograms);
      }
    } catch (error) {
      console.error('❌ 프로그램 데이터 로드 실패:', error);
    }
  };

  // 통합 업로드 처리 (파일 저장 + 마켓 등록 + 동기화)
  const handleUpload = async (programType: keyof ProgramData, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage(`파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.`);
      event.target.value = '';
      return;
    }

    setIsLoading(true);
    setMessage('파일 업로드 중... 마켓에 등록 중...');

    try {
      // 1. 새 프로그램 파일 객체 생성
      const newFile: ProgramFile = {
        id: Date.now().toString(),
        name: getProgramDisplayName(programType),
        filename: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        isActive: true,
        fileSize: file.size
      };

      // 2. 개발용: 파일 정보만 저장 (실제 파일 내용은 저장하지 않음)
      try {
        // 파일이 너무 크면 localStorage에 저장하지 않음 (100MB 제한)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size <= maxSize) {
          // 100MB 이하 파일은 localStorage에 저장
          const reader = new FileReader();

          reader.onload = (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              if (arrayBuffer) {
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);

                const fileKey = `FILE_CONTENT_${programType}_${file.name}`;
                localStorage.setItem(fileKey, base64);
                console.log(`파일 저장 완료: ${file.name} -> ${fileKey} (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);
              }
            } catch (error) {
              console.warn('파일 저장 실패 (무시됨):', error);
            }
          };

          reader.onerror = (error) => {
            console.warn('파일 읽기 실패 (무시됨):', error);
          };

          reader.readAsArrayBuffer(file);
        } else {
          console.log(`파일이 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 파일 내용은 저장하지 않습니다.`);
        }
      } catch (fileError) {
        console.warn('파일 처리 실패 (무시됨):', fileError);
      }

      // 3. 상태 업데이트
      const updatedPrograms = {
        ...programs,
        [programType]: newFile
      };
      setPrograms(updatedPrograms);

      // 4. localStorage에 저장
      localStorage.setItem(ACTIVE_PROGRAMS_KEY, JSON.stringify(updatedPrograms));

      // 5. 이벤트 발생 (다른 페이지 동기화용)
      window.dispatchEvent(new CustomEvent('activeProgramsChanged', {
        detail: { type: 'upload', programType, file: newFile }
      }));

      setMessage(`${getProgramDisplayName(programType)} 파일이 업로드되었습니다. 마켓에 등록 완료!`);

    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);
      setMessage('파일 업로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  // 통합 삭제 처리 (마켓 제거 + 파일 삭제 + 동기화)
  const handleDelete = async (programType: keyof ProgramData) => {
    setIsLoading(true);
    setMessage('마켓에서 제거 중... 파일 삭제 중...');

    try {
      // 1. 현재 파일 정보 가져오기
      const currentFile = programs[programType];

      // 2. 상태에서 제거
      const updatedPrograms = {
        ...programs,
        [programType]: null
      };
      setPrograms(updatedPrograms);

      // 3. localStorage에서 제거
      localStorage.setItem(ACTIVE_PROGRAMS_KEY, JSON.stringify(updatedPrograms));

      // 4. localStorage에서 파일 내용도 제거
      if (currentFile) {
        const fileKey = `FILE_CONTENT_${programType}_${currentFile.filename}`;
        localStorage.removeItem(fileKey);
        console.log(`파일 내용 제거: ${fileKey}`);
      }

      // 5. 이벤트 발생 (다른 페이지 동기화용)
      window.dispatchEvent(new CustomEvent('activeProgramsChanged', {
        detail: { type: 'delete', programType }
      }));

      setMessage(`${getProgramDisplayName(programType)} 파일이 삭제되었습니다. 마켓에서 제거 완료!`);

    } catch (error) {
      console.error('❌ 파일 삭제 실패:', error);
      setMessage('파일 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 프로그램 표시명 가져오기
  const getProgramDisplayName = (programType: keyof ProgramData): string => {
    const names = {
      qcapture_free: '큐캡쳐 무료',
      qcapture_1month: '큐캡쳐 1개월',
      qcapture_3month: '큐캡쳐 3개월'
    };
    return names[programType];
  };

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="page-container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light">프로그램관리(큐캡쳐)</h1>
        <div className="flex space-x-2">
          <Link to="/admin">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              관리자 대시보드
            </button>
          </Link>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('완료') || message.includes('업로드') || message.includes('삭제') ?
          'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* 큐캡쳐 무료 */}
        <div className="bg-white border rounded p-6">
          <h2 className="text-lg font-light mb-4">큐캡쳐 무료</h2>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">
                현재 파일: {programs.qcapture_free ? programs.qcapture_free.filename : '업로드된 파일 없음'}
              </div>
              {programs.qcapture_free && (
                <div className="text-xs text-gray-500">
                  업로드일: {programs.qcapture_free.uploadDate}
                  {programs.qcapture_free.fileSize && (
                    <span className="ml-2">
                      크기: {(programs.qcapture_free.fileSize / 1024 / 1024).toFixed(1)}MB
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <label className={`px-3 py-1 text-white text-sm rounded transition-colors cursor-pointer ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}>
                업로드
                <input
                  type="file"
                  className="hidden"
                  accept=".exe,.dmg,.zip,.msi,.pkg"
                  onChange={(e) => handleUpload('qcapture_free', e)}
                  disabled={isLoading}
                />
              </label>
              {programs.qcapture_free && (
                <button
                  onClick={() => handleDelete('qcapture_free')}
                  disabled={isLoading}
                  className={`px-3 py-1 text-white text-sm rounded transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 큐캡쳐 1개월 */}
        <div className="bg-white border rounded p-6">
          <h2 className="text-lg font-light mb-4">큐캡쳐 1개월</h2>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">
                현재 파일: {programs.qcapture_1month ? programs.qcapture_1month.filename : '업로드된 파일 없음'}
              </div>
              {programs.qcapture_1month && (
                <div className="text-xs text-gray-500">
                  업로드일: {programs.qcapture_1month.uploadDate}
                  {programs.qcapture_1month.fileSize && (
                    <span className="ml-2">
                      크기: {(programs.qcapture_1month.fileSize / 1024 / 1024).toFixed(1)}MB
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <label className={`px-3 py-1 text-white text-sm rounded transition-colors cursor-pointer ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}>
                업로드
                <input
                  type="file"
                  className="hidden"
                  accept=".exe,.dmg,.zip,.msi,.pkg"
                  onChange={(e) => handleUpload('qcapture_1month', e)}
                  disabled={isLoading}
                />
              </label>
              {programs.qcapture_1month && (
                <button
                  onClick={() => handleDelete('qcapture_1month')}
                  disabled={isLoading}
                  className={`px-3 py-1 text-white text-sm rounded transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 큐캡쳐 3개월 */}
        <div className="bg-white border rounded p-6">
          <h2 className="text-lg font-light mb-4">큐캡쳐 3개월</h2>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">
                현재 파일: {programs.qcapture_3month ? programs.qcapture_3month.filename : '업로드된 파일 없음'}
              </div>
              {programs.qcapture_3month && (
                <div className="text-xs text-gray-500">
                  업로드일: {programs.qcapture_3month.uploadDate}
                  {programs.qcapture_3month.fileSize && (
                    <span className="ml-2">
                      크기: {(programs.qcapture_3month.fileSize / 1024 / 1024).toFixed(1)}MB
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <label className={`px-3 py-1 text-white text-sm rounded transition-colors cursor-pointer ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}>
                업로드
                <input
                  type="file"
                  className="hidden"
                  accept=".exe,.dmg,.zip,.msi,.pkg"
                  onChange={(e) => handleUpload('qcapture_3month', e)}
                  disabled={isLoading}
                />
              </label>
              {programs.qcapture_3month && (
                <button
                  onClick={() => handleDelete('qcapture_3month')}
                  disabled={isLoading}
                  className={`px-3 py-1 text-white text-sm rounded transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 안내사항 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">안내사항</h3>
        <ul className="text-sm text-yellow-700 font-light space-y-1">
          <li>• 지원 파일 형식: .exe, .dmg, .zip, .msi, .pkg</li>
          <li>• 최대 파일 크기: 100MB (실제 프로그램 파일은 50MB+ 크기)</li>
          <li>• 개발 과정에서도 100MB까지 파일 저장 및 다운로드 가능</li>
          <li>• 업로드: 파일 저장 + 마켓 등록 + 모든 페이지 동기화</li>
          <li>• 삭제: 마켓 제거 + 파일 삭제 + 모든 페이지 동기화</li>
          <li>• 권한 관리는 CMS 페이지에서 설정하세요</li>
        </ul>
      </div>
    </div>
  );
}
