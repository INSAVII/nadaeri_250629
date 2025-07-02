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
    // 기본 가격 설정
    const [qnamePrice, setQnamePrice] = useState(50);
    const [qtextPrice, setQtextPrice] = useState(30);
    const [qcapturePrice, setQcapturePrice] = useState(20);

    // localStorage에서 가격 정보 로드 (초기화 시)
    useEffect(() => {
        const loadPricesFromStorage = () => {
            try {
                const storedQnamePrice = localStorage.getItem('qnamePrice');
                const storedQtextPrice = localStorage.getItem('qtextPrice');
                const storedQcapturePrice = localStorage.getItem('qcapturePrice');

                if (storedQnamePrice) setQnamePrice(Number(storedQnamePrice));
                if (storedQtextPrice) setQtextPrice(Number(storedQtextPrice));
                if (storedQcapturePrice) setQcapturePrice(Number(storedQcapturePrice));
            } catch (error) {
                console.error('가격 정보 로드 오류:', error);
            }
        };

        loadPricesFromStorage();
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

    const value = {
        qnamePrice,
        setQnamePrice: handleQnamePriceChange,
        qtextPrice,
        setQtextPrice: handleQtextPriceChange,
        qcapturePrice,
        setQcapturePrice: handleQcapturePriceChange,
    };

    return (
        <PriceContext.Provider value={value}>
            {children}
        </PriceContext.Provider>
    );
}; 