import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string; // 오류 추적용 고유 ID
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void; errorId?: string }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 오류 추적용 고유 ID 생성
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // 🚨 프로덕션 오류 로깅 강화
    if (process.env.NODE_ENV === 'production') {
      this.logProductionError(error, errorInfo);
    } else {
      // 개발환경에서는 상세 로그
      console.error('🔍 개발환경 - ErrorBoundary 오류:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }

  // 🚨 프로덕션 오류 로깅 함수
  private logProductionError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorData = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId,
      // 민감한 정보는 제외
      environment: 'production'
    };

    // 1. 콘솔에 간단한 로그 (개발자용)
    console.error('🚨 프로덕션 오류 발생:', {
      message: error.message,
      errorId: this.state.errorId,
      timestamp: errorData.timestamp
    });

    // 2. 로컬 스토리지에 오류 기록 (임시)
    try {
      const errorLog = JSON.parse(localStorage.getItem('ERROR_LOG') || '[]');
      errorLog.push({
        ...errorData,
        timestamp: new Date().toISOString()
      });

      // 최근 10개만 유지
      if (errorLog.length > 10) {
        errorLog.splice(0, errorLog.length - 10);
      }

      localStorage.setItem('ERROR_LOG', JSON.stringify(errorLog));
    } catch (e) {
      console.error('오류 로그 저장 실패:', e);
    }

    // 3. 서버로 오류 전송 (선택적)
    this.sendErrorToServer(errorData);
  };

  // 🚨 서버로 오류 전송 (선택적)
  private sendErrorToServer = async (errorData: any) => {
    try {
      // 실제 서버 엔드포인트가 있다면 여기서 전송
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });

      console.log('📡 오류 데이터 서버 전송 준비됨:', errorData.errorId);
    } catch (e) {
      console.error('서버 오류 전송 실패:', e);
    }
  };

  handleRetry = () => {
    console.log('🔄 ErrorBoundary - 재시도 시작');
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    });
  };

  handleGoHome = () => {
    console.log('🏠 ErrorBoundary - 홈으로 이동');
    window.location.href = '/';
  };

  handleReload = () => {
    console.log('🔄 ErrorBoundary - 페이지 새로고침');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent
          error={this.state.error}
          retry={this.handleRetry}
          errorId={this.state.errorId}
        />;
      }

      // 🎨 프로덕션 친화적인 오류 페이지
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 mx-4">
            <div className="text-center">
              {/* 오류 아이콘 */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* 오류 제목 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {process.env.NODE_ENV === 'production'
                  ? '일시적인 오류가 발생했습니다'
                  : '오류가 발생했습니다'
                }
              </h1>

              {/* 오류 메시지 */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {process.env.NODE_ENV === 'production'
                  ? '시스템에서 예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                  : '개발환경에서 오류가 발생했습니다. 콘솔을 확인해주세요.'
                }
              </p>

              {/* 오류 ID (프로덕션에서만 표시) */}
              {process.env.NODE_ENV === 'production' && this.state.errorId && (
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <p className="text-xs text-gray-500 mb-1">오류 ID (고객센터 문의시 필요):</p>
                  <p className="text-sm font-mono text-gray-700 break-all">{this.state.errorId}</p>
                </div>
              )}

              {/* 개발환경 상세 정보 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer font-medium text-sm text-gray-700 mb-2">
                    🔍 개발자 정보 (클릭하여 확장)
                  </summary>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {'\n\n'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* 액션 버튼들 */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  🔄 다시 시도
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  🏠 홈으로 이동
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  🔄 페이지 새로고침
                </button>
              </div>

              {/* 프로덕션 추가 안내 */}
              {process.env.NODE_ENV === 'production' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    문제가 지속될 경우 고객센터로 문의해주세요.<br />
                    오류 ID를 함께 전달해주시면 더 빠른 해결이 가능합니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 로딩 컴포넌트
export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = '로딩 중...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
    </div>
  );
};

// 에러 메시지 컴포넌트
export const ErrorMessage: React.FC<{
  message: string;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info'
}> = ({
  message,
  onRetry,
  type = 'error'
}) => {
    const colorClasses = {
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const iconColor = {
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
    };

    return (
      <div className={`border rounded-md p-4 ${colorClasses[type]}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className={`w-5 h-5 ${iconColor[type]}`} fill="currentColor" viewBox="0 0 20 20">
              {type === 'error' && (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
              {type === 'warning' && (
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              )}
              {type === 'info' && (
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              )}
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm underline hover:no-underline focus:outline-none"
              >
                다시 시도
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

// 성공 메시지 컴포넌트
export const SuccessMessage: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
      </div>
    </div>
  );
};

// 페이지별 오류 처리를 위한 컴포넌트들
export const PageErrorBoundary: React.FC<{
  children: React.ReactNode;
  pageName: string;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void; errorId?: string }>;
}> = ({ children, pageName, fallback }) => {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
};

// 특정 기능별 오류 처리
export const FeatureErrorBoundary: React.FC<{
  children: React.ReactNode;
  featureName: string;
  onError?: (error: Error) => void;
}> = ({ children, featureName, onError }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error(`🚨 ${featureName} 기능 오류:`, event.error);
      setError(event.error);
      setHasError(true);
      onError?.(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [featureName, onError]);

  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-red-800">{featureName} 기능 오류</span>
        </div>
        <p className="text-sm text-red-600 mb-3">
          {featureName} 기능에서 오류가 발생했습니다. 페이지를 새로고침해주세요.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          새로고침
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

// API 오류 처리 컴포넌트
export const APIErrorHandler: React.FC<{
  error: Error | null;
  onRetry?: () => void;
  message?: string;
}> = ({ error, onRetry, message }) => {
  if (!error) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="font-medium text-yellow-800">API 연결 오류</span>
      </div>
      <p className="text-sm text-yellow-700 mb-3">
        {message || '서버와의 연결에 문제가 발생했습니다.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
        >
          다시 시도
        </button>
      )}
    </div>
  );
};

// 네트워크 상태 모니터링
export const NetworkStatusMonitor: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 네트워크 연결 복구됨');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('🌐 네트워크 연결 끊어짐');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          네트워크 연결이 끊어졌습니다. 인터넷 연결을 확인해주세요.
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// 오류 로그 뷰어 (개발용)
export const ErrorLogViewer: React.FC = () => {
  const [errorLog, setErrorLog] = React.useState<any[]>([]);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      const log = JSON.parse(localStorage.getItem('ERROR_LOG') || '[]');
      setErrorLog(log);
    } catch (e) {
      console.error('오류 로그 파싱 실패:', e);
    }
  }, []);

  const clearLog = () => {
    localStorage.removeItem('ERROR_LOG');
    setErrorLog([]);
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700"
        title="오류 로그 보기"
      >
        🚨 {errorLog.length}
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 w-96 bg-white border rounded-lg shadow-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">오류 로그 ({errorLog.length})</h3>
            <button
              onClick={clearLog}
              className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
            >
              지우기
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {errorLog.length === 0 ? (
              <p className="text-gray-500 text-sm">오류 로그가 없습니다.</p>
            ) : (
              errorLog.map((error, index) => (
                <div key={index} className="border-b py-2 last:border-b-0">
                  <div className="text-xs text-gray-500">{error.timestamp}</div>
                  <div className="text-sm font-medium">{error.message}</div>
                  <div className="text-xs text-gray-600">{error.errorId}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorBoundary;
