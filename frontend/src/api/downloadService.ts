import { useAuth } from '../context/AuthContext';

// 다운로드 서비스 인터페이스
interface DownloadService {
    downloadProgram: (programType: string, licenseType: string) => Promise<void>;
    getDownloadUrl: (programType: string, licenseType: string) => string;
    checkDownloadPermission: (licenseType: string) => boolean;
}

// 프로그램 타입별 설정
const PROGRAM_CONFIG = {
    qcapture: {
        free: {
            path: '/downloads/qcapture/free/qcapture_free_v1.0.exe',
            filename: 'qcapture_free_v1.0.exe',
            size: '45.2 MB'
        },
        month1: {
            path: '/downloads/qcapture/month1/qcapture_1month_v2.1.exe',
            filename: 'qcapture_1month_v2.1.exe',
            size: '47.8 MB'
        },
        month3: {
            path: '/downloads/qcapture/month3/qcapture_3month_v3.0.exe',
            filename: 'qcapture_3month_v3.0.exe',
            size: '48.5 MB'
        }
    }
};

// 개발용 더미 파일 생성 함수
const createDummyFile = (filename: string, size: string): Blob => {
    const content = `# 큐캡쳐 프로그램 - ${filename}

이 파일은 개발용 더미 파일입니다.
실제 배포 시에는 진짜 프로그램 파일로 교체됩니다.

파일명: ${filename}
크기: ${size}
생성일: ${new Date().toLocaleDateString()}

개발자: QClick Team
버전: 개발 버전
라이선스: 개발용

실제 프로그램을 다운로드하려면 관리자에게 문의하세요.
`;

    return new Blob([content], { type: 'text/plain' });
};

// 다운로드 서비스 구현
export const downloadService: DownloadService = {
    // 프로그램 다운로드 실행
    downloadProgram: async (programType: string, licenseType: string) => {
        try {
            const config = PROGRAM_CONFIG[programType as keyof typeof PROGRAM_CONFIG];
            if (!config || !config[licenseType as keyof typeof config]) {
                throw new Error('지원하지 않는 프로그램 타입입니다.');
            }

            const programConfig = config[licenseType as keyof typeof config];

            // localStorage에서 실제 업로드된 파일 정보 확인
            const activeProgramsJson = localStorage.getItem('ACTIVE_PROGRAMS');
            const activePrograms = activeProgramsJson ? JSON.parse(activeProgramsJson) : {};

            console.log('다운로드 요청:', { programType, licenseType });
            console.log('ACTIVE_PROGRAMS:', activePrograms);

            // localStorage의 모든 키 확인 (디버깅용)
            const allKeys = Object.keys(localStorage);
            const fileContentKeys = allKeys.filter(key => key.startsWith('FILE_CONTENT_'));
            console.log('localStorage의 모든 FILE_CONTENT 키:', fileContentKeys);

            let actualFilename: string = programConfig.filename;
            let fileContent: string | null = null;

            // 실제 업로드된 파일이 있는지 확인
            const programKey = `qcapture_${licenseType}`;
            if (activePrograms[programKey]) {
                const uploadedFile = activePrograms[programKey];
                actualFilename = uploadedFile.filename;

                // localStorage에 파일 내용이 저장되어 있는지 확인
                const fileContentKey = `FILE_CONTENT_${programKey}_${uploadedFile.filename}`;
                fileContent = localStorage.getItem(fileContentKey);

                console.log(`업로드된 파일 확인: ${actualFilename}`, {
                    programKey,
                    fileContentKey,
                    hasContent: !!fileContent,
                    contentSize: fileContent ? `${(fileContent.length / 1024 / 1024).toFixed(1)} MB` : '없음',
                    uploadedFile
                });

                // 파일 내용이 없으면 다른 키 패턴으로도 시도
                if (!fileContent) {
                    const alternativeKeys = [
                        `FILE_CONTENT_${programType}_${licenseType}_${uploadedFile.filename}`,
                        `FILE_CONTENT_qcapture_${licenseType}_${uploadedFile.filename}`,
                        `FILE_CONTENT_${uploadedFile.filename}`
                    ];

                    for (const altKey of alternativeKeys) {
                        fileContent = localStorage.getItem(altKey);
                        if (fileContent) {
                            console.log(`대체 키로 파일 찾음: ${altKey}`);
                            break;
                        }
                    }
                }
            }

            if (fileContent) {
                // localStorage에 저장된 실제 파일 내용으로 다운로드
                console.log(`실제 파일 다운로드: ${programType} ${licenseType}`, {
                    filename: actualFilename,
                    size: `${(fileContent.length / 1024 / 1024).toFixed(1)} MB`,
                    timestamp: new Date().toISOString()
                });

                // Base64 문자열을 ArrayBuffer로 변환
                const binaryString = atob(fileContent);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const blob = new Blob([bytes], { type: 'application/octet-stream' });
                const downloadUrl = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = actualFilename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 메모리 정리
                setTimeout(() => {
                    URL.revokeObjectURL(downloadUrl);
                }, 1000);

            } else {
                // localStorage에 파일이 없으면 더미 파일 생성
                console.log(`더미 파일 생성: ${programType} ${licenseType}`, {
                    filename: actualFilename,
                    size: programConfig.size,
                    reason: 'localStorage에 실제 파일이 없어서 더미 파일을 생성합니다.',
                    timestamp: new Date().toISOString()
                });

                const dummyBlob = createDummyFile(actualFilename, programConfig.size);
                const downloadUrl = URL.createObjectURL(dummyBlob);

                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = actualFilename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 메모리 정리
                setTimeout(() => {
                    URL.revokeObjectURL(downloadUrl);
                }, 1000);
            }

            // 다운로드 완료 로그
            console.log(`다운로드 완료: ${programType} ${licenseType}`);

        } catch (error) {
            console.error('다운로드 실패:', error);
            throw error;
        }
    },

    // 다운로드 URL 반환
    getDownloadUrl: (programType: string, licenseType: string): string => {
        const config = PROGRAM_CONFIG[programType as keyof typeof PROGRAM_CONFIG];
        if (!config || !config[licenseType as keyof typeof config]) {
            throw new Error('지원하지 않는 프로그램 타입입니다.');
        }

        const programConfig = config[licenseType as keyof typeof config];
        return `${window.location.origin}${programConfig.path}`;
    },

    // 다운로드 권한 확인 (AuthContext와 연동)
    checkDownloadPermission: (licenseType: string): boolean => {
        try {
            // 🚫 localStorage 의존성 제거 - AuthContext 사용으로 변경
            // AuthContext에서 사용자 데이터를 가져오는 방식으로 변경 필요
            // 현재는 임시로 기본값 반환 (실제 구현에서는 AuthContext 사용)

            // 기본값 (무료는 기본적으로 허용)
            if (licenseType === 'free') {
                return true;
            }

            // 🚨 TODO: AuthContext에서 사용자 권한 확인하도록 수정 필요
            // 현재는 임시로 false 반환
            console.warn('downloadService - AuthContext 연동 필요:', licenseType);
            return false;
        } catch (error) {
            console.error('downloadService - 권한 확인 오류:', error);
            return false;
        }
    }
};

// React Hook으로 사용하기 위한 커스텀 훅
export const useDownloadService = () => {
    const { user, isAuthenticated } = useAuth();

    // 권한 확인 함수 (AuthContext와 완전 연동)
    const checkPermission = (licenseType: string): boolean => {
        try {
            // AuthContext에서 직접 권한 가져오기
            if (!user || !user.programPermissions) {
                // fallback: 기존 방식 사용
                return downloadService.checkDownloadPermission(licenseType);
            }

            switch (licenseType) {
                case 'free':
                    return user.programPermissions.free || false;
                case 'month1':
                    return user.programPermissions.month1 || false;
                case 'month3':
                    return user.programPermissions.month3 || false;
                default:
                    return false;
            }
        } catch (error) {
            console.error('권한 확인 실패:', error);
            // 오류 시 기존 방식으로 fallback
            return downloadService.checkDownloadPermission(licenseType);
        }
    };

    const downloadWithPermission = async (programType: string, licenseType: string) => {
        if (!isAuthenticated || !user) {
            throw new Error('로그인이 필요합니다.');
        }

        if (!checkPermission(licenseType)) {
            throw new Error('다운로드 권한이 없습니다.');
        }

        await downloadService.downloadProgram(programType, licenseType);
    };

    return {
        downloadProgram: downloadWithPermission,
        getDownloadUrl: downloadService.getDownloadUrl,
        checkPermission: checkPermission
    };
}; 