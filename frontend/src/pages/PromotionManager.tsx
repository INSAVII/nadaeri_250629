import React, { useState, useEffect } from 'react';

interface PromotionStyle {
  text: string;
  fontSize: 'small' | 'normal' | 'large';
  color: 'default' | 'blue' | 'red' | 'green';
  fontWeight: 'normal' | 'bold';
}

export default function PromotionManager() {
  const [currentPromotion, setCurrentPromotion] = useState<PromotionStyle>({
    text: '',
    fontSize: 'normal',
    color: 'default',
    fontWeight: 'normal'
  });
  const [draftPromotion, setDraftPromotion] = useState<PromotionStyle>({
    text: '',
    fontSize: 'normal',
    color: 'default',
    fontWeight: 'normal'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 컴포넌트 마운트 시 현재 홍보문구 로드
  useEffect(() => {
    loadCurrentPromotion();
  }, []);

  // 현재 홍보문구 로드
  const loadCurrentPromotion = async () => {
    try {
      // TODO: db 기반으로 전환시 구축 - 실제 API 호출
      // const response = await fetch('http://localhost:8001/api/promotion/current');
      // if (response.ok) {
      //   const data = await response.json();
      //   const promotionData = data.promotion || defaultPromotion;
      //   setCurrentPromotion(promotionData);
      //   setDraftPromotion(promotionData);
      // }

      // Mock 데이터: localStorage에서 홍보문구 로드
      const savedPromotion = localStorage.getItem('qclick_promotion');
      if (savedPromotion) {
        try {
          const promotionData = JSON.parse(savedPromotion);
          setCurrentPromotion(promotionData);
          setDraftPromotion(promotionData);
          return;
        } catch (parseError) {
          console.warn('저장된 홍보문구 파싱 실패:', parseError);
        }
      }

      // 기본값 설정
      const defaultPromotion = {
        text: '대량가공판매자님을위한 상품명짖기, 목록이미지캡쳐 자동저장, 카테번호, 키워드추출 자동화',
        fontSize: 'normal' as const,
        color: 'default' as const,
        fontWeight: 'normal' as const
      };
      setCurrentPromotion(defaultPromotion);
      setDraftPromotion(defaultPromotion);

      // localStorage에 기본값 저장
      localStorage.setItem('qclick_promotion', JSON.stringify(defaultPromotion));
    } catch (error) {
      console.warn('홍보문구 로드 실패 (기본값 사용):', error);
      // 기본값 설정으로 계속 진행
      const defaultPromotion = {
        text: '대량가공판매자님을위한 상품명짖기, 목록이미지캡쳐 자동저장, 카테번호, 키워드추출 자동화',
        fontSize: 'normal' as const,
        color: 'default' as const,
        fontWeight: 'normal' as const
      };
      setCurrentPromotion(defaultPromotion);
      setDraftPromotion(defaultPromotion);
      setMessage('홍보문구를 불러올 수 없어 기본값을 사용합니다.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 사이트 개시 (홍보문구 적용)
  const publishPromotion = async () => {
    if (!draftPromotion.text.trim()) {
      setMessage('홍보문구를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: db 기반으로 전환시 구축 - 실제 API 호출
      // const response = await fetch('http://localhost:8001/api/promotion/publish', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ promotion: draftPromotion }),
      // });
      // if (response.ok) {
      //   setCurrentPromotion(draftPromotion);
      //   setMessage('홍보문구가 성공적으로 사이트에 적용되었습니다.');
      // } else {
      //   setMessage('홍보문구 적용에 실패했습니다.');
      // }

      // Mock 데이터: localStorage에 홍보문구 저장
      localStorage.setItem('qclick_promotion', JSON.stringify(draftPromotion));
      setCurrentPromotion(draftPromotion);
      setMessage('홍보문구가 성공적으로 사이트에 적용되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.warn('홍보문구 적용 실패:', error);
      setMessage('홍보문구 적용 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기화 (현재 적용된 내용으로 되돌리기)
  const resetToDraft = () => {
    setDraftPromotion(currentPromotion);
    setMessage('현재 적용된 내용으로 초기화했습니다.');
    setTimeout(() => setMessage(''), 3000);
  };

  // 이모티콘 삽입
  const insertEmoji = (emoji: string) => {
    setDraftPromotion(prev => ({
      ...prev,
      text: prev.text + emoji
    }));
  };

  // 스타일 적용 함수
  const getStyleClasses = (style: PromotionStyle) => {
    let classes = 'font-light whitespace-pre-wrap';

    // 폰트 크기
    switch (style.fontSize) {
      case 'small': classes += ' text-sm'; break;
      case 'large': classes += ' text-lg'; break;
      default: classes += ' text-base'; break;
    }

    // 색상
    switch (style.color) {
      case 'blue': classes += ' text-blue-600'; break;
      case 'red': classes += ' text-red-600'; break;
      case 'green': classes += ' text-green-600'; break;
      default: classes += ' text-gray-700'; break;
    }

    // 굵기
    if (style.fontWeight === 'bold') {
      classes = classes.replace('font-light', 'font-semibold');
    }

    return classes;
  };

  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-light mb-6">홍보문구관리</h1>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.includes('성공') ? 'bg-green-100 text-green-700' :
          message.includes('실패') || message.includes('오류') ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 현재 적용된 홍보문구 */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-light mb-4 text-gray-800">현재 사이트에 적용된 홍보문구</h2>
          <div className="bg-gray-50 p-4 rounded-md min-h-[100px]">
            <p className={getStyleClasses(currentPromotion)}>
              {currentPromotion.text}
            </p>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            홈페이지 메인화면에 표시되는 내용입니다.
          </div>
        </div>

        {/* 편집 영역 */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-light mb-4 text-gray-800">홍보문구 편집</h2>

          {/* 서식 옵션 */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* 폰트 크기 */}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-1">크기</label>
              <select
                value={draftPromotion.fontSize}
                onChange={(e) => setDraftPromotion(prev => ({
                  ...prev,
                  fontSize: e.target.value as 'small' | 'normal' | 'large'
                }))}
                className="w-full p-2 border border-gray-300 rounded text-sm font-light focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">작게</option>
                <option value="normal">보통</option>
                <option value="large">크게</option>
              </select>
            </div>

            {/* 색상 */}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-1">색상</label>
              <select
                value={draftPromotion.color}
                onChange={(e) => setDraftPromotion(prev => ({
                  ...prev,
                  color: e.target.value as 'default' | 'blue' | 'red' | 'green'
                }))}
                className="w-full p-2 border border-gray-300 rounded text-sm font-light focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="default">기본</option>
                <option value="blue">파랑</option>
                <option value="red">빨강</option>
                <option value="green">초록</option>
              </select>
            </div>

            {/* 굵기 */}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-1">굵기</label>
              <select
                value={draftPromotion.fontWeight}
                onChange={(e) => setDraftPromotion(prev => ({
                  ...prev,
                  fontWeight: e.target.value as 'normal' | 'bold'
                }))}
                className="w-full p-2 border border-gray-300 rounded text-sm font-light focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="normal">보통</option>
                <option value="bold">굵게</option>
              </select>
            </div>
          </div>

          {/* 이모티콘 버튼 */}
          <div className="mb-4">
            <label className="block text-sm font-light text-gray-700 mb-2">이모티콘 삽입</label>
            <div className="flex flex-wrap gap-2">
              {['🎯', '⭐', '🚀', '💡', '📦', '✨', '🔥', '💎', '🏆', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="px-3 py-1 text-lg border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 텍스트 에디터 */}
          <div className="mb-4">
            <label className="block text-sm font-light text-gray-700 mb-2">
              홍보문구 내용
            </label>
            <textarea
              value={draftPromotion.text}
              onChange={(e) => setDraftPromotion(prev => ({
                ...prev,
                text: e.target.value
              }))}
              className="w-full h-32 p-3 border border-gray-300 rounded-md font-light text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="홍보문구를 입력하세요..."
            />
            <div className="mt-1 text-xs text-gray-500">
              {draftPromotion.text.length} / 200자
            </div>
          </div>

          {/* 미리보기 */}
          <div className="mb-4">
            <label className="block text-sm font-light text-gray-700 mb-2">
              미리보기
            </label>
            <div className="bg-blue-50 p-4 rounded-md min-h-[80px] border">
              <p className={getStyleClasses(draftPromotion)}>
                {draftPromotion.text || '홍보문구를 입력하세요...'}
              </p>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={publishPromotion}
              disabled={isLoading || !draftPromotion.text.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-light text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '적용 중...' : '사이트 개시'}
            </button>

            <button
              onClick={resetToDraft}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md font-light text-sm hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              초기화
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            ※ "사이트 개시" 버튼을 클릭하면 홈페이지에 즉시 적용됩니다.
          </div>
        </div>
      </div>

      {/* 사용 가이드 */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-light mb-3 text-gray-800">사용 가이드</h3>
        <ul className="text-sm text-gray-600 font-light space-y-2">
          <li>• 홍보문구는 홈페이지 메인 타이틀 하단에 표시됩니다.</li>
          <li>• 크기, 색상, 굵기를 선택하여 원하는 스타일로 설정할 수 있습니다.</li>
          <li>• 이모티콘 버튼을 클릭하여 문구에 이모티콘을 추가할 수 있습니다.</li>
          <li>• 수정한 내용은 "사이트 개시" 버튼을 클릭해야 실제 사이트에 적용됩니다.</li>
          <li>• "초기화" 버튼을 클릭하면 현재 적용된 내용으로 되돌아갑니다.</li>
          <li>• 권장 글자 수는 50-200자입니다.</li>
        </ul>
      </div>
    </div>
  );
}
