// TODO: db 기반으로 전환시 구축 - axios import 활성화
// import axios from 'axios';

// TODO: db 기반으로 전환시 구축 - API 서버 URL 설정
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

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

// 모든 파일 조회 함수
const getAllFiles = (): BoardFile[] => {
    const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as BoardPost[];
    return posts.flatMap(post => post.files);
};

// API 서비스 클래스
class BoardService {
    constructor() {
        // 초기 데이터 설정
        this.initializeData();
    }

    private initializeData() {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (!existingData) {
            const sampleData = createSampleData();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
        }
    }

    private getAuthHeaders() {
        // TODO: db 기반으로 전환시 구축 - 실제 JWT 토큰 사용
        const token = localStorage.getItem('token') || 'dummy-token';
        return { Authorization: `Bearer ${token}` };
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
            // TODO: db 기반으로 전환시 구축 - 실제 API 호출
            // const response = await axios.get(`${API_BASE_URL}/api/boards/`, {
            //     params,
            //     headers: this.getAuthHeaders()
            // });
            // return response.data;

            const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as BoardPost[];
            let filteredPosts = [...posts];

            // 카테고리 필터링
            if (params?.category) {
                filteredPosts = filteredPosts.filter(post => post.category === params.category);
            }

            // 검색 필터링
            if (params?.search) {
                const searchTerm = params.search.toLowerCase();
                filteredPosts = filteredPosts.filter(post => 
                    post.title.toLowerCase().includes(searchTerm) ||
                    post.content.toLowerCase().includes(searchTerm) ||
                    post.author.toLowerCase().includes(searchTerm)
                );
            }

            // 정렬 (고정글 우선, 최신순)
            filteredPosts.sort((a, b) => {
                if (a.is_pinned !== b.is_pinned) {
                    return b.is_pinned ? 1 : -1;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            // 페이지네이션
            const skip = params?.skip || 0;
            const limit = params?.limit || 10;
            return filteredPosts.slice(skip, skip + limit);
        } catch (error) {
            console.error('게시글 목록 조회 실패:', error);
            throw error;
        }
    }

    // 개별 게시글 조회
    async getBoard(boardId: number): Promise<BoardPost> {
        try {
            // TODO: db 기반으로 전환시 구축 - 실제 API 호출
            // const response = await axios.get(`${API_BASE_URL}/api/boards/${boardId}`, {
            //     headers: this.getAuthHeaders()
            // });
            // return response.data;

            const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as BoardPost[];
            const post = posts.find(p => p.id === boardId);
            
            if (!post) {
                throw new Error('게시글을 찾을 수 없습니다.');
            }

            // 조회수 증가
            post.view_count += 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

            return post;
        } catch (error) {
            console.error('게시글 조회 실패:', error);
            throw error;
        }
    }

    // 게시글 작성
    async createBoard(data: CreateBoardRequest): Promise<{ message: string; board_id: number; uploaded_files: any[] }> {
        try {
            // TODO: db 기반으로 전환시 구축 - 실제 API 호출
            // const formData = new FormData();
            // formData.append('title', data.title);
            // formData.append('content', data.content);
            // formData.append('category', data.category);
            // if (data.is_pinned !== undefined) {
            //     formData.append('is_pinned', data.is_pinned.toString());
            // }
            // if (data.files) {
            //     for (const file of data.files) {
            //         formData.append('files', file);
            //     }
            // }
            // const response = await axios.post(`${API_BASE_URL}/api/boards/`, formData, {
            //     headers: {
            //         ...this.getAuthHeaders(),
            //         'Content-Type': 'multipart/form-data'
            //     }
            // });
            // return response.data;

            const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as BoardPost[];
            const currentUser = this.getCurrentUser();
            const newId = getNextId(posts);
            const now = new Date().toISOString();

            // 파일 처리 (Mock)
            const uploadedFiles: BoardFile[] = [];
            if (data.files) {
                for (const file of data.files) {
                    const fileId = getNextFileId();
                    uploadedFiles.push({
                        id: fileId,
                        original_filename: file.name,
                        file_size: file.size,
                        content_type: file.type,
                        upload_date: now
                    });
                }
            }

            const newPost: BoardPost = {
                id: newId,
                title: data.title,
                content: data.content,
                category: data.category,
                author: currentUser.name,
                author_id: currentUser.id,
                is_pinned: data.is_pinned || false,
                is_notice: false, // 관리자만 공지사항 설정 가능
                view_count: 0,
                created_at: now,
                updated_at: now,
                file_count: uploadedFiles.length,
                files: uploadedFiles
            };

            posts.push(newPost);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

            return {
                message: '게시글이 성공적으로 작성되었습니다.',
                board_id: newId,
                uploaded_files: uploadedFiles
            };
        } catch (error) {
            console.error('게시글 작성 실패:', error);
            throw error;
        }
    }

    // 게시글 수정
    async updateBoard(boardId: number, data: UpdateBoardRequest): Promise<{ message: string; uploaded_files: any[] }> {
        try {
            // TODO: db 기반으로 전환시 구축 - 실제 API 호출
            // const formData = new FormData();
            // formData.append('title', data.title);
            // formData.append('content', data.content);
            // formData.append('category', data.category);
            // if (data.is_pinned !== undefined) {
            //     formData.append('is_pinned', data.is_pinned.toString());
            // }
            // if (data.files) {
            //     for (const file of data.files) {
            //         formData.append('files', file);
            //     }
            // }
            // const response = await axios.put(`${API_BASE_URL}/api/boards/${boardId}`, formData, {
            //     headers: {
            //         ...this.getAuthHeaders(),
            //         'Content-Type': 'multipart/form-data'
            //     }
            // });
            // return response.data;

            const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as BoardPost[];
            const postIndex = posts.findIndex(p => p.id === boardId);
            
            if (postIndex === -1) {
                throw new Error('게시글을 찾을 수 없습니다.');
            }

            const now = new Date().toISOString();
            
            // 새 파일 처리 (Mock)
            const uploadedFiles: BoardFile[] = [];
            if (data.files) {
                for (const file of data.files) {
                    const fileId = getNextFileId();
                    uploadedFiles.push({
                        id: fileId,
                        original_filename: file.name,
                        file_size: file.size,
                        content_type: file.type,
                        upload_date: now
                    });
                }
            }

            // 게시글 업데이트
            posts[postIndex] = {
                ...posts[postIndex],
                title: data.title,
                content: data.content,
                category: data.category,
                is_pinned: data.is_pinned || false,
                updated_at: now,
                files: [...posts[postIndex].files, ...uploadedFiles],
                file_count: posts[postIndex].files.length + uploadedFiles.length
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

            return {
                message: '게시글이 성공적으로 수정되었습니다.',
                uploaded_files: uploadedFiles
            };
        } catch (error) {
            console.error('게시글 수정 실패:', error);
            throw error;
        }
    }

    // 게시글 삭제
    async deleteBoard(boardId: number): Promise<{ message: string }> {
        try {
            // TODO: db 기반으로 전환시 구축 - 실제 API 호출
            // const response = await axios.delete(`${API_BASE_URL}/api/boards/${boardId}`, {
            //     headers: this.getAuthHeaders()
            // });
            // return response.data;

            const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as BoardPost[];
            const filteredPosts = posts.filter(p => p.id !== boardId);
            
            if (posts.length === filteredPosts.length) {
                throw new Error('게시글을 찾을 수 없습니다.');
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPosts));

            return { message: '게시글이 성공적으로 삭제되었습니다.' };
        } catch (error) {
            console.error('게시글 삭제 실패:', error);
            throw error;
        }
    }

    // 파일 다운로드 (Mock)
    async downloadFile(fileId: number, filename: string): Promise<void> {
        try {
            // TODO: db 기반으로 전환시 구축 - 실제 API 호출
            // const response = await axios.get(`${API_BASE_URL}/api/boards/files/${fileId}/download`, {
            //     headers: this.getAuthHeaders(),
            //     responseType: 'blob'
            // });
            // const blob = new Blob([response.data]);
            // const url = window.URL.createObjectURL(blob);
            // const link = document.createElement('a');
            // link.href = url;
            // link.download = filename;
            // document.body.appendChild(link);
            // link.click();
            // document.body.removeChild(link);
            // window.URL.revokeObjectURL(url);

            // Mock 파일 다운로드 (실제 파일 없이 알림만)
            const files = getAllFiles();
            const file = files.find(f => f.id === fileId);
            
            if (!file) {
                throw new Error('파일을 찾을 수 없습니다.');
            }

            // 실제 파일 다운로드 대신 알림 표시
            alert(`파일 다운로드: ${filename}\n(Mock 환경에서는 실제 파일이 다운로드되지 않습니다)`);
            
        } catch (error) {
            console.error('파일 다운로드 실패:', error);
            throw error;
        }
    }

    // 파일 삭제
    async deleteFile(fileId: number): Promise<{ message: string }> {
        try {
            // TODO: db 기반으로 전환시 구축 - 실제 API 호출
            // const response = await axios.delete(`${API_BASE_URL}/api/boards/files/${fileId}`, {
            //     headers: this.getAuthHeaders()
            // });
            // return response.data;

            const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as BoardPost[];
            let fileDeleted = false;

            posts.forEach(post => {
                const fileIndex = post.files.findIndex(f => f.id === fileId);
                if (fileIndex !== -1) {
                    post.files.splice(fileIndex, 1);
                    post.file_count = post.files.length;
                    fileDeleted = true;
                }
            });

            if (!fileDeleted) {
                throw new Error('파일을 찾을 수 없습니다.');
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

            return { message: '파일이 성공적으로 삭제되었습니다.' };
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            throw error;
        }
    }
}

export const boardService = new BoardService();
