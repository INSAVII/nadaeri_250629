/**
 * SVG 유틸리티 함수들
 * Railway 배포 시 발생하는 SVG viewBox 에러 해결
 */

// SVG viewBox 유효성 검사
export const isValidViewBox = (viewBox: string): boolean => {
    if (!viewBox) return false;

    // 숫자만 허용 (공백으로 구분된 4개 숫자)
    const viewBoxRegex = /^\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$/;
    return viewBoxRegex.test(viewBox);
};

// 잘못된 viewBox 수정
export const fixViewBox = (viewBox: string): string => {
    if (isValidViewBox(viewBox)) {
        return viewBox;
    }

    // 기본값 반환
    return '0 0 24 24';
};

// SVG 요소의 viewBox 수정
export const fixSvgViewBox = (svg: SVGElement): void => {
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox && !isValidViewBox(viewBox)) {
        console.warn('🔧 잘못된 SVG viewBox 수정:', viewBox);
        svg.setAttribute('viewBox', fixViewBox(viewBox));
    }
};

// 페이지의 모든 SVG 요소 검사 및 수정
export const fixAllSvgViewBoxes = (): void => {
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
        fixSvgViewBox(svg);
    });
};

// 동적으로 추가되는 SVG 요소 감지 및 수정
export const observeSvgChanges = (): void => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 직접 추가된 SVG 요소
                    if (node.tagName === 'SVG') {
                        fixSvgViewBox(node as SVGElement);
                    }
                    // 하위에 SVG가 있는 요소
                    const svgs = (node as Element).querySelectorAll?.('svg') || [];
                    svgs.forEach(svg => fixSvgViewBox(svg));
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    return observer;
};

// 외부 스크립트 차단
export const blockExternalScripts = (): void => {
    const blockedScripts = [
        'rrweb',
        'osano',
        'analytics',
        'tracking',
        'recording',
        'hotjar',
        'mixpanel',
        'google-analytics'
    ];

    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        const src = script.src.toLowerCase();
        if (blockedScripts.some(blocked => src.includes(blocked))) {
            console.log('🚫 외부 스크립트 차단:', src);
            script.remove();
        }
    });
};

// 초기화 함수
export const initializeSvgProtection = (): void => {
    // 기존 SVG 요소 수정
    fixAllSvgViewBoxes();

    // 동적 변경 감지
    observeSvgChanges();

    // 외부 스크립트 차단
    blockExternalScripts();

    console.log('🛡️ SVG 보호 시스템 초기화 완료');
}; 