import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ServiceCard, TextButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";

interface PromotionStyle {
  text: string;
  fontSize: string;
  color: string;
  fontWeight: string;
}

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [promotionStyle, setPromotionStyle] = useState<PromotionStyle>({
    text: '대량가공판매자님을위한 상품명짖기, 목록이미지캡쳐 자동저장, 카테번호, 키워드추출 자동화',
    fontSize: 'normal',
    color: 'default',
    fontWeight: 'normal'
  });
  // 홍보문구 로드 함수
  const loadPromotionText = () => {
    try {
      const savedPromotion = localStorage.getItem('qclick_promotion');
      if (savedPromotion) {
        const promotionData = JSON.parse(savedPromotion);
        setPromotionStyle(promotionData);
      } else {
        // 기본값 유지
        const defaultPromotion = {
          text: '대량가공판매자님을위한 상품명짖기, 목록이미지캡쳐 자동저장, 카테번호, 키워드추출 자동화',
          fontSize: 'normal',
          color: 'default',
          fontWeight: 'normal'
        };
        setPromotionStyle(defaultPromotion);
      }
    } catch (error) {
      console.warn('홍보문구 로드 실패, 기본값 사용:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadPromotionText();
  }, [isAuthenticated, user, isLoading]);

  // localStorage 변경 감지 (다른 탭/페이지에서 홍보문구 변경 시)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'qclick_promotion') {
        loadPromotionText();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 포커스 이벤트 감지 (같은 탭에서 홍보문구 관리 페이지에서 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      loadPromotionText();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 스타일 적용 함수
  const getPromotionClasses = () => {
    let classes = 'text-base text-gray-600 max-w-2xl mx-auto font-light';

    // 폰트 크기
    switch (promotionStyle.fontSize) {
      case 'small':
        classes = classes.replace('text-base', 'text-sm');
        break;
      case 'large':
        classes = classes.replace('text-base', 'text-lg');
        break;
      default:
        break; // text-base 유지
    }

    // 색상
    switch (promotionStyle.color) {
      case 'blue':
        classes = classes.replace('text-gray-600', 'text-blue-600');
        break;
      case 'red':
        classes = classes.replace('text-gray-600', 'text-red-600');
        break;
      case 'green':
        classes = classes.replace('text-gray-600', 'text-green-600');
        break;
      default:
        break; // text-gray-600 유지
    }

    // 굵기
    if (promotionStyle.fontWeight === 'bold') {
      classes = classes.replace('font-light', 'font-semibold');
    }

    return classes;
  };
  // 서비스 카드 데이터 - 모든 링크를 로그인으로 유도  // 로그인 상태에 따른 서비스 링크 생성
  const getServicePath = (serviceId: string) => {
    if (!isAuthenticated) {
      return "/login";
    }

    if (user?.role === 'admin') {
      return `/admin/${serviceId}`;
    } else {
      return `/app/${serviceId}`;
    }
  };

  const services = [
    {
      id: "qname",
      title: "큐네임",
      description: "엑셀에 상품코드와 상품키워드3개이상 기입해서 업로드하면 SEO최적화 상품명과 카테 키워드가 자동기입됩니다.",
      path: getServicePath("qname"),
      color: "border-blue-100 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
    },
    {
      id: "qcapture",
      title: "큐캡쳐",
      description: "상세페이지로부터 고품질목록이미지를 신속하고 대량으로 추출하는 캡쳐 프로그램입니다.",
      path: getServicePath("qcapture"),
      color: "border-emerald-100 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
    },
    {
      id: "qtext",
      title: "큐문자",
      description: "큐캡쳐로 캡쳐된 목록이미지를 대량으로 업로드하면 이미지에포함된 문자를 자동으로 제거해줍니다.",
      path: getServicePath("qtext"),
      color: "border-rose-100 hover:border-rose-300 bg-rose-50 hover:bg-rose-100"
    }
  ]; return (
    <div className="w-full">
      <div className="qc-container py-4">{/* 히어로 섹션 */}
        <section className="text-center py-6 mb-6">          
          <h1 className="text-6xl font-light text-blue-600 mb-4">
            나대리que
          </h1>
          <div className="flex items-center justify-center mb-4">
            <p className={getPromotionClasses()}>
              {promotionStyle.text}
            </p>
            <button
              onClick={loadPromotionText}
              className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              title="홍보문구 새로고침"
            >
              🔄
            </button>
          </div>
        </section>

        {/* 서비스 소개 섹션 */}
        <section className="py-3 mb-4">
          <h2 className="text-xl font-light mb-3 text-center text-gray-700">주요 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-16">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                type={service.id as 'qcapture' | 'qtext' | 'qname'}
                path={service.path}
                colorClass={service.color}
              />
            ))}
          </div>        </section>

        {/* 로그인 유도 메시지 - 비로그인 상태에서만 표시 */}
        {!isAuthenticated && (
          <section className="py-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-light text-blue-800 mb-2">🔐 서비스 이용 안내</h3>
              <p className="text-sm text-blue-700 font-light mb-4">
                나대리que 서비스를 이용하시려면 로그인이 필요합니다.<br />
                위의 서비스 카드를 클릭하시면 로그인 페이지로 이동합니다.
              </p>
              <div className="space-x-4">
                <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded font-light hover:bg-blue-700 transition-colors">
                  로그인
                </Link>
                <Link to="/signup" className="bg-gray-600 text-white px-6 py-2 rounded font-light hover:bg-gray-700 transition-colors">
                  회원가입
                </Link>
              </div>
            </div>          </section>
        )}

        {/* 로그인된 사용자를 위한 환영 메시지 */}
        {isAuthenticated && user && (
          <section className="py-4 mb-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-light text-green-800 mb-2">
                👋 안녕하세요, <span className="font-medium">{user.name}</span>님!
              </h3>
              <p className="text-sm text-green-700 font-light mb-4">
                {user.role === 'admin' ? '관리자' : '사용자'}로 로그인하셨습니다. 위의 서비스를 자유롭게 이용해보세요.
                {user.role !== 'admin' && user.balance !== undefined && (
                  <>
                    <br />현재 예치금: <span className="font-medium">{user.balance?.toLocaleString()}원</span>
                  </>
                )}
              </p>
            </div>
          </section>
        )}

        {/* 이점 소개 섹션 */}
        <section className="py-3 mb-4 bg-gray-50 rounded border">
          <div className="px-4">
            <h2 className="text-base font-light mb-3 text-center text-gray-700">나대리que의 이점</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="p-3">
                <h3 className="text-xs font-light mb-1 text-gray-700">⚡ 업무 효율성 향상</h3>
                <p className="text-xs text-gray-600 font-light">반복적인 데이터 입력 작업을 자동화하여 시간을 절약하세요.</p>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-light mb-1 text-gray-700">🔍 데이터 정확성</h3>
                <p className="text-xs text-gray-600 font-light">자동화된 처리로 인적 오류를 줄이고 데이터 품질을 향상시킵니다.</p>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-light mb-1 text-gray-700">💼 비용 절감</h3>
                <p className="text-xs text-gray-600 font-light">인력 비용을 줄이고 업무 처리 시간을 단축하여 비용을 절감하세요.</p>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-light mb-1 text-gray-700">📈 생산성 증가</h3>
                <p className="text-xs text-gray-600 font-light">핵심 업무에 집중할 수 있도록 반복 작업을 최소화합니다.</p>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-light mb-1 text-gray-700">🔄 통합 워크플로우</h3>
                <p className="text-xs text-gray-600 font-light">다양한 서비스를 하나의 플랫폼에서 연결하여 작업 흐름을 개선합니다.</p>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-light mb-1 text-gray-700">📊 데이터 분석</h3>
                <p className="text-xs text-gray-600 font-light">처리된 데이터를 통해 인사이트를 얻고 더 나은 의사결정을 내리세요.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-4 text-center">
          <h2 className="text-base font-light mb-2 text-gray-700">지금 바로 시작하세요</h2>
          <p className="text-xs mb-3 max-w-xl mx-auto text-gray-600 font-light">
            Q서비스로 상품 정보 관리를 효율적으로 하고, 비용과 시간을 절약하세요.
          </p>
          <div className="flex justify-center space-x-3">
            <Link to="/login">
              <TextButton variant="primary" size="sm">로그인하기</TextButton>
            </Link>
            <Link to="/signup">
              <TextButton variant="secondary" size="sm">회원가입하기</TextButton>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
