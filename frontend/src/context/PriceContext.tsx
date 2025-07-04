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
    const [qcaptureMonth1Price, setQcaptureMonth1Price] = useState(5000);  // 1개월: 5,000원
    const [qcaptureMonth3Price, setQcaptureMonth3Price] = useState(12000); // 3개월: 12,000원

    // localStorage에서 가격 정보 로드 (초기화 시)
    useEffect(() => {
        const loadPricesFromStorage = () => {
            try {
                const storedQnamePrice = localStorage.getItem('qnamePrice');
                const storedQtextPrice = localStorage.getItem('qtextPrice');
                const storedQcapturePrice = localStorage.getItem('qcapturePrice');
                const storedQcaptureMonth1Price = localStorage.getItem('qcaptureMonth1Price');
                const storedQcaptureMonth3Price = localStorage.getItem('qcaptureMonth3Price');

                if (storedQnamePrice) setQnamePrice(Number(storedQnamePrice));
                if (storedQtextPrice) setQtextPrice(Number(storedQtextPrice));
                if (storedQcapturePrice) setQcapturePrice(Number(storedQcapturePrice));
                if (storedQcaptureMonth1Price) setQcaptureMonth1Price(Number(storedQcaptureMonth1Price));
                if (storedQcaptureMonth3Price) setQcaptureMonth3Price(Number(storedQcaptureMonth3Price));
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

    const handleQcaptureMonth1PriceChange = (price: number) => {
        setQcaptureMonth1Price(price);
        localStorage.setItem('qcaptureMonth1Price', price.toString());
    };

    const handleQcaptureMonth3PriceChange = (price: number) => {
        setQcaptureMonth3Price(price);
        localStorage.setItem('qcaptureMonth3Price', price.toString());
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