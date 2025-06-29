import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { boardService, BoardPost, BoardFile, CreateBoardRequest } from '../services/boardService';

// 카테고리 타입
type CategoryType = '공지사항' | '자료실' | '업데이트' | '전체';

const BoardAPI: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<BoardPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 카테고리 및 검색 관련 상태
    const [currentCategory, setCurrentCategory] = useState<CategoryType>('전체');
    const [searchQuery, setSearchQuery] = useState('');

    const postsPerPage = 10;

    // 게시글 목록 로드
    const loadPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('게시글 로드 시작:', {
                category: currentCategory === '전체' ? undefined : currentCategory,
                search: searchQuery || undefined,
                skip: (currentPage - 1) * postsPerPage,
                limit: postsPerPage
            });
            
            const data = await boardService.getBoards({
                category: currentCategory === '전체' ? undefined : currentCategory,
                search: searchQuery || undefined,
                skip: (currentPage - 1) * postsPerPage,
                limit: postsPerPage
            });
            
            console.log('게시글 로드 성공:', data);
            setPosts(data);
        } catch (err: any) {
            console.error('게시글 로드 오류 상세:', err);
            console.error('에러 응답:', err.response);
            console.error('에러 데이터:', err.response?.data);
            setError(err.response?.data?.detail || '게시글을 불러오는데 실패했습니다.');
            console.error('게시글 로드 오류:', err);
        } finally {
            setLoading(false);
        }
    };

    // 초기 로드 및 변경 시 재로드
    useEffect(() => {
        loadPosts();
    }, [currentCategory, searchQuery, currentPage]);

    // 카테고리별 게시글 필터링
    const getCategoryPosts = () => {
        return posts.filter(post => {
            if (currentCategory === '전체') return true;
            return post.category === currentCategory;
        });
    };

    // 상단 고정 게시글
    const getPinnedPosts = () => {
        return posts.filter(post => post.is_pinned);
    };

    // 일반 게시글 (고정 제외)
    const getRegularPosts = () => {
        return posts.filter(post => !post.is_pinned);
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

    // 검색어 변경 시 페이지 초기화
    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    // 권한 체크 - 글쓰기
    const canWritePost = () => {
        if (!user) return false;

        // 공지사항은 관리자만 작성 가능
        if (currentCategory === '공지사항') {
            return user.role === 'admin';
        }

        // 나머지는 모든 로그인 사용자 가능
        return true;
    };

    // 삭제 권한 체크
    const canDeletePost = (post: BoardPost) => {
        if (!user) return false;

        // 관리자는 모든 게시글 삭제 가능
        if (user.role === 'admin') return true;

        // 본인 글만 삭제 가능
        return post.author_id === parseInt(user.id);
    };

    // 글쓰기 폼 상태
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        attachments: [] as File[]
    });

    // 파일 크기 포맷팅
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    const downloadFile = async (file: BoardFile) => {
        try {
            await boardService.downloadFile(file.id, file.original_filename);
        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            alert('파일 다운로드 중 오류가 발생했습니다.');
        }
    };

    // 파일 선택 처리
    const handleFileSelect = (event: any) => {
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
    const handleSavePost = async () => {
        if (!user) {
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

        setLoading(true);
        try {
            const createData: CreateBoardRequest = {
                title: newPost.title,
                content: newPost.content,
                category: currentCategory,
                is_pinned: false,
                files: newPost.attachments
            };

            await boardService.createBoard(createData);
            setNewPost({ title: '', content: '', attachments: [] });
            setShowWriteModal(false);
            alert('게시글이 작성되었습니다.');

            // 게시글 목록 새로고침
            await loadPosts();
        } catch (error: any) {
            console.error('게시글 작성 오류:', error);
            alert(error.response?.data?.detail || '게시글 작성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 게시글 삭제
    const handleDeletePost = async (postId: number) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        if (!canDeletePost(post)) {
            alert('삭제 권한이 없습니다.');
            return;
        }

        if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                await boardService.deleteBoard(postId);
                setShowModal(false);
                alert('게시글이 삭제되었습니다.');
                await loadPosts();
            } catch (error: any) {
                console.error('게시글 삭제 오류:', error);
                alert(error.response?.data?.detail || '게시글 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    // 개별 게시글 조회
    const handlePostClick = async (post: BoardPost) => {
        try {
            const detailedPost = await boardService.getBoard(post.id);
            setSelectedPost(detailedPost);
            setShowModal(true);
        } catch (error: any) {
            console.error('게시글 조회 오류:', error);
            alert(error.response?.data?.detail || '게시글을 불러오는데 실패했습니다.');
        }
    };

    // 카테고리 정보
    const getCategoryInfo = (category: CategoryType) => {
        switch (category) {
            case '자료실':
                return { icon: '📚', name: '자료실', desc: '각종 자료 및 문서' };
            case '공지사항':
                return { icon: '📢', name: '공지사항', desc: '중요 공지사항' };
            case '업데이트':
                return { icon: '🔄', name: '업데이트', desc: '시스템 업데이트 정보' };
            case '전체':
                return { icon: '💬', name: '전체', desc: '모든 게시글' };
            default:
                return { icon: '💬', name: '게시판', desc: '게시판' };
        }
    };

    // 페이지네이션
    const pinnedPosts = getPinnedPosts();
    const regularPosts = getRegularPosts();
    const totalPages = Math.ceil(regularPosts.length / postsPerPage);

    return (
        <div className="page-container py-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-light text-gray-800">📋 게시판/자료실</h1>
                {canWritePost() && (
                    <button
                        onClick={() => setShowWriteModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-light transition-colors flex items-center gap-2"
                        disabled={loading}
                    >
                        ✏️ 글쓰기
                    </button>
                )}
            </div>

            {/* 에러 표시 */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">⚠️ {error}</p>
                    <button
                        onClick={() => loadPosts()}
                        className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                        다시 시도
                    </button>
                </div>
            )}

            {/* 카테고리 탭 */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {(['공지사항', '자료실', '업데이트', '전체'] as CategoryType[]).map((category) => {
                            const categoryInfo = getCategoryInfo(category);
                            const isActive = currentCategory === category;
                            const categoryCount = category === '전체' 
                                ? posts.length 
                                : posts.filter(p => p.category === category).length;

                            return (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryChange(category)}
                                    className={`py-2 px-1 border-b-2 font-light text-base transition-colors ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    disabled={loading}
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
                            disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">🔍</span>
                        </div>
                    </div>

                    {searchQuery && (
                        <button
                            onClick={handleSearchReset}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                            disabled={loading}
                        >
                            초기화
                        </button>
                    )}
                </div>

                {/* 검색 결과 */}
                {searchQuery && (
                    <div className="mt-2 text-sm text-gray-600">
                        <span className="font-light text-blue-600">'{searchQuery}'</span> 검색 결과:
                        <span className="font-light text-blue-600 ml-1">{posts.length}개</span>
                    </div>
                )}
            </div>

            {/* 로딩 표시 */}
            {loading && (
                <div className="mb-4 text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">게시글을 불러오는 중...</p>
                </div>
            )}

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
                    {!loading && posts.length > 0 ? (
                        posts.map((post, index) => (
                            <div
                                key={post.id}
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => handlePostClick(post)}
                            >
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-1 text-center text-sm text-gray-600">
                                        {post.is_pinned ? '📌' : index + 1}
                                    </div>
                                    <div className="col-span-6">
                                        <h3 className="text-sm font-light text-gray-900 group-hover:text-blue-600 line-clamp-1 transition-colors">
                                            {post.is_pinned && '📌 '}
                                            {post.title}
                                        </h3>
                                    </div>
                                    <div className="col-span-2 text-center text-sm text-gray-600">
                                        {post.author}
                                    </div>
                                    <div className="col-span-2 text-center text-sm text-gray-600">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="col-span-1 text-center">
                                        {post.files && post.files.length > 0 && (
                                            <div className="inline-flex items-center justify-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs bg-blue-100 text-blue-600 rounded-full font-light">
                                                    {post.files.length}
                                                </span>
                                                <span className="ml-1 text-blue-600">📎</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : !loading ? (
                        <div className="p-8 text-center text-gray-500">
                            <div className="mb-2">
                                {searchQuery ? '🔍' : '📝'}
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
                    ) : null}
                </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-light hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            이전
                        </button>

                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    disabled={loading}
                                    className={`px-3 py-2 border rounded-lg text-sm font-light ${currentPage === page
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || loading}
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
                                        <span>👤 {selectedPost.author}</span>
                                        <span>📅 {new Date(selectedPost.created_at).toLocaleDateString()}</span>
                                        {selectedPost.view_count && (
                                            <span>👁️ 조회 {selectedPost.view_count}</span>
                                        )}
                                        {selectedPost.files && selectedPost.files.length > 0 && (
                                            <span>📎 첨부파일 {selectedPost.files.length}개</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                    {canDeletePost(selectedPost) && (
                                        <button
                                            onClick={() => handleDeletePost(selectedPost.id)}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                            disabled={loading}
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
                            {selectedPost.files && selectedPost.files.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-light text-gray-900 mb-3">📎 첨부파일 ({selectedPost.files.length}개)</h4>
                                    <div className="space-y-2">
                                        {selectedPost.files.map(file => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    <span className="text-2xl flex-shrink-0">{getFileIcon(file.original_filename)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-light text-gray-900 truncate" title={file.original_filename}>
                                                            {file.original_filename}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatFileSize(file.file_size)} • {getFileExtension(file.original_filename).toUpperCase()}
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
                                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-xs text-green-600">
                                            ✅ <strong>실제 파일:</strong> 서버에서 실제 파일을 다운로드합니다.
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
                                    disabled={loading}
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
                                    disabled={loading}
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
                                    disabled={loading}
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
                                        disabled={loading}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    📎 지원 파일: 이미지, 문서, 압축파일 등 (최대 10MB)
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
                                                        disabled={loading}
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
                                    disabled={loading}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSavePost}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-light disabled:bg-gray-400"
                                    disabled={loading}
                                >
                                    {loading ? '작성 중...' : '게시글 작성'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoardAPI;
