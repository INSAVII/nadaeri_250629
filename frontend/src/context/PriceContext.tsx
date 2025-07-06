import React, { createContext, useContext, useState, useEffect } from 'react';

interface PriceContextType {
    qnamePrice: number;
    setQnamePrice: (price: number) => void;
    qtextPrice: number;
    setQtextPrice: (price: number) => void;
    qcapturePrice: number;
    setQcapturePrice: (price: number) => void;
    qcaptureMonth1Price: number;
    setQcaptureMonth1Price: (price: number) => void;
    qcaptureMonth3Price: number;
    setQcaptureMonth3Price: (price: number) => void;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export const usePrice = () => {
    const context = useContext(PriceContext);
    if (context === undefined) {
        throw new Error('usePrice must be used within a PriceProvider');
    }
    return context;
};

export const PriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 기본 가격 설정
    const [qnamePrice, setQnamePrice] = useState(50);
    const [qtextPrice, setQtextPrice] = useState(30);
    const [qcapturePrice, setQcapturePrice] = useState(20);
    // 큐캡쳐 월별 가격 (기본값)
    const [qcaptureMonth1Price, setQcaptureMonth1Price] = useState(50000);  // 1개월: 50,000원
    const [qcaptureMonth3Price, setQcaptureMonth3Price] = useState(120000); // 3개월: 120,000원

    // 데이터베이스에서 가격 정보 로드 (초기화 시 - 선택적)
    useEffect(() => {
        const loadPricesFromDatabase = async () => {
            try {
                console.log('🔄 가격 설정 로드 시도...');
                const response = await fetch('/api/programs/price-settings');

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setQcaptureMonth1Price(data.prices.qcapture_month1_price);
                        setQcaptureMonth3Price(data.prices.qcapture_month3_price);
                        console.log('✅ 데이터베이스에서 가격 설정 로드 완료:', data.prices);
                    } else {
                        console.warn('⚠️ 가격 설정 응답이 성공하지 않음:', data);
                        loadFromLocalStorage();
                    }
                } else {
                    console.warn('⚠️ 가격 설정 API 응답 오류:', response.status, response.statusText);
                    loadFromLocalStorage();
                }
            } catch (error) {
                console.warn('⚠️ 데이터베이스에서 가격 설정 로드 실패 (정상적인 상황):', error);
                loadFromLocalStorage();
            }
        };

        const loadFromLocalStorage = () => {
            console.log('📦 localStorage에서 가격 설정 로드...');
            const storedQcaptureMonth1Price = localStorage.getItem('qcaptureMonth1Price');
            const storedQcaptureMonth3Price = localStorage.getItem('qcaptureMonth3Price');

            if (storedQcaptureMonth1Price) {
                setQcaptureMonth1Price(Number(storedQcaptureMonth1Price));
                console.log('✅ localStorage에서 1개월 가격 로드:', storedQcaptureMonth1Price);
            }
            if (storedQcaptureMonth3Price) {
                setQcaptureMonth3Price(Number(storedQcaptureMonth3Price));
                console.log('✅ localStorage에서 3개월 가격 로드:', storedQcaptureMonth3Price);
            }
        };

        // 가격 정보 로드 시도 (실패해도 앱은 정상 작동)
        loadPricesFromDatabase();
    }, []);

    // 가격 변경 시 localStorage에 저장
    const handleQnamePriceChange = (price: number) => {
        setQnamePrice(price);
        localStorage.setItem('qnamePrice', price.toString());
    };

    const handleQtextPriceChange = (price: number) => {
        setQtextPrice(price);
        localStorage.setItem('qtextPrice', price.toString());
    };

    const handleQcapturePriceChange = (price: number) => {
        setQcapturePrice(price);
        localStorage.setItem('qcapturePrice', price.toString());
    };

    const handleQcaptureMonth1PriceChange = async (price: number) => {
        setQcaptureMonth1Price(price);
        localStorage.setItem('qcaptureMonth1Price', price.toString());

        // 데이터베이스에 저장
        try {
            const response = await fetch('/api/programs/price-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    qcapture_month1_price: price,
                    qcapture_month3_price: qcaptureMonth3Price
                })
            });

            if (response.ok) {
                console.log('✅ 1개월 가격 설정이 데이터베이스에 저장되었습니다:', price);
            } else {
                console.error('❌ 1개월 가격 설정 저장 실패:', response.statusText);
            }
        } catch (error) {
            console.error('❌ 1개월 가격 설정 저장 중 오류:', error);
        }
    };

    const handleQcaptureMonth3PriceChange = async (price: number) => {
        setQcaptureMonth3Price(price);
        localStorage.setItem('qcaptureMonth3Price', price.toString());

        // 데이터베이스에 저장
        try {
            const response = await fetch('/api/programs/price-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    qcapture_month1_price: qcaptureMonth1Price,
                    qcapture_month3_price: price
                })
            });

            if (response.ok) {
                console.log('✅ 3개월 가격 설정이 데이터베이스에 저장되었습니다:', price);
            } else {
                console.error('❌ 3개월 가격 설정 저장 실패:', response.statusText);
            }
        } catch (error) {
            console.error('❌ 3개월 가격 설정 저장 중 오류:', error);
        }
    };

    const value = {
        qnamePrice,
        setQnamePrice: handleQnamePriceChange,
        qtextPrice,
        setQtextPrice: handleQtextPriceChange,
        qcapturePrice,
        setQcapturePrice: handleQcapturePriceChange,
        qcaptureMonth1Price,
        setQcaptureMonth1Price: handleQcaptureMonth1PriceChange,
        qcaptureMonth3Price,
        setQcaptureMonth3Price: handleQcaptureMonth3PriceChange,
    };

    return (
        <PriceContext.Provider value={value}>
            {children}
        </PriceContext.Provider>
    );
}; 