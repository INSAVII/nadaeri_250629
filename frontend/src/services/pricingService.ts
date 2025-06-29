// import { apiConfig } from '../../app/config/apiConfig';

console.log('🔍 pricingService.ts 파일 로드됨');

export interface PricingData {
    qcapture_free: number;
    qcapture_1month: number;
    qcapture_3month: number;
    qtext: number;
    qname: number;
}

export interface PricingPolicy {
    id: string;
    service_type: string;
    name: string;
    base_price: number;
    unit_price: number;
    min_count: number;
    max_count?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// 현재 적용된 가격 정책 조회
export const getCurrentPricing = async (): Promise<PricingData> => {
    console.log('🔍 pricingService: getCurrentPricing 시작');
    try {
        console.log('🔍 pricingService: API 호출 시작 - /api/pricing/policies?active_only=true');

        // 프록시를 통해 API 호출 (상대 경로 사용)
        const response = await fetch(`/api/pricing/policies?active_only=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('🔍 pricingService: API 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
            console.error('❌ pricingService: API 응답 오류:', response.status, response.statusText);
            throw new Error('가격 정보를 불러오는데 실패했습니다.');
        }

        const policies: PricingPolicy[] = await response.json();
        console.log('🔍 pricingService: 가격 정책 조회 결과:', policies);

        // 기본값 설정
        const defaultPricing: PricingData = {
            qcapture_free: 0,
            qcapture_1month: 100,
            qcapture_3month: 80,
            qtext: 200,
            qname: 50
        };

        // API에서 받은 정책들을 기본값에 매핑
        policies.forEach(policy => {
            console.log('🔍 pricingService: 정책 처리 중:', policy.service_type, policy.unit_price);
            switch (policy.service_type) {
                case 'qcapture_free':
                    defaultPricing.qcapture_free = policy.unit_price;
                    break;
                case 'qcapture_1month':
                    defaultPricing.qcapture_1month = policy.unit_price;
                    break;
                case 'qcapture_3month':
                    defaultPricing.qcapture_3month = policy.unit_price;
                    break;
                case 'qtext':
                    defaultPricing.qtext = policy.unit_price;
                    break;
                case 'qname':
                    defaultPricing.qname = policy.unit_price;
                    break;
            }
        });

        console.log('🔍 pricingService: 최종 가격 정보:', defaultPricing);
        return defaultPricing;
    } catch (error) {
        console.error('❌ pricingService: 가격 정보 조회 실패:', error);
        // 에러 시 기본값 반환
        const fallbackPricing = {
            qcapture_free: 0,
            qcapture_1month: 100,
            qcapture_3month: 80,
            qtext: 200,
            qname: 50
        };
        console.log('🔍 pricingService: 기본값 반환:', fallbackPricing);
        return fallbackPricing;
    }
};

// 특정 서비스의 가격 계산
export const calculateServicePrice = async (
    serviceType: string,
    itemCount: number
): Promise<{ price: number; policy?: any }> => {
    try {
        const response = await fetch(`/api/pricing/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_type: serviceType,
                item_count: itemCount
            }),
        });

        if (!response.ok) {
            throw new Error('가격 계산에 실패했습니다.');
        }

        return await response.json();
    } catch (error) {
        console.error('가격 계산 실패:', error);
        // 에러 시 기본 계산 (50원/건)
        return { price: itemCount * 50 };
    }
};

// 가격 정책 업데이트 (관리자 전용)
export const updatePricingPolicy = async (
    pricingData: PricingData,
    token: string
): Promise<boolean> => {
    try {
        // 각 서비스별로 가격 정책 업데이트
        const services = [
            { type: 'qcapture_free', price: pricingData.qcapture_free },
            { type: 'qcapture_1month', price: pricingData.qcapture_1month },
            { type: 'qcapture_3month', price: pricingData.qcapture_3month },
            { type: 'qtext', price: pricingData.qtext },
            { type: 'qname', price: pricingData.qname }
        ];

        for (const service of services) {
            // 먼저 기존 정책 조회
            const policiesResponse = await fetch(
                `/api/pricing/policies?service_type=${service.type}&active_only=true`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                }
            );

            if (policiesResponse.ok) {
                const policies: PricingPolicy[] = await policiesResponse.json();

                if (policies.length > 0) {
                    // 기존 정책 업데이트
                    const policy = policies[0];
                    await fetch(`/api/pricing/policies/${policy.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            service_type: service.type,
                            name: `${service.type} 서비스`,
                            base_price: 0,
                            unit_price: service.price,
                            min_count: 1,
                            max_count: null
                        }),
                    });
                } else {
                    // 새 정책 생성
                    await fetch(`/api/pricing/policies`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            service_type: service.type,
                            name: `${service.type} 서비스`,
                            base_price: 0,
                            unit_price: service.price,
                            min_count: 1,
                            max_count: null
                        }),
                    });
                }
            }
        }

        return true;
    } catch (error) {
        console.error('가격 정책 업데이트 실패:', error);
        return false;
    }
}; 