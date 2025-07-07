import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { STORAGE_KEYS } from '../config/constants';
import { boardService, BoardPost, BoardFile, CreateBoardRequest } from '../services/boardService';

// 게시글 타입 정의 (API 응답에 맞게 수정)
interface Post {
    id: number;
    title: string;
    content: string;
    author: string;
    author_id?: number;
    created_at: string;
    updated_at: string;
    files: FileAttachment[];
    category: 'manual' | 'notice' | 'general';
    is_pinned?: boolean; // 상단 고정용
    is_notice?: boolean;
    view_count?: number;
    file_count?: number;
}

interface FileAttachment {
    id: number;
    original_filename: string;
    file_size: number;
    content_type: string;
    upload_date?: string;
}

// 카테고리 타입
type CategoryType = 'manual' | 'notice' | 'general';

// 더미 게시글 데이터
const initialPosts: Post[] = [
    // 메뉴얼 (📚)
    {
        id: 101,
        title: "Q텍스트 사용자 메뉴얼",
        content: "Q텍스트 서비스 사용법을 상세히 안내합니다.\n\n주요 기능:\n- 이미지 텍스트 추출\n- 다국어 지원\n- API 연동 방법",
        author: "관리자",
        authorId: "admin",
        date: "2024-06-15",
        category: "manual",
        attachments: [
            { id: "m1", name: "Q텍스트_사용자_메뉴얼.pdf", size: 2048000, url: "#" },
            { id: "m2", name: "API_가이드.pdf", size: 1024000, url: "#" }
        ]
    },
    {
        id: 102,
        title: "Q네임 사용자 메뉴얼",
        content: "Q네임 서비스 이용 가이드입니다.",
        author: "관리자",
        authorId: "admin",
        date: "2024-06-14",
        category: "manual",
        attachments: [
            { id: "m3", name: "Q네임_메뉴얼.pdf", size: 1500000, url: "#" }
        ]
    },
    {
        id: 103,
        title: "Q캡처 사용자 메뉴얼",
        content: "Q캡처 프로그램 설치 및 사용법을 안내합니다.",
        author: "관리자",
        authorId: "admin",
        date: "2024-06-13",
        category: "manual",
        attachments: [
            { id: "m4", name: "Q캡처_설치가이드.pdf", size: 800000, url: "#" },
            { id: "m5", name: "Q캡처_사용법.pdf", size: 1200000, url: "#" }
        ]
    },

    // 공고 (📢) - 상단 고정
    {
        id: 201,
        title: "📢 [중요] 서비스 업데이트 안내",
        content: "2024년 7월 Q클릭 서비스 대규모 업데이트가 진행됩니다.\n\n주요 변경사항:\n- UI/UX 전면 개선\n- 성능 최적화\n- 새로운 기능 추가",
        author: "관리자",
        authorId: "admin",
        date: "2024-06-15",
        category: "notice",
        isPinned: true,
        attachments: [
            { id: "n1", name: "업데이트_상세안내.pdf", size: 1024000, url: "#" }
        ]
    },
    {
        id: 202,
        title: "📢 정기 시스템 점검 안내",
        content: "매월 첫째 주 일요일 시스템 점검이 진행됩니다.\n\n점검 시간: 오전 2시 ~ 6시\n점검 내용: 서버 성능 개선 및 보안 업데이트",
        author: "운영팀",
        authorId: "ops001",
        date: "2024-06-11",
        category: "notice",
        isPinned: true,
        attachments: [
            { id: "n2", name: "점검_일정표.pdf", size: 300000, url: "#" }
        ]
    },

    // 일반 게시판 (💬)
    {
        id: 301,
        title: "Q텍스트 사용 후기 및 개선 요청",
        content: "Q텍스트를 사용해보니 정말 편리합니다!\n\n개선 요청사항:\n- 처리 속도 향상\n- 더 많은 언어 지원\n- 모바일 앱 출시",
        author: "사용자A",
        authorId: "user001",
        date: "2024-06-14",
        category: "general",
        attachments: []
    },
    {
        id: 302,
        title: "API 연동 질문드립니다",
        content: "개발 중인 서비스에 Q텍스트 API를 연동하려고 합니다.\n\n질문:\n- 요청 제한이 있나요?\n- 요금제별 차이점은?",
        author: "개발자B",
        authorId: "dev002",
        date: "2024-06-12",
        category: "general",
        attachments: [
            { id: "g1", name: "연동_계획서.docx", size: 450000, url: "#" }
        ]
    },
    {
        id: 303,
        title: "서비스 이용 중 오류 문의",
        content: "파일 업로드 시 간헐적으로 오류가 발생합니다.\n\n오류 상황:\n- 5MB 이상 파일\n- 특정 이미지 포맷",
        author: "사용자C",
        authorId: "user003",
        date: "2024-06-10",
        category: "general",
        attachments: [
            { id: "g2", name: "오류_스크린샷.png", size: 250000, url: "#" }
        ]
    }
];

const Board: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // 카테고리 및 검색 관련 상태
    const [currentCategory, setCurrentCategory] = useState<CategoryType>('general');
    const [searchQuery, setSearchQuery] = useState('');

    const postsPerPage = 10;    // 카테고리별 게시글 필터링
    const getCategoryPosts = () => {
        return posts.filter(post => post.category === currentCategory);
    };

    // 검색 필터링 함수 (디바운스 적용)
    const getFilteredPosts = () => {
        const categoryPosts = getCategoryPosts();

        if (!debouncedSearchQuery.trim()) {
            return categoryPosts;
        }

        const query = debouncedSearchQuery.toLowerCase().trim();

        return categoryPosts.filter(post =>
            post.title.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            post.author.toLowerCase().includes(query)
        );
    };

    // 상단 고정 게시글 (공고)
    const getPinnedPosts = () => {
        if (currentCategory !== 'notice') return [];
        return posts.filter(post => post.category === 'notice' && post.isPinned);
    };

    // 일반 게시글 (고정 제외)
    const getRegularPosts = () => {
        const filtered = getFilteredPosts();
        if (currentCategory === 'notice') {
            return filtered.filter(post => !post.isPinned);
        }
        return filtered;
    };

    // 검색 초기화
    const handleSearchReset = () => {
        setSearchQuery('');
        setCurrentPage(1);
    };

    // 카테고리 변경
    const handleCategoryChange = (category: CategoryType) => {
        setCurrentCategory(category);
        setSearchQuery('');
        setCurrentPage(1);
    };

    // 검색어 변경 시 페이지 초기화 (디바운스 적용)
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // 디바운스 처리
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    // 권한 체크 - 글쓰기
    const canWritePost = () => {
        const currentUser = getCurrentUser();
        if (!currentUser) return false;

        // 메뉴얼과 공고는 관리자만 작성 가능
        if (currentCategory === 'manual' || currentCategory === 'notice') {
            return currentUser.role === 'admin';
        }

        // 일반 게시판은 모든 로그인 사용자 가능
        return true;
    };

    // 글쓰기 폼 상태
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        attachments: [] as File[]
    });

    // 현재 사용자 정보 가져오기 (AuthContext 사용)
    const getCurrentUser = () => {
        return user; // AuthContext의 user 사용
    };

    // 삭제 권한 체크
    const canDeletePost = (post: Post) => {
        const currentUser = getCurrentUser();
        if (!currentUser) return false;

        // 관리자는 모든 게시글 삭제 가능
        if (currentUser.role === 'admin') return true;

        // 본인 글만 삭제 가능
        return post.authorId === currentUser.id;
    };

    // 파일 크기 포맷팅
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 작성자 이름 마스킹 처리 (익명 보장)
    const maskAuthorName = (name: string) => {
        if (!name || name.length <= 1) return name;

        // 한글 이름 처리 (예: 최호진 -> 최*진)
        if (/^[가-힣]+$/.test(name)) {
            if (name.length === 2) {
                return name.charAt(0) + '*';
            } else if (name.length >= 3) {
                return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
            }
        }

        // 영문 이름 처리 (예: John Doe -> J*** D**)
        if (/^[a-zA-Z\s]+$/.test(name)) {
            return name.split(' ').map(word => {
                if (word.length <= 1) return word;
                return word.charAt(0) + '*'.repeat(word.length - 1);
            }).join(' ');
        }

        // 기타 경우 (이메일 등)
        if (name.includes('@')) {
            const [local, domain] = name.split('@');
            if (local.length <= 1) return name;
            return local.charAt(0) + '*'.repeat(local.length - 1) + '@' + domain;
        }

        // 기본 처리
        if (name.length <= 2) return name;
        return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
    };

    // 파일 확장자 가져오기
    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || '';
    };

    // 파일 타입별 아이콘 가져오기
    const getFileIcon = (filename: string) => {
        const ext = getFileExtension(filename);
        const iconMap: { [key: string]: string } = {
            // 이미지
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'svg': '🖼️',
            // 문서
            'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📄', 'rtf': '📝',
            // 스프레드시트
            'xls': '📊', 'xlsx': '📊', 'csv': '📊',
            // 프레젠테이션
            'ppt': '📊', 'pptx': '📊',
            // 압축파일
            'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️', 'tar': '🗜️', 'gz': '🗜️',
            // 코드
            'js': '⚡', 'ts': '⚡', 'jsx': '⚡', 'tsx': '⚡', 'html': '🌐', 'css': '🎨', 'json': '📋',
            // 기타
            'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬', 'avi': '🎬', 'mov': '🎬'
        };
        return iconMap[ext] || '📎';
    };

    // 파일 다운로드 함수
    const downloadFile = async (file: FileAttachment) => {
        try {
            // Blob URL인지 확인 (실제 업로드된 파일)
            if (file.url.startsWith('blob:')) {
                // Blob URL에서 직접 다운로드
                const link = document.createElement('a');
                link.href = file.url;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // 더미 데이터 또는 외부 URL인 경우
            if (file.url === '#' || !file.url.startsWith('http')) {
                // 더미 파일 생성 후 다운로드
                const dummyContent = `이것은 ${file.name} 파일의 더미 내용입니다.\n\n` +
                    `파일명: ${file.name}\n` +
                    `크기: ${formatFileSize(file.size)}\n` +
                    `생성일: ${new Date().toLocaleString()}\n\n` +
                    `실제 파일 업로드 기능이 구현되면 이 더미 내용 대신 실제 파일이 다운로드됩니다.`;

                const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 메모리 정리
                URL.revokeObjectURL(url);
                return;
            }

            // 외부 URL에서 다운로드
            const response = await fetch(file.url);
            if (!response.ok) {
                throw new Error('파일 다운로드에 실패했습니다.');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 메모리 정리
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            alert('파일 다운로드 중 오류가 발생했습니다.');
        }
    };

    // 파일 선택 처리
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setNewPost(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...fileArray]
            }));
        }
    };

    // 파일 제거
    const removeAttachment = (index: number) => {
        setNewPost(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    // 게시글 저장
    const handleSavePost = () => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!canWritePost()) {
            alert('이 카테고리에 글을 작성할 권한이 없습니다.');
            return;
        }

        if (!newPost.title.trim() || !newPost.content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        const attachments: FileAttachment[] = newPost.attachments.map((file, index) => ({
            id: `${Date.now()}_${index}`,
            name: file.name,
            size: file.size,
            url: URL.createObjectURL(file) // 실제로는 서버에 업로드 후 URL 받아야 함
        }));

        const post: Post = {
            id: Date.now(),
            title: newPost.title,
            content: newPost.content,
            author: currentUser.name || currentUser.email,
            authorId: currentUser.id,
            date: new Date().toISOString().split('T')[0],
            attachments: attachments,
            category: currentCategory
        };

        setPosts(prev => [post, ...prev]);
        setNewPost({ title: '', content: '', attachments: [] });
        setShowWriteModal(false);
        alert('게시글이 작성되었습니다.');
    };

    // 게시글 삭제
    const handleDeletePost = (postId: number) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        if (!canDeletePost(post)) {
            alert('삭제 권한이 없습니다.');
            return;
        }

        if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            setPosts(prev => prev.filter(p => p.id !== postId));
            setShowModal(false);
            alert('게시글이 삭제되었습니다.');
        }
    };

    // 페이지네이션
    const pinnedPosts = getPinnedPosts();
    const regularPosts = getRegularPosts();
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = regularPosts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(regularPosts.length / postsPerPage);

    // 카테고리 정보
    const getCategoryInfo = (category: CategoryType) => {
        switch (category) {
            case 'manual':
                return { icon: '📚', name: '메뉴얼', desc: '사용자 가이드 및 매뉴얼' };
            case 'notice':
                return { icon: '📢', name: '공고', desc: '중요 공지사항' };
            case 'general':
                return { icon: '💬', name: '일반 게시판', desc: '자유로운 의견 교환' };
        }
    };

    return (
        <div className="page-container py-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-light text-gray-800">📋 통합 게시판</h1>
                {canWritePost() && (
                    <button
                        onClick={() => setShowWriteModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-light transition-colors flex items-center gap-2"
                    >
                        ✏️ 글쓰기
                    </button>
                )}
            </div>

            {/* 카테고리 탭 */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {(['manual', 'notice', 'general'] as CategoryType[]).map((category) => {
                            const categoryInfo = getCategoryInfo(category);
                            const isActive = currentCategory === category;
                            const categoryCount = posts.filter(p => p.category === category).length;

                            return (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryChange(category)}
                                    className={`py-2 px-1 border-b-2 font-light text-base transition-colors ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">{categoryInfo.icon}</span>
                                        <span className="text-base font-light">{categoryInfo.name}</span>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                            {categoryCount}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* 카테고리 설명 */}
                <div className="mt-3 text-sm text-gray-600">
                    {getCategoryInfo(currentCategory).desc}
                </div>
            </div>

            {/* 간소화된 검색 */}
            <div className="mb-4 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder={`${getCategoryInfo(currentCategory).name}에서 검색...`}
                            className="w-full px-3 py-1.5 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">🔍</span>
                        </div>
                    </div>

                    {searchQuery && (
                        <button
                            onClick={handleSearchReset}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                        >
                            초기화
                        </button>
                    )}
                </div>

                {/* 검색 결과 */}
                {searchQuery && (
                    <div className="mt-2 text-sm text-gray-600">
                        <span className="font-light text-blue-600">'{searchQuery}'</span> 검색 결과:
                        <span className="font-light text-blue-600 ml-1">{regularPosts.length}개</span>
                    </div>
                )}
            </div>

            {/* 게시글 목록 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* 테이블 헤더 */}
                <div className="border-b bg-gray-50 p-4">
                    <div className="grid grid-cols-12 gap-4 text-sm font-light text-gray-700">
                        <div className="col-span-1 text-center">번호</div>
                        <div className="col-span-6">제목</div>
                        <div className="col-span-2 text-center">작성자</div>
                        <div className="col-span-2 text-center">작성일</div>
                        <div className="col-span-1 text-center">첨부</div>
                    </div>
                </div>

                {/* 게시글 목록 */}
                <div className="divide-y divide-gray-100">
                    {currentPosts.length > 0 ? (
                        currentPosts.map((post, index) => (
                            <div
                                key={post.id}
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => {
                                    setSelectedPost(post);
                                    setShowModal(true);
                                }}
                            >
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-1 text-center text-sm text-gray-600">
                                        {regularPosts.length - (indexOfFirstPost + index)}
                                    </div>
                                    <div className="col-span-6">
                                        <h3 className="text-sm font-light text-gray-900 group-hover:text-blue-600 line-clamp-1 transition-colors">
                                            {post.title}
                                        </h3>
                                    </div>
                                    <div className="col-span-2 text-center text-sm text-gray-600">
                                        {maskAuthorName(post.author)}
                                    </div>
                                    <div className="col-span-2 text-center text-sm text-gray-600">
                                        {post.date}
                                    </div>
                                    <div className="col-span-1 text-center">
                                        {post.attachments.length > 0 && (
                                            <div className="inline-flex items-center justify-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs bg-blue-100 text-blue-600 rounded-full font-light">
                                                    {post.attachments.length}
                                                </span>
                                                <span className="ml-1 text-blue-600">📎</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <div className="mb-2">
                                {searchQuery ? '�' : '�📝'}
                            </div>
                            <p>
                                {searchQuery
                                    ? `'${searchQuery}' 검색 결과가 없습니다.`
                                    : '등록된 게시글이 없습니다.'
                                }
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={handleSearchReset}
                                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                                >
                                    전체 게시글 보기
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-light hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            이전
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 border rounded-lg text-sm font-light ${currentPage === page
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-light hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            다음
                        </button>
                    </div>
                </div>
            )}

            {/* 게시글 상세보기 모달 */}
            {showModal && selectedPost && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* 모달 헤더 */}
                        <div className="border-b p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h2 className="text-xl font-light text-gray-900 mb-2">{selectedPost.title}</h2>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        <span>👤 {maskAuthorName(selectedPost.author)}</span>
                                        <span>📅 {selectedPost.date}</span>
                                        {selectedPost.attachments.length > 0 && (
                                            <span>📎 첨부파일 {selectedPost.attachments.length}개</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                    {canDeletePost(selectedPost) && (
                                        <button
                                            onClick={() => handleDeletePost(selectedPost.id)}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                        >
                                            🗑️ 삭제
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                                    >
                                        ✕ 닫기
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 모달 내용 */}
                        <div className="p-6">
                            <div className="prose max-w-none mb-6">
                                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                    {selectedPost.content}
                                </div>
                            </div>

                            {/* 첨부파일 */}
                            {selectedPost.attachments.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-light text-gray-900 mb-3">📎 첨부파일 ({selectedPost.attachments.length}개)</h4>
                                    <div className="space-y-2">
                                        {selectedPost.attachments.map(file => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    <span className="text-2xl flex-shrink-0">{getFileIcon(file.name)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-light text-gray-900 truncate" title={file.name}>
                                                            {file.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatFileSize(file.size)} • {getFileExtension(file.name).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => downloadFile(file)}
                                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center space-x-1"
                                                >
                                                    <span>⬇️</span>
                                                    <span>다운로드</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs text-blue-600">
                                            💡 <strong>알림:</strong> 현재는 더미 파일입니다. 실제 파일이 업로드되면 해당 파일이 다운로드됩니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 글쓰기 모달 */}
            {showWriteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* 모달 헤더 */}
                        <div className="border-b p-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-light text-gray-900">
                                    ✏️ {getCategoryInfo(currentCategory).name} 글쓰기
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowWriteModal(false);
                                        setNewPost({ title: '', content: '', attachments: [] });
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* 글쓰기 폼 */}
                        <div className="p-6 space-y-4">
                            {/* 제목 입력 */}
                            <div>
                                <label className="block text-sm font-light text-gray-700 mb-2">제목</label>
                                <input
                                    type="text"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="게시글 제목을 입력하세요"
                                />
                            </div>

                            {/* 내용 입력 */}
                            <div>
                                <label className="block text-sm font-light text-gray-700 mb-2">내용</label>
                                <textarea
                                    value={newPost.content}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                                    rows={10}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="게시글 내용을 입력하세요"
                                />
                            </div>

                            {/* 파일 첨부 */}
                            <div>
                                <label className="block text-sm font-light text-gray-700 mb-2">파일 첨부</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    📎 지원 파일: 이미지(JPG, PNG, GIF), 문서(PDF, DOC, TXT), 압축파일(ZIP, RAR), 기타 일반 파일
                                </p>

                                {/* 첨부된 파일 목록 */}
                                {newPost.attachments.length > 0 && (
                                    <div className="mt-3">
                                        <h5 className="text-sm font-light text-gray-700 mb-2">첨부된 파일 ({newPost.attachments.length}개)</h5>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {newPost.attachments.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                        <span className="text-xl flex-shrink-0">{getFileIcon(file.name)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-light text-gray-900 truncate" title={file.name}>
                                                                {file.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatFileSize(file.size)} • {getFileExtension(file.name).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeAttachment(index)}
                                                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-sm rounded transition-colors flex items-center space-x-1"
                                                        title="파일 제거"
                                                    >
                                                        <span>🗑️</span>
                                                        <span>제거</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 버튼 */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowWriteModal(false);
                                        setNewPost({ title: '', content: '', attachments: [] });
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-light hover:bg-gray-50"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSavePost}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-light"
                                >
                                    게시글 작성
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Board;
