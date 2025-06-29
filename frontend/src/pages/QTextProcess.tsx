import React from 'react';

const QTextProcess: React.FC = () => {
    return (
        <div className="page-container py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-light text-gray-800 mb-4">🔄 Q텍스트 처리</h1>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">
                        Q텍스트 처리 페이지가 준비 중입니다.
                    </p>
                    <p className="text-blue-600 text-sm mt-2">
                        현재 이 기능은 개발 중입니다. 메인 Q텍스트 페이지를 이용해주세요.
                    </p>
                </div>
            </div>

            <div className="flex justify-center">
                <a
                    href="/qtext"
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Q텍스트 메인으로 이동
                </a>
            </div>
        </div>
    );
};

export default QTextProcess;
