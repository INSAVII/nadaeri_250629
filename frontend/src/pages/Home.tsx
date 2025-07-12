import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ServiceCard, TextButton, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import Footer from '../components/Footer';

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

  // 카카오톡 채널 정보 (실제 채널 ID로 변경)
  const KAKAO_CHANNEL_ID = "_WZPFn"; // 새로운 웹서비스 상담용 채널 ID
  const KAKAO_CHANNEL_URL = `https://pf.kakao.com/${KAKAO_CHANNEL_ID}`;

  // 무통장 입금 정보
  const BANK_INFO = {
    bankName: "농협은행",
    accountNumber: "312-0038-5739-21",
    accountHolder: "최호진",
    phoneNumber: "010-5904-2213"
  };

  // 홍보문구 로드 함수
  const loadPromotionText = async () => {
    try {
      // 실제 API 호출
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/promotion/current`);
      if (response.ok) {
        const data = await response.json();
        setPromotionStyle(data.promotion);
        return;
      } else {
        console.warn('API 응답 오류:', response.status);
      }
    } catch (error) {
      console.warn('API 호출 실패:', error);
    }

    // API 실패시 localStorage에서 홍보문구 로드 (fallback)
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
    // 백화면 방지: 즉시 mounted 상태를 true로 설정
    setMounted(true);
    loadPromotionText();
  }, []);

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
  ];

  // 백화면 방지: 로딩 중에도 기본 레이아웃 표시
  if (!mounted) {
    return (
      <div className="w-full">
        <div className="qc-container py-4">
          <div className="flex items-center justify-center py-8">
            <Loading size="md" text="페이지 로딩 중..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="qc-container py-4">
        {/* 히어로 섹션 */}
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
          </div>
        </section>

        {/* 로그인 유도 메시지 - 비로그인 상태에서만 표시 */}
        {!isAuthenticated && (
          <section className="py-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-light text-blue-800 mb-2">🔐 서비스 이용 안내</h3>
              <p className="text-sm text-blue-700 mb-3">
                서비스를 이용하시려면 먼저 로그인해주세요.
              </p>
              <div className="flex justify-center space-x-3">
                <Link to="/login">
                  <TextButton className="bg-blue-600 text-white hover:bg-blue-700">
                    로그인
                  </TextButton>
                </Link>
                <Link to="/signup">
                  <TextButton className="bg-green-600 text-white hover:bg-green-700">
                    회원가입
                  </TextButton>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 🆕 카카오톡 연락 및 무통장 입금 섹션 */}
        <section className="py-6 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-light text-center text-gray-800 mb-6">
              💬 문의 및 결제 안내
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 카카오톡 연락 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">💬</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">카카오톡 문의</h3>
                    <p className="text-sm text-gray-600">실시간 상담 및 기술지원</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    • 서비스 이용 문의<br />
                    • 기술적 문제 해결<br />
                    • 계정 및 결제 문의<br />
                    • 기능 개선 제안
                  </p>

                  <a
                    href={KAKAO_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
                  >
                    <span className="mr-2">💬</span>
                    카카오톡으로 문의하기
                  </a>
                </div>
              </div>

              {/* 무통장 입금 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">무통장 입금</h3>
                    <p className="text-sm text-gray-600">예치금 충전 및 서비스 결제</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>입금 계좌 정보</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      은행: {BANK_INFO.bankName}<br />
                      계좌번호: {BANK_INFO.accountNumber}<br />
                      예금주: {BANK_INFO.accountHolder}
                    </p>
                  </div>

                  <button
                    onClick={() => window.open('/bank-transfer', '_blank')}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <span className="mr-2">💰</span>
                    무통장 입금 신청
                  </button>

                  <p className="text-xs text-gray-500">
                    * 입금 후 관리자 확인 시 즉시 예치금이 충전됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 추가 안내사항 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📞 추가 연락처</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <strong>관리자 전화:</strong> {BANK_INFO.phoneNumber}
                </div>
                <div>
                  <strong>운영시간:</strong> 평일 09:00 ~ 18:00
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 기존 안내사항들... */}
        <section className="py-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-light text-gray-800 mb-2">📋 이용 안내</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p>• 서비스 이용 전 로그인이 필요합니다</p>
                <p>• 예치금을 충전하여 서비스를 이용하세요</p>
              </div>
              <div>
                <p>• 기술지원은 카카오톡으로 문의하세요</p>
                <p>• 무통장 입금은 관리자 확인 후 처리됩니다</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
