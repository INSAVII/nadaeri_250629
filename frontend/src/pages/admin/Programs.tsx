import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/constants';

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
  const { user } = useAuth();
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

  // 백엔드에서 프로그램 데이터 로드
  const loadProgramsFromStorage = async () => {
    try {
      // 1. 백엔드에서 프로그램 목록 가져오기
      const response = await fetch(`${getApiUrl()}/api/programs/programs`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        const programsList = await response.json();
        console.log('백엔드에서 프로그램 목록 가져옴:', programsList);

        // 2. 프로그램 목록을 기존 형식으로 변환
        const convertedPrograms: ProgramData = {
          qcapture_free: null,
          qcapture_1month: null,
          qcapture_3month: null
        };
        programsList.forEach((program: any) => {
          const programType = program.license_type as keyof ProgramData;
          convertedPrograms[programType] = {
            id: program.id,
            name: program.name,
            filename: program.filename,
            uploadDate: program.upload_date.split('T')[0],
            isActive: program.is_active,
            fileSize: program.file_size
          };
        });

        setPrograms(convertedPrograms);

        // 3. localStorage에도 저장 (기존 구조 유지)
        localStorage.setItem(ACTIVE_PROGRAMS_KEY, JSON.stringify(convertedPrograms));
      } else {
        console.warn('백엔드에서 프로그램 목록을 가져올 수 없습니다. localStorage에서 로드합니다.');
        // 백엔드 실패 시 localStorage에서 로드
        const storedData = localStorage.getItem(ACTIVE_PROGRAMS_KEY);
        if (storedData) {
          const activePrograms = JSON.parse(storedData);
          setPrograms(activePrograms);
        }
      }
    } catch (error) {
      console.error('❌ 프로그램 데이터 로드 실패:', error);
      // 에러 시 localStorage에서 로드
      const storedData = localStorage.getItem(ACTIVE_PROGRAMS_KEY);
      if (storedData) {
        const activePrograms = JSON.parse(storedData);
        setPrograms(activePrograms);
      }
    }
  };

  // 통합 업로드 처리 (백엔드 API 호출)
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
    setMessage('파일 업로드 중... 데이터베이스에 저장 중...');

    try {
      // 1. 백엔드 API 호출로 파일 업로드
      const formData = new FormData();
      formData.append('file', file);

      // 🆕 올바른 license_type 매핑
      let licenseType = '';
      if (programType === 'qcapture_free') {
        licenseType = 'qcapture_free';
      } else if (programType === 'qcapture_1month') {
        licenseType = 'qcapture_month1';  // 🆕 수정: qcapture_1month → qcapture_month1
      } else if (programType === 'qcapture_3month') {
        licenseType = 'qcapture_month3';
      }

      formData.append('license_type', licenseType);
      formData.append('name', getProgramDisplayName(programType));

      const response = await fetch(`${getApiUrl()}/api/programs/upload-program`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || response.statusText);
      }

      const result = await response.json();
      console.log('업로드 성공:', result);

      // 2. 새 프로그램 파일 객체 생성
      const newFile: ProgramFile = {
        id: result.program.id,
        name: result.program.name,
        filename: result.program.filename,
        uploadDate: result.program.upload_date.split('T')[0],
        isActive: result.program.is_active,
        fileSize: result.program.file_size
      };

      // 3. 상태 업데이트
      const updatedPrograms = {
        ...programs,
        [programType]: newFile
      };
      setPrograms(updatedPrograms);

      // 4. localStorage에 저장 (기존 구조 유지)
      localStorage.setItem(ACTIVE_PROGRAMS_KEY, JSON.stringify(updatedPrograms));

      // 5. 이벤트 발생 (다른 페이지 동기화용)
      window.dispatchEvent(new CustomEvent('activeProgramsChanged', {
        detail: { type: 'upload', programType, file: newFile }
      }));

      setMessage(`${getProgramDisplayName(programType)} 파일이 업로드되었습니다. 데이터베이스에 저장 완료!`);

    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);
      setMessage(`파일 업로드에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  // 통합 삭제 처리 (백엔드 API 호출)
  const handleDelete = async (programType: keyof ProgramData) => {
    setIsLoading(true);
    setMessage('데이터베이스에서 제거 중... 파일 삭제 중...');

    try {
      // 1. 현재 파일 정보 가져오기
      const currentFile = programs[programType];
      if (!currentFile) {
        throw new Error('삭제할 파일 정보를 찾을 수 없습니다.');
      }

      // 2. 백엔드 API 호출로 파일 삭제
      const response = await fetch(`${getApiUrl()}/api/programs/delete-program/${currentFile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || response.statusText);
      }

      const result = await response.json();
      console.log('삭제 성공:', result);

      // 3. 상태에서 제거
      const updatedPrograms = {
        ...programs,
        [programType]: null
      };
      setPrograms(updatedPrograms);

      // 4. localStorage에서 제거
      localStorage.setItem(ACTIVE_PROGRAMS_KEY, JSON.stringify(updatedPrograms));

      // 5. localStorage에서 파일 내용도 제거
      if (currentFile) {
        const fileKey = `FILE_CONTENT_${programType}_${currentFile.filename}`;
        localStorage.removeItem(fileKey);
        console.log(`파일 내용 제거: ${fileKey}`);
      }

      // 6. 이벤트 발생 (다른 페이지 동기화용)
      window.dispatchEvent(new CustomEvent('activeProgramsChanged', {
        detail: { type: 'delete', programType }
      }));

      setMessage(`${getProgramDisplayName(programType)} 파일이 삭제되었습니다. 데이터베이스에서 제거 완료!`);

    } catch (error) {
      console.error('❌ 파일 삭제 실패:', error);
      setMessage(`파일 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
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
