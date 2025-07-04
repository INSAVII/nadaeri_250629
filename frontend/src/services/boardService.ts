import axios from 'axios';
import { getApiUrl } from '../config/constants';

// API 서버 URL 설정
const API_BASE_URL = getApiUrl();

// 인터페이스 정의
export interface BoardPost {
    id: number;
    title: string;
    content: string;
    category: string;
    author: string;
    author_id?: number;
    is_pinned: boolean;
    is_notice: boolean;
    view_count: number;
    created_at: string;
    updated_at: string;
    file_count: number;
    files: BoardFile[];
}

export interface BoardFile {
    id: number;
    original_filename: string;
    file_size: number;
    content_type: string;
    upload_date?: string;
}

export interface CreateBoardRequest {
    title: string;
    content: string;
    category: string;
    is_pinned?: boolean;
    files?: File[];
}

export interface UpdateBoardRequest {
    title: string;
    content: string;
    category: string;
    is_pinned?: boolean;
    files?: File[];
}

// Mock 데이터 및 유틸리티 함수
const STORAGE_KEY = 'qclick_board_posts';
const FILE_STORAGE_KEY = 'qclick_board_files';

// 샘플 데이터 생성
const createSampleData = (): BoardPost[] => {
    const now = new Date().toISOString();
    return [
        {
            id: 1,
            title: "QClick CMS 시스템 사용 가이드",
            content: "QClick CMS 시스템의 기본 사용법에 대해 안내드립니다.\n\n1. 로그인 방법\n2. 메뉴 구성\n3. 기본 기능 사용법\n\n자세한 내용은 첨부된 매뉴얼을 참고하세요.",
            category: "공지사항",
            author: "관리자",
            author_id: 1,
            is_pinned: true,
            is_notice: true,
            view_count: 125,
            created_at: "2024-06-20T09:00:00Z",
            updated_at: "2024-06-20T09:00:00Z",
            file_count: 1,
            files: [
                {
                    id: 1,
                    original_filename: "QClick_사용자_매뉴얼.pdf",
                    file_size: 2548736,
                    content_type: "application/pdf",
                    upload_date: "2024-06-20T09:00:00Z"
                }
            ]
        },
        {
            id: 2,
            title: "시스템 정기 점검 안내",
            content: "시스템 정기 점검으로 인한 일시적 서비스 중단을 안내드립니다.\n\n점검 일시: 2024년 6월 25일 오후 11시 ~ 오전 2시\n점검 내용: 데이터베이스 최적화 및 보안 업데이트",
            category: "공지사항",
            author: "관리자",
            author_id: 1,
            is_pinned: true,
            is_notice: true,
            view_count: 89,
            created_at: "2024-06-19T14:30:00Z",
            updated_at: "2024-06-19T14:30:00Z",
            file_count: 0,
            files: []
        },
        {
            id: 3,
            title: "회원 가입 프로세스 개선 완료",
            content: "회원 가입 시 사용자 편의성을 위해 다음과 같이 개선하였습니다.\n\n- 이메일 인증 절차 간소화\n- 프로필 설정 단계 추가\n- 가입 완료 후 자동 로그인 기능",
            category: "업데이트",
            author: "개발팀",
            author_id: 2,
            is_pinned: false,
            is_notice: false,
            view_count: 45,
            created_at: "2024-06-18T16:45:00Z",
            updated_at: "2024-06-18T16:45:00Z",
            file_count: 2,
            files: [
                {
                    id: 2,
                    original_filename: "회원가입_프로세스_변경사항.docx",
                    file_size: 1024000,
                    content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    upload_date: "2024-06-18T16:45:00Z"
                },
                {
                    id: 3,
                    original_filename: "UI_스크린샷.png",
                    file_size: 512000,
                    content_type: "image/png",
                    upload_date: "2024-06-18T16:45:00Z"
                }
            ]
        },
        {
            id: 4,
            title: "QName 서비스 사용법",
            content: "QName 서비스의 기본 사용법을 안내합니다.\n\n1. 서비스 접속\n2. 프로젝트 생성\n3. 도메인 연결\n4. DNS 설정",
            category: "자료실",
            author: "기술팀",
            author_id: 3,
            is_pinned: false,
            is_notice: false,
            view_count: 67,
            created_at: "2024-06-17T11:20:00Z",
            updated_at: "2024-06-17T11:20:00Z",
            file_count: 1,
            files: [
                {
                    id: 4,
                    original_filename: "QName_서비스_가이드.pdf",
                    file_size: 3145728,
                    content_type: "application/pdf",
                    upload_date: "2024-06-17T11:20:00Z"
                }
            ]
        },
        {
            id: 5,
            title: "FAQ - 자주 묻는 질문",
            content: "사용자분들이 자주 문의하시는 내용들을 정리했습니다.\n\nQ: 비밀번호를 분실했어요.\nA: 로그인 페이지에서 '비밀번호 찾기'를 이용하세요.\n\nQ: 파일 업로드가 안 됩니다.\nA: 파일 크기는 최대 10MB까지 지원됩니다.",
            category: "자료실",
            author: "고객지원팀",
            author_id: 4,
            is_pinned: false,
            is_notice: false,
            view_count: 234,
            created_at: "2024-06-16T13:15:00Z",
            updated_at: "2024-06-16T13:15:00Z",
            file_count: 0,
            files: []
        }
    ];
};

// 다음 ID 생성 함수
const getNextId = (posts: BoardPost[]): number => {
    return posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
};

// 다음 파일 ID 생성 함수
const getNextFileId = (): number => {
    const files = getAllFiles();
    return files.length > 0 ? Math.max(...files.map(f => f.id)) + 1 : 1;
};

// 🚫 모든 파일 조회 함수 - localStorage 사용 금지
const getAllFiles = (): BoardFile[] => {
    console.log('🚫 boardService - getAllFiles 호출됨 (localStorage 사용 금지)');
    return []; // 빈 배열 반환하여 localStorage 접근 차단
};

// API 서비스 클래스
class BoardService {
    constructor() {
        // 초기 데이터 설정
        this.initializeData();
    }

    private initializeData() {
        console.log('🚫 boardService - initializeData 호출됨 (localStorage 사용 금지)');
        // localStorage 사용 완전 금지 - 자동 데이터 초기화 방지
    }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    private getFormDataHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    private getCurrentUser(): { id: number; name: string } {
        // Mock 사용자 정보 (실제로는 AuthContext에서 가져와야 함)
        // TODO: db 기반으로 전환시 구축 - AuthContext에서 실제 사용자 정보 가져오기
        const userDataStr = localStorage.getItem('USER_DATA') || localStorage.getItem('authUser');
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                return {
                    id: parseInt(userData.id) || 1,
                    name: userData.name || userData.userId || '사용자'
                };
            } catch (error) {
                console.error('사용자 데이터 파싱 오류:', error);
            }
        }
        return { id: 1, name: '사용자' };
    }

    // 게시글 목록 조회
    async getBoards(params?: {
        category?: string;
        search?: string;
        skip?: number;
        limit?: number;
    }): Promise<BoardPost[]> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.category) queryParams.append('category', params.category);
            if (params?.search) queryParams.append('search', params.search);
            if (params?.skip) queryParams.append('skip', params.skip.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());

            const response = await axios.get(`${API_BASE_URL}/api/boards/?${queryParams}`, {
                headers: this.getAuthHeaders()
            });

            return response.data;
        } catch (error) {
            console.error('게시글 목록 조회 오류:', error);
            throw error;
        }
    }

    // 개별 게시글 조회
    async getBoard(boardId: number): Promise<BoardPost> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/boards/${boardId}`, {
                headers: this.getAuthHeaders()
            });

            return response.data;
        } catch (error) {
            console.error('게시글 조회 오류:', error);
            throw error;
        }
    }

    // 게시글 작성
    async createBoard(data: CreateBoardRequest): Promise<{ message: string; board_id: number; uploaded_files: any[] }> {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content);
            formData.append('category', data.category);
            formData.append('is_pinned', data.is_pinned ? 'true' : 'false');

            // 파일 첨부
            if (data.files) {
                for (const file of data.files) {
                    formData.append('files', file);
                }
            }

            const response = await axios.post(`${API_BASE_URL}/api/boards/`, formData, {
                headers: this.getFormDataHeaders()
            });

            return response.data;
        } catch (error) {
            console.error('게시글 생성 오류:', error);
            throw error;
        }
    }

    // 게시글 수정
    async updateBoard(boardId: number, data: UpdateBoardRequest): Promise<{ message: string; uploaded_files: any[] }> {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content);
            formData.append('category', data.category);
            formData.append('is_pinned', data.is_pinned ? 'true' : 'false');

            // 파일 첨부
            if (data.files) {
                for (const file of data.files) {
                    formData.append('files', file);
                }
            }

            const response = await axios.put(`${API_BASE_URL}/api/boards/${boardId}`, formData, {
                headers: this.getFormDataHeaders()
            });

            return response.data;
        } catch (error) {
            console.error('게시글 수정 오류:', error);
            throw error;
        }
    }

    // 게시글 삭제
    async deleteBoard(boardId: number): Promise<{ message: string }> {
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/boards/${boardId}`, {
                headers: this.getAuthHeaders()
            });

            return response.data;
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            throw error;
        }
    }

    // 파일 다운로드
    async downloadFile(fileId: number, filename: string): Promise<void> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/boards/files/${fileId}/download`, {
                headers: this.getAuthHeaders(),
                responseType: 'blob'
            });

            // 파일 다운로드
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            throw error;
        }
    }

    // 파일 삭제
    async deleteFile(fileId: number): Promise<{ message: string }> {
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/boards/files/${fileId}`, {
                headers: this.getAuthHeaders()
            });

            return response.data;
        } catch (error) {
            console.error('파일 삭제 오류:', error);
            throw error;
        }
    }
}

// 싱글톤 인스턴스 생성
export const boardService = new BoardService();
