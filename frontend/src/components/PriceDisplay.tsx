import React from 'react';

interface PriceDisplayProps {
    price: number;
    isLoading?: boolean;
    serviceName?: string;
    showLabel?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
    price,
    isLoading = false,
    serviceName = '서비스',
    showLabel = true
}) => {
    if (isLoading) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {showLabel && (
                            <span className="text-sm font-medium text-blue-800 mr-2">
                                {serviceName} 가격:
                            </span>
                        )}
                        <span className="text-sm text-blue-600">로딩 중...</span>
                    </div>
                    <div className="text-xs text-blue-600">
                        관리자가 설정한 현재 적용 가격
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {showLabel && (
                        <span className="text-sm font-medium text-blue-800 mr-2">
                            {serviceName} 가격:
                        </span>
                    )}
                    <span className="text-lg font-bold text-blue-600">
                        {price.toLocaleString()}원/건
                    </span>
                </div>
                <div className="text-xs text-blue-600">
                    관리자가 설정한 현재 적용 가격
                </div>
            </div>
        </div>
    );
};

export default PriceDisplay; 