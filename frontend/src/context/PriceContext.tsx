import React, { createContext, useContext, useState, useEffect } from 'react';

interface PriceContextType {
    qnamePrice: number;
    setQnamePrice: (price: number) => void;
    qtextPrice: number;
    setQtextPrice: (price: number) => void;
    qcapturePrice: number;
    setQcapturePrice: (price: number) => void;
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
    const [qnamePrice, setQnamePrice] = useState(0);
    const [qtextPrice, setQtextPrice] = useState(0);
    const [qcapturePrice, setQcapturePrice] = useState(0);
    const [loading, setLoading] = useState(true);

    // API에서 가격 정보 로드
    useEffect(() => {
        const loadPrices = async () => {
            try {
                const response = await fetch('/api/pricing');
                if (response.ok) {
                    const data = await response.json();
                    setQnamePrice(data.qname || 0);
                    setQtextPrice(data.qtext || 0);
                    setQcapturePrice(data.qcapture || 0);
                } else {
                    console.warn('가격 정보 로드 실패, 기본값 사용');
                    setQnamePrice(50);
                    setQtextPrice(30);
                    setQcapturePrice(20);
                }
            } catch (error) {
                console.error('가격 정보 로드 오류:', error);
                setQnamePrice(50);
                setQtextPrice(30);
                setQcapturePrice(20);
            } finally {
                setLoading(false);
            }
        };

        loadPrices();
    }, []);

    // API 기반 가격 정보만 사용 (localStorage 제거)

    const value = {
        qnamePrice,
        setQnamePrice,
        qtextPrice,
        setQtextPrice,
        qcapturePrice,
        setQcapturePrice,
    };

    return (
        <PriceContext.Provider value={value}>
            {children}
        </PriceContext.Provider>
    );
}; 