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
    const [qnamePrice, setQnamePrice] = useState(() => {
        const saved = localStorage.getItem('qname_price');
        return saved ? parseInt(saved) : 50;
    });

    const [qtextPrice, setQtextPrice] = useState(() => {
        const saved = localStorage.getItem('qtext_price');
        return saved ? parseInt(saved) : 30;
    });

    const [qcapturePrice, setQcapturePrice] = useState(() => {
        const saved = localStorage.getItem('qcapture_price');
        return saved ? parseInt(saved) : 20;
    });

    // localStorage에 저장
    useEffect(() => {
        localStorage.setItem('qname_price', qnamePrice.toString());
    }, [qnamePrice]);

    useEffect(() => {
        localStorage.setItem('qtext_price', qtextPrice.toString());
    }, [qtextPrice]);

    useEffect(() => {
        localStorage.setItem('qcapture_price', qcapturePrice.toString());
    }, [qcapturePrice]);

    // 브라우저 간 동기화를 위한 storage 이벤트 리스너
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'qname_price' && e.newValue) {
                setQnamePrice(parseInt(e.newValue));
            }
            if (e.key === 'qtext_price' && e.newValue) {
                setQtextPrice(parseInt(e.newValue));
            }
            if (e.key === 'qcapture_price' && e.newValue) {
                setQcapturePrice(parseInt(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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