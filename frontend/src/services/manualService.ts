// TODO: 이 파일은 임시입니다. 메뉴얼 기능을 게시판으로 완전 통합 후 삭제 예정

// 임시 manualService - 게시판 통합을 위한 임시 구현
class ManualService {
    async getManualByService(service: string) {
        // 게시판으로 리다이렉트하기 위한 임시 구현
        throw new Error('메뉴얼 기능이 게시판/자료실로 이전되었습니다.');
    }

    getDownloadUrl(filename: string) {
        return '#';
    }

    getFileIcon(filename: string) {
        return '📄';
    }

    formatFileSize(size: number) {
        return `${size} bytes`;
    }
}

export const manualService = new ManualService();
